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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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

		// Start small, expand if the midpoint lands in a low-density area.
		int[] radiusMetersOptions = new int[] { 2500, 8000, 15000 };
		List<String> types = List.of("restaurant", "cafe", "bar");

		Map<String, Candidate> merged = Map.of();
		for (int radiusMeters : radiusMetersOptions) {
			merged = types.stream()
					.flatMap(type -> fetchNearby(lat, lng, radiusMeters, type, apiKey).stream())
					.collect(Collectors.toMap(
							c -> c.placeId,
							c -> c,
							(a, b) -> a.distanceMeters <= b.distanceMeters ? a : b));
			if (!merged.isEmpty()) {
				break;
			}
		}

		List<Candidate> sorted = new ArrayList<>(merged.values());
		sorted.sort((a, b) -> Double.compare(a.distanceMeters, b.distanceMeters));

		return sorted.stream()
				.limit(5)
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

	private List<Candidate> fetchNearby(double lat, double lng, int radiusMeters, String type, String apiKey) {
		String endpoint = "https://places.googleapis.com/v1/places:searchNearby";

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.set("X-Goog-Api-Key", apiKey);
		headers.set("X-Goog-FieldMask", "places.id,places.displayName,places.location");

		Map<String, Object> body = Map.of(
				"includedTypes", List.of(type),
				"maxResultCount", 20,
				"locationRestriction", Map.of(
						"circle", Map.of(
								"center", Map.of("latitude", lat, "longitude", lng),
								"radius", radiusMeters)));

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
			return List.of();
		}

		Object placesObj = respBody.get("places");
		if (!(placesObj instanceof List<?> placesList) || placesList.isEmpty()) {
			return List.of();
		}

		List<Candidate> out = new ArrayList<>();
		for (Object placeObj : placesList) {
			if (!(placeObj instanceof Map<?, ?> placeMap))
				continue;

			Object idObj = placeMap.get("id");
			Object displayNameObj = placeMap.get("displayName");
			Object locationObj = placeMap.get("location");
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

			double dist = haversineMeters(lat, lng, pLat, pLng);
			out.add(new Candidate(placeId, name, pLat, pLng, dist));
		}

		return out;
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

	private record Candidate(String placeId, String name, double lat, double lng, double distanceMeters) {
	}

}
