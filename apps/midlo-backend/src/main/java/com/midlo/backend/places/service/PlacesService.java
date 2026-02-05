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
		final int targetUniquePlaces = 30;
		final int minRawPoolTarget = 60; // ensures we can still reach 30 after filtering/dedup
		final double minRating = 2.5;
		final int baseRadiusMeters = 8000; // keep midpoint fairness; only small jitter applied per query
		final Random random = new Random();

		List<String> types = List.of("restaurant", "cafe", "bar", "food", "meal_takeaway", "meal_delivery");
		List<String> keywords = List.of("restaurant", "food", "eat", "lunch", "dinner", "coffee");

		List<QuerySpec> queryPlan = new ArrayList<>();
		for (String type : types) {
			queryPlan.add(QuerySpec.nearbyType(type));
		}
		for (String keyword : keywords) {
			queryPlan.add(QuerySpec.textKeyword(keyword));
		}
		Collections.shuffle(queryPlan, random);

		Map<String, Candidate> byPlaceId = new HashMap<>();
		List<Candidate> raw = new ArrayList<>();
		ApiException lastFailure = null;

		for (QuerySpec spec : queryPlan) {
			int jitteredRadius = jitterRadiusMeters(baseRadiusMeters, random);
			FetchResult first;
			try {
				first = switch (spec.kind) {
					case NEARBY_TYPE -> fetchNearby(lat, lng, jitteredRadius, spec.value, apiKey, null);
					case TEXT_KEYWORD -> fetchText(lat, lng, jitteredRadius, spec.value, apiKey, null);
				};
			} catch (ApiException e) {
				lastFailure = e;
				continue;
			}
			raw.addAll(first.candidates);
			for (Candidate c : first.candidates) {
				byPlaceId.putIfAbsent(c.placeId, c);
			}

			// For each query, follow pagination token when available.
			String nextToken = first.nextPageToken;

			int pages = 1;
			while (nextToken != null && !nextToken.isBlank() && pages < 3
					&& (raw.size() < minRawPoolTarget || countHighQualityUnique(byPlaceId.values(), minRating) < targetUniquePlaces)) {
				pages++;
				sleepForPaginationToken();
				FetchResult next;
				try {
					next = switch (spec.kind) {
						case NEARBY_TYPE -> fetchNearby(lat, lng, jitteredRadius, spec.value, apiKey, nextToken);
						case TEXT_KEYWORD -> fetchText(lat, lng, jitteredRadius, spec.value, apiKey, nextToken);
					};
				} catch (ApiException e) {
					lastFailure = e;
					break;
				}
				raw.addAll(next.candidates);
				for (Candidate c : next.candidates) {
					byPlaceId.putIfAbsent(c.placeId, c);
				}
				nextToken = next.nextPageToken;
			}

			if (raw.size() >= minRawPoolTarget && countHighQualityUnique(byPlaceId.values(), minRating) >= targetUniquePlaces) {
				break;
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
			// Name+address dedupe might have pushed us under; relax rating filter to preserve variety.
			dedupedByNameAddress = dedupeByNameAndAddress(withCoords);
		}

		List<Candidate> finalList = new ArrayList<>(dedupedByNameAddress);
		Collections.shuffle(finalList, random);

		return finalList.stream()
				.limit(targetUniquePlaces)
				.map(c -> new PlaceResponse(c.placeId, c.name, formatDistanceMiles(c.distanceMeters), c.lat, c.lng))
				.toList();
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

	private FetchResult fetchNearby(double lat, double lng, int radiusMeters, String type, String apiKey, String pageToken) {
		String endpoint = "https://places.googleapis.com/v1/places:searchNearby";

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.set("X-Goog-Api-Key", apiKey);
		headers.set("X-Goog-FieldMask",
				"places.id,places.displayName,places.location,places.formattedAddress,places.rating,nextPageToken");

		Map<String, Object> body = new HashMap<>();
		body.put("includedTypes", List.of(type));
		body.put("maxResultCount", 20);
		body.put("locationRestriction", Map.of(
				"circle", Map.of(
						"center", Map.of("latitude", lat, "longitude", lng),
						"radius", radiusMeters)));
		if (pageToken != null && !pageToken.isBlank()) {
			body.put("pageToken", pageToken);
		}

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
		String nextPageToken = (respBody.get("nextPageToken") instanceof String t) ? t : null;

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

	private FetchResult fetchText(double lat, double lng, int radiusMeters, String keyword, String apiKey, String pageToken) {
		String endpoint = "https://places.googleapis.com/v1/places:searchText";

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.set("X-Goog-Api-Key", apiKey);
		headers.set("X-Goog-FieldMask",
				"places.id,places.displayName,places.location,places.formattedAddress,places.rating,nextPageToken");

		Map<String, Object> body = new HashMap<>();
		body.put("textQuery", keyword);
		body.put("maxResultCount", 20);
		body.put("locationRestriction", Map.of(
				"circle", Map.of(
						"center", Map.of("latitude", lat, "longitude", lng),
						"radius", radiusMeters)));
		if (pageToken != null && !pageToken.isBlank()) {
			body.put("pageToken", pageToken);
		}

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
		String nextPageToken = (respBody.get("nextPageToken") instanceof String t) ? t : null;

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

	private static int jitterRadiusMeters(int baseRadiusMeters, Random random) {
		// ±5–10% jitter (never expands beyond this).
		double jitter = 0.05 + (random.nextDouble() * 0.05);
		double sign = random.nextBoolean() ? 1.0 : -1.0;
		double factor = 1.0 + (sign * jitter);
		int radius = (int) Math.round(baseRadiusMeters * factor);
		return Math.max(1, radius);
	}

	private static void sleepForPaginationToken() {
		// Some Google Places pagination tokens may need a short delay before becoming valid.
		try {
			Thread.sleep(1100);
		} catch (InterruptedException ignored) {
			Thread.currentThread().interrupt();
		}
	}

	private static int countHighQualityUnique(Iterable<Candidate> candidates, double minRating) {
		int count = 0;
		for (Candidate c : candidates) {
			if (c.lat == null || c.lng == null) continue;
			if (c.rating != null && c.rating < minRating) continue;
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
		if (s == null) return "";
		String base = s.trim().toLowerCase(Locale.US);
		base = base.replaceAll("[^a-z0-9]+", " ");
		base = base.replaceAll("\\s+", " ").trim();
		return base;
	}

	private enum QueryKind {
		NEARBY_TYPE,
		TEXT_KEYWORD
	}

	private record QuerySpec(QueryKind kind, String value) {
		static QuerySpec nearbyType(String type) {
			return new QuerySpec(QueryKind.NEARBY_TYPE, type);
		}

		static QuerySpec textKeyword(String keyword) {
			return new QuerySpec(QueryKind.TEXT_KEYWORD, keyword);
		}
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

	private record Candidate(String placeId, String name, String formattedAddress, Double rating, Double lat, Double lng,
			double distanceMeters) {
	}

}
