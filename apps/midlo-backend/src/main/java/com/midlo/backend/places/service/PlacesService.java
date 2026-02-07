package com.midlo.backend.places.service;

import com.midlo.backend.integrations.google.GoogleMapsProperties;
import com.midlo.backend.places.dto.PlaceResponse;
import com.midlo.backend.places.dto.PlacesRequest;
import com.midlo.backend.shared.exception.ApiException;
import org.springframework.core.env.Environment;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;

@Service
public class PlacesService {

	private final GoogleMapsProperties googleMapsProperties;
	private final boolean allowMockGoogle;
	private final RestTemplate restTemplate;

	public PlacesService(GoogleMapsProperties googleMapsProperties, Environment environment) {
		this.googleMapsProperties = googleMapsProperties;
		this.allowMockGoogle = Arrays.asList(environment.getActiveProfiles()).contains("local");
		this.restTemplate = new RestTemplate();
	}

	public List<PlaceResponse> getMockPlaces(PlacesRequest request) {
		// NOTE: method name kept for API stability; now returns REAL places.
		String apiKey = (googleMapsProperties.apiKey() == null) ? "" : googleMapsProperties.apiKey().trim();
		if (apiKey.isBlank()) {
			if (allowMockGoogle) {
				return mockPlaces(request);
			}
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
					"Missing GOOGLE_MAPS_API_KEY (Google Maps Platform)");
		}

		double lat = request.lat();
		double lng = request.lng();

		// Goal: provide enough unique options for 6 batches × 5 places = 30.
		// But critically: never return an empty list. If the midpoint is rural,
		// progressively expand the search radius and broaden types.
		final int targetUniquePlaces = 30;
		final double minRating = 2.5;
		final Random random = new Random();

		// Keep this 100% on places:searchNearby (stable payload shape).
		// places:searchText has been a frequent source of INVALID_ARGUMENT due to
		// stricter request schema.
		final List<String> primaryTypes = List.of(
				"restaurant",
				"cafe",
				"bar",
				"bakery",
				"meal_takeaway",
				"meal_delivery",
				"park",
				"tourist_attraction",
				"movie_theater",
				"bowling_alley",
				"museum",
				"shopping_mall");

		// Fallback types for rural areas where the "fun" categories might not exist
		// nearby.
		final List<String> fallbackTypes = List.of(
				"gas_station",
				"supermarket",
				"grocery_store",
				"convenience_store",
				"lodging",
				"pharmacy");

		// Expand radius until we have enough candidates.
		// Note: Places API enforces an upper bound; keep within a safe ceiling.
		final int maxRadiusMeters = 50_000;
		final List<Integer> radiusPlanMeters = List.of(8_000, 15_000, 25_000, 40_000, maxRadiusMeters);

		// Keep latency bounded: cap total calls across all radii.
		// (Higher than before so rescans can still have 5 fresh options.)
		final int maxTotalQueries = 40;

		Map<String, Candidate> byPlaceId = new HashMap<>();
		ApiException lastFailure = null;
		int queriesRun = 0;

		outer: for (int radiusMeters : radiusPlanMeters) {
			List<String> queryPlan = new ArrayList<>();
			queryPlan.addAll(primaryTypes);
			if (radiusMeters >= 25_000) {
				queryPlan.addAll(fallbackTypes);
			}
			Collections.shuffle(queryPlan, random);

			for (String type : queryPlan) {
				if (queriesRun >= maxTotalQueries) {
					break outer;
				}
				int jitteredRadius = jitterWithinMax(radiusMeters, maxRadiusMeters, random);
				FetchResult first;
				try {
					first = fetchNearby(lat, lng, jitteredRadius, type, apiKey);
				} catch (ApiException e) {
					lastFailure = e;
					queriesRun++;
					continue;
				}
				queriesRun++;
				for (Candidate c : first.candidates) {
					byPlaceId.putIfAbsent(c.placeId, c);
				}

				int highQuality = countHighQualityUnique(byPlaceId.values(), minRating);
				int withCoords = countWithCoords(byPlaceId.values());
				if (highQuality >= targetUniquePlaces || withCoords >= targetUniquePlaces) {
					break outer;
				}
			}
		}

		// If we still have too few options, do a final broad pass using a few
		// nearby centers to avoid the case where the midpoint lands in a sparse
		// area between towns.
		if (countWithCoords(byPlaceId.values()) < targetUniquePlaces && queriesRun < maxTotalQueries) {
			List<double[]> centers = new ArrayList<>();
			centers.addAll(buildFallbackCenters(lat, lng, 35_000));
			centers.addAll(buildFallbackCenters(lat, lng, 80_000));
			centers.addAll(buildFallbackCenters(lat, lng, 150_000));
			centers.addAll(buildFallbackCenters(lat, lng, 250_000));
			// Deduplicate identical centers (can happen near poles / extreme latitudes)
			centers = centers.stream().distinct().toList();

			List<String> finalTypes = new ArrayList<>();
			finalTypes.addAll(fallbackTypes);
			finalTypes.addAll(primaryTypes);
			Collections.shuffle(finalTypes, random);

			for (double[] center : centers) {
				if (queriesRun >= maxTotalQueries) break;
				double cLat = center[0];
				double cLng = center[1];
				for (String type : finalTypes) {
					if (queriesRun >= maxTotalQueries) break;
					FetchResult r;
					try {
						r = fetchNearby(cLat, cLng, maxRadiusMeters, type, apiKey);
					} catch (ApiException e) {
						lastFailure = e;
						queriesRun++;
						continue;
					}
					queriesRun++;
					for (Candidate c : r.candidates) {
						// Distance should still be from the true midpoint for fairness.
						double dist = haversineMeters(lat, lng, c.lat, c.lng);
						byPlaceId.putIfAbsent(c.placeId, new Candidate(
								c.placeId,
								c.name,
								c.formattedAddress,
								c.rating,
								c.lat,
								c.lng,
								dist));
					}
					if (countWithCoords(byPlaceId.values()) >= targetUniquePlaces) {
						break;
					}
				}
				if (countWithCoords(byPlaceId.values()) >= targetUniquePlaces) {
					break;
				}
			}
		}

		if (byPlaceId.isEmpty() && lastFailure != null) {
			throw lastFailure;
		}

		// Quality filtering & strict dedup by place_id
		// - Always remove missing coordinates
		// - Only remove very low ratings when we can still fill 30
		List<Candidate> withCoords = byPlaceId.values().stream()
				.filter(c -> c.lat != null && c.lng != null)
				.toList();

		List<Candidate> ratingFiltered = withCoords.stream()
				.filter(c -> c.rating == null || c.rating >= minRating)
				.toList();

		List<Candidate> qualityPool = ratingFiltered.size() >= targetUniquePlaces ? ratingFiltered : withCoords;

		// Additional dedupe for Google variants: name + address
		List<Candidate> dedupedByNameAddress = dedupeByNameAndAddress(qualityPool);
		if (dedupedByNameAddress.size() < targetUniquePlaces && qualityPool == ratingFiltered) {
			// Name+address dedupe might have pushed us under; relax rating filter to
			// preserve variety.
			dedupedByNameAddress = dedupeByNameAndAddress(withCoords);
		}

		List<Candidate> finalList = new ArrayList<>(dedupedByNameAddress);
		Collections.shuffle(finalList, random);

		return finalList.stream()
				.limit(targetUniquePlaces)
				.map(c -> new PlaceResponse(c.placeId, c.name, formatDistanceMiles(c.distanceMeters), c.lat, c.lng))
				.toList();
	}

	private static int countWithCoords(Iterable<Candidate> candidates) {
		int count = 0;
		for (Candidate c : candidates) {
			if (c.lat == null || c.lng == null) continue;
			count++;
		}
		return count;
	}

	private static int jitterWithinMax(int radiusMeters, int maxRadiusMeters, Random random) {
		// Randomize slightly without ever exceeding the configured ceiling.
		// (Some Places backends enforce strict radius max.)
		double factor = 0.90 + (random.nextDouble() * 0.10); // 0.90..1.00
		int radius = (int) Math.round(radiusMeters * factor);
		radius = Math.max(1, radius);
		return Math.min(radius, maxRadiusMeters);
	}

	private static List<double[]> buildFallbackCenters(double lat, double lng, int offsetMeters) {
		// Approximate meters→degrees. Good enough for shifting a search window.
		double latRad = Math.toRadians(lat);
		double metersPerDegLat = 111_320.0;
		double metersPerDegLng = Math.max(1.0, metersPerDegLat * Math.cos(latRad));
		double dLat = offsetMeters / metersPerDegLat;
		double dLng = offsetMeters / metersPerDegLng;

		List<double[]> centers = new ArrayList<>();
		centers.add(new double[] { lat, lng });
		centers.add(new double[] { lat + dLat, lng });
		centers.add(new double[] { lat - dLat, lng });
		centers.add(new double[] { lat, lng + dLng });
		centers.add(new double[] { lat, lng - dLng });
		centers.add(new double[] { lat + dLat, lng + dLng });
		centers.add(new double[] { lat + dLat, lng - dLng });
		centers.add(new double[] { lat - dLat, lng + dLng });
		centers.add(new double[] { lat - dLat, lng - dLng });
		return centers;
	}

	private static List<PlaceResponse> mockPlaces(PlacesRequest request) {
		double lat = request.lat();
		double lng = request.lng();
		// Simple deterministic offsets so markers look realistic.
		return List.of(
				new PlaceResponse("mock_place_1", "Mock Cafe", "0.4 mi", lat + 0.0032, lng - 0.0021),
				new PlaceResponse("mock_place_2", "Mock Restaurant", "0.7 mi", lat - 0.0041, lng + 0.0019),
				new PlaceResponse("mock_place_3", "Mock Bar", "1.1 mi", lat + 0.0014, lng + 0.0042),
				new PlaceResponse("mock_place_4", "Mock Bakery", "1.6 mi", lat - 0.0053, lng - 0.0038),
				new PlaceResponse("mock_place_5", "Mock Coffee", "2.0 mi", lat + 0.0061, lng + 0.0007));
	}

	private FetchResult fetchNearby(double lat, double lng, int radiusMeters, String type, String apiKey) {
		String endpoint = "https://places.googleapis.com/v1/places:searchNearby";

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.set("X-Goog-Api-Key", apiKey);
		headers.set("X-Goog-FieldMask",
				"places.id,places.displayName,places.location,places.formattedAddress,places.rating");

		Map<String, Object> body = new HashMap<>();
		body.put("includedTypes", List.of(type));
		body.put("maxResultCount", 20);
		body.put("locationRestriction", Map.of(
				"circle", Map.of(
						"center", Map.of("latitude", lat, "longitude", lng),
						"radius", radiusMeters)));
		// places.searchNearby does not support pagination tokens.

		ResponseEntity<Map<String, Object>> resp;
		try {
			resp = restTemplate.exchange(
					endpoint,
					Objects.requireNonNull(HttpMethod.POST),
					new HttpEntity<>(body, headers),
					new ParameterizedTypeReference<>() {
					});
		} catch (HttpStatusCodeException e) {
			String details = e.getResponseBodyAsString() == null ? "" : e.getResponseBodyAsString().trim();
			String suffix = details.isBlank() ? "" : " - " + details;
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Places failed" + suffix);
		} catch (RestClientException e) {
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Places service unavailable");
		}

		Map<String, Object> respBody = resp.getBody();
		if (respBody == null) {
			return new FetchResult(List.of(), null);
		}
		String nextPageToken = null;

		Object placesObj = respBody.get("places");
		if (!(placesObj instanceof List<?> placesList) || placesList.isEmpty()) {
			return new FetchResult(List.of(), nextPageToken);
		}

		List<Candidate> out = new ArrayList<>();
		for (Object placeObj : placesList) {
			if (!(placeObj instanceof Map<?, ?> placeMap))
				continue;

			Object idObj = placeMap.get("id");
			Object displayNameObj = placeMap.get("displayName");
			Object locationObj = placeMap.get("location");
			Object addrObj = placeMap.get("formattedAddress");
			Object ratingObj = placeMap.get("rating");
			if (!(idObj instanceof String placeId))
				continue;
			if (!(locationObj instanceof Map<?, ?> locMap))
				continue;
			Double pLat = toDouble(locMap.get("latitude"));
			Double pLng = toDouble(locMap.get("longitude"));
			if (pLat == null || pLng == null)
				continue;

			String name = null;
			if (displayNameObj instanceof Map<?, ?> dnMap) {
				Object textObj = dnMap.get("text");
				if (textObj instanceof String t)
					name = t;
			}
			if (name == null)
				continue;

			String address = (addrObj instanceof String s && !s.isBlank()) ? s : null;
			Double rating = toDouble(ratingObj);

			double dist = haversineMeters(lat, lng, pLat, pLng);
			out.add(new Candidate(placeId, name, address, rating, pLat, pLng, dist));
		}

		return new FetchResult(out, nextPageToken);
	}

	private record FetchResult(List<Candidate> candidates, String nextPageToken) {
	}


	private static int countHighQualityUnique(Iterable<Candidate> candidates, double minRating) {
		int count = 0;
		for (Candidate c : candidates) {
			if (c.lat == null || c.lng == null)
				continue;
			if (c.rating != null && c.rating < minRating)
				continue;
			count++;
		}
		return count;
	}

	private static List<Candidate> dedupeByNameAndAddress(List<Candidate> candidates) {
		Map<String, Candidate> bestByKey = new HashMap<>();
		for (Candidate c : candidates) {
			String nameKey = normalizeKey(c.name);
			String addressKey = normalizeKey(c.formattedAddress);
			if (nameKey.isBlank() || addressKey.isBlank()) {
				// If address is missing, don't coalesce; place_id dedupe already handled.
				String k = "__pid__" + c.placeId;
				bestByKey.putIfAbsent(k, c);
				continue;
			}
			String key = nameKey + "|" + addressKey;
			Candidate existing = bestByKey.get(key);
			if (existing == null) {
				bestByKey.put(key, c);
				continue;
			}

			// Prefer higher rating, then closer distance.
			double existingRating = existing.rating == null ? -1.0 : existing.rating;
			double currentRating = c.rating == null ? -1.0 : c.rating;
			boolean shouldReplace = false;
			if (currentRating > existingRating) {
				shouldReplace = true;
			} else if (currentRating == existingRating && c.distanceMeters < existing.distanceMeters) {
				shouldReplace = true;
			}
			if (shouldReplace) {
				bestByKey.put(key, c);
			}
		}

		return new ArrayList<>(bestByKey.values());
	}

	private static String normalizeKey(String s) {
		if (s == null)
			return "";
		String base = s.trim().toLowerCase(Locale.US);
		base = base.replaceAll("[^a-z0-9]+", " ");
		base = base.replaceAll("\\s+", " ").trim();
		return base;
	}

	private static Double toDouble(Object v) {
		if (v instanceof Number n)
			return n.doubleValue();
		if (v instanceof String s) {
			try {
				return Double.parseDouble(s);
			} catch (NumberFormatException ignored) {
				return null;
			}
		}
		return null;
	}

	private static String formatDistanceMiles(double meters) {
		double miles = meters / 1609.344;
		if (miles < 1.0) {
			return String.format(Locale.US, "%.1f mi", miles);
		}
		return String.format(Locale.US, "%.1f mi", miles);
	}

	private static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
		double r = 6371000.0;
		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);
		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
						* Math.sin(dLon / 2) * Math.sin(dLon / 2);
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return r * c;
	}

	private record Candidate(String placeId, String name, String formattedAddress, Double rating, Double lat,
			Double lng,
			double distanceMeters) {
	}

}
