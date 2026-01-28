package com.midlo.backend.autocomplete.service;

import com.midlo.backend.autocomplete.dto.AutocompleteSuggestion;
import com.midlo.backend.integrations.google.GoogleMapsProperties;
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

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Arrays;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

@Service
public class AutocompleteService {

	private final GoogleMapsProperties googleMapsProperties;
	private final boolean allowMockGoogle;
	private final RestTemplate restTemplate;

	public AutocompleteService(GoogleMapsProperties googleMapsProperties, Environment environment) {
		this.googleMapsProperties = googleMapsProperties;
		this.allowMockGoogle = Arrays.asList(environment.getActiveProfiles()).contains("local");
		this.restTemplate = new RestTemplate();
	}

	public List<AutocompleteSuggestion> suggest(String input) {
		String apiKey = (googleMapsProperties.apiKey() == null) ? "" : googleMapsProperties.apiKey().trim();
		String trimmed = input == null ? "" : input.trim();
		if (trimmed.length() < 3) {
			return List.of();
		}

		if (apiKey.isBlank()) {
			if (allowMockGoogle) {
				return mockSuggestions(trimmed);
			}
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
					"Missing GOOGLE_MAPS_API_KEY (Google Maps Platform)");
		}

		String endpoint = "https://places.googleapis.com/v1/places:autocomplete";

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.set("X-Goog-Api-Key", apiKey);
		headers.set("X-Goog-FieldMask", "suggestions.placePrediction.placeId,suggestions.placePrediction.text");

		Map<String, Object> body = Map.of(
				"input", trimmed);

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
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Autocomplete failed" + suffix);
		} catch (RestClientException e) {
			throw new ApiException(HttpStatus.BAD_GATEWAY, "Autocomplete service unavailable");
		}

		Map<String, Object> respBody = resp.getBody();
		if (respBody == null) {
			return List.of();
		}

		Object suggestionsObj = respBody.get("suggestions");
		if (!(suggestionsObj instanceof List<?> suggestionsList) || suggestionsList.isEmpty()) {
			return List.of();
		}

		return suggestionsList.stream()
				.limit(6)
				.map((Object s) -> {
					if (!(s instanceof Map<?, ?> sMap))
						return null;
					Object ppObj = sMap.get("placePrediction");
					if (!(ppObj instanceof Map<?, ?> ppMap))
						return null;
					Object placeIdObj = ppMap.get("placeId");
					if (!(placeIdObj instanceof String placeId))
						return null;
					String description = null;
					Object textObj = ppMap.get("text");
					if (textObj instanceof Map<?, ?> textMap) {
						Object t = textMap.get("text");
						if (t instanceof String ts)
							description = ts;
					} else if (textObj instanceof String ts) {
						description = ts;
					}
					if (description == null || description.isBlank())
						return null;
					return new AutocompleteSuggestion(placeId, description);
				})
				.filter(s -> s != null)
				.toList();
	}

	private static List<AutocompleteSuggestion> mockSuggestions(String trimmed) {
		// Small, deterministic list for UI testing.
		String base = trimmed.replaceAll("\\s+", " ").trim();
		String id1 = "mock_" + Long.toHexString(crc32("1|" + base));
		String id2 = "mock_" + Long.toHexString(crc32("2|" + base));
		return List.of(
				new AutocompleteSuggestion(id1, base + " (mock)"),
				new AutocompleteSuggestion(id2, base + " Downtown (mock)"));
	}

	private static long crc32(String s) {
		CRC32 crc = new CRC32();
		crc.update(s.getBytes(StandardCharsets.UTF_8));
		return crc.getValue();
	}
}
