package com.midlo.backend.midpoint.service;

import com.midlo.backend.integrations.google.GoogleMapsProperties;
import com.midlo.backend.midpoint.dto.MidpointRequest;
import com.midlo.backend.midpoint.dto.MidpointResponse;
import com.midlo.backend.shared.exception.ApiException;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import org.springframework.http.HttpStatus;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.zip.CRC32;

import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class MidpointService {

	private final GoogleMapsProperties googleMapsProperties;
	private final boolean allowMockGoogle;
	private final RestTemplate restTemplate;

	public MidpointService(GoogleMapsProperties googleMapsProperties, Environment environment) {
		this.googleMapsProperties = googleMapsProperties;
		this.allowMockGoogle = Arrays.asList(environment.getActiveProfiles()).contains("local");
		this.restTemplate = new RestTemplate();
	}

	public MidpointResponse calculateMidpoint(MidpointRequest request) {
		var coordA = geocodeOrThrow(request.addressA());
		var coordB = geocodeOrThrow(request.addressB());

		var lat = (coordA.lat + coordB.lat) / 2.0;
		var lng = (coordA.lng + coordB.lng) / 2.0;

		return new MidpointResponse(lat, lng);
	}

	private Coordinate geocodeOrThrow(String address) {
		String apiKey = (googleMapsProperties.apiKey() == null) ? "" : googleMapsProperties.apiKey().trim();
		String trimmed = address == null ? "" : address.trim();
		if (apiKey.isBlank()) {
			if (allowMockGoogle) {
				return mockCoordinate(trimmed);
			}
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
					"Missing GOOGLE_MAPS_API_KEY (Google Maps Platform)");
		}

		if (trimmed.isBlank() || trimmed.length() < 3) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a real address (at least 3 characters)");
		}

		URI uri = UriComponentsBuilder
				.fromUriString("https://maps.googleapis.com/maps/api/geocode/json")
				.queryParam("address", trimmed)
				.queryParam("key", apiKey)
				.build()
				.encode()
				.toUri();

		GeocodeResponse resp;
		try {
			resp = restTemplate.getForObject(uri, GeocodeResponse.class);
		} catch (RestClientException e) {
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Geocoding service unavailable");
		}

		if (resp == null || resp.status == null) {
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Geocoding returned no response");
		}

		if (!"OK".equals(resp.status)) {
			if ("ZERO_RESULTS".equals(resp.status)) {
				throw new ApiException(HttpStatus.BAD_REQUEST, "Could not find that address. Try adding city/state.");
			}
			String details = (resp.error_message == null) ? "" : resp.error_message.trim();
			String suffix = details.isBlank() ? "" : " - " + details;
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Geocoding failed: " + resp.status + suffix);
		}

		GeocodeResult first = (resp.results == null || resp.results.isEmpty()) ? null : resp.results.get(0);
		if (first == null || first.geometry == null || first.geometry.location == null) {
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Geocoding returned no location");
		}

		return new Coordinate(first.geometry.location.lat, first.geometry.location.lng);
	}

	private static Coordinate mockCoordinate(String address) {
		String trimmed = address == null ? "" : address.trim();
		if (trimmed.isBlank() || trimmed.length() < 3) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Please enter a real address (at least 3 characters)");
		}

		// Deterministic pseudo-geocode for local testing without a Google API key.
		// Roughly within the contiguous US.
		long h1 = crc32("A|" + trimmed);
		long h2 = crc32("B|" + trimmed);
		double r1 = (h1 & 0xffffffffL) / (double) 0xffffffffL;
		double r2 = (h2 & 0xffffffffL) / (double) 0xffffffffL;

		double lat = 24.0 + (r1 * 25.0); // 24..49
		double lng = -125.0 + (r2 * 59.0); // -125..-66
		return new Coordinate(lat, lng);
	}

	private static long crc32(String s) {
		CRC32 crc = new CRC32();
		crc.update(s.getBytes(StandardCharsets.UTF_8));
		return crc.getValue();
	}

	private record Coordinate(double lat, double lng) {
	}

	private static class GeocodeResponse {
		public String status;
		public String error_message;
		public List<GeocodeResult> results;
	}

	private static class GeocodeResult {
		public GeocodeGeometry geometry;
	}

	private static class GeocodeGeometry {
		public GeocodeLocation location;
	}

	private static class GeocodeLocation {
		public double lat;
		public double lng;
	}
}
