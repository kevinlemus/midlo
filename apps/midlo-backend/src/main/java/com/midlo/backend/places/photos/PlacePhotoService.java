package com.midlo.backend.places.photos;

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

import java.util.Map;
import java.util.Objects;
import java.util.Arrays;

@Service
public class PlacePhotoService {
    private final GoogleMapsProperties googleMapsProperties;
    private final boolean allowMockGoogle;
    private final RestTemplate restTemplate;

    public PlacePhotoService(GoogleMapsProperties googleMapsProperties, Environment environment) {
        this.googleMapsProperties = googleMapsProperties;
        this.allowMockGoogle = Arrays.asList(environment.getActiveProfiles()).contains("local");
        this.restTemplate = new RestTemplate();
    }

    public String resolvePhotoUri(String name, Integer maxWidthPx, Integer maxHeightPx) {
        String apiKey = (googleMapsProperties.apiKey() == null) ? "" : googleMapsProperties.apiKey().trim();
        if (apiKey.isBlank() && allowMockGoogle) {
            int w = (maxWidthPx == null || maxWidthPx <= 0) ? 1200 : Math.min(maxWidthPx, 2000);
            int h = (maxHeightPx == null || maxHeightPx <= 0) ? 800 : Math.min(maxHeightPx, 2000);
            return "https://placehold.co/" + w + "x" + h + "?text=Midlo%20Mock%20Photo";
        }

        if (apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Missing GOOGLE_MAPS_API_KEY (Google Maps Platform)");
        }

        String trimmed = name == null ? "" : name.trim();
        if (trimmed.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing photo name");
        }

        // Basic validation to avoid misuse; Google names look like:
        // places/{placeId}/photos/{photoId}
        if (!trimmed.startsWith("places/") || trimmed.contains("..")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid photo name");
        }

        int w = (maxWidthPx == null || maxWidthPx <= 0) ? 1200 : Math.min(maxWidthPx, 2000);
        Integer h = (maxHeightPx == null || maxHeightPx <= 0) ? null : Math.min(maxHeightPx, 2000);

        StringBuilder endpoint = new StringBuilder("https://places.googleapis.com/v1/")
                .append(trimmed)
                .append("/media?skipHttpRedirect=true")
                .append("&maxWidthPx=")
                .append(w);
        if (h != null) {
            endpoint.append("&maxHeightPx=").append(h);
        }

        String endpointUrl = Objects.requireNonNull(endpoint.toString(), "endpointUrl");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Goog-Api-Key", apiKey);
        headers.set("X-Goog-FieldMask", "photoUri");

        ResponseEntity<Map<String, Object>> resp;
        try {
            resp = restTemplate.exchange(
                    endpointUrl,
                    Objects.requireNonNull(HttpMethod.GET),
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {
                    });
        } catch (HttpStatusCodeException e) {
            String details = e.getResponseBodyAsString() == null ? "" : e.getResponseBodyAsString().trim();
            String suffix = details.isBlank() ? "" : " - " + details;
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Photo lookup failed" + suffix);
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Photo service unavailable");
        }

        Map<String, Object> body = resp.getBody();
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Photo lookup returned empty response");
        }

        String photoUri = body.get("photoUri") instanceof String s ? s : null;
        if (photoUri == null || photoUri.isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Photo lookup did not return a photoUri");
        }

        return photoUri;
    }
}
