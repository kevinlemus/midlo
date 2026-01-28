package com.midlo.backend.places.details;

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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class PlaceDetailsService {
    private final GoogleMapsProperties googleMapsProperties;
    private final boolean allowMockGoogle;
    private final RestTemplate restTemplate;

    public PlaceDetailsService(GoogleMapsProperties googleMapsProperties, Environment environment) {
        this.googleMapsProperties = googleMapsProperties;
        this.allowMockGoogle = Arrays.asList(environment.getActiveProfiles()).contains("local");
        this.restTemplate = new RestTemplate();
    }

    public PlaceDetailsResponse getPlaceDetails(String placeId) {
        String apiKey = (googleMapsProperties.apiKey() == null) ? "" : googleMapsProperties.apiKey().trim();
        if (placeId == null || placeId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing placeId");
        }

        if (apiKey.isBlank()) {
            if (allowMockGoogle) {
                return new PlaceDetailsResponse(
                        placeId,
                        "Mock Place Details",
                        "123 Mock St, Test City",
                        0,
                        0,
                        4.6,
                        128,
                        "https://maps.google.com",
                        null,
                        null,
                        null,
                        List.of("Mon–Fri: 9:00 AM – 6:00 PM", "Sat–Sun: 10:00 AM – 4:00 PM"),
                        null);
            }
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Missing GOOGLE_MAPS_API_KEY (Google Maps Platform)");
        }

        String endpoint = "https://places.googleapis.com/v1/places/" + placeId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Goog-Api-Key", apiKey);
        headers.set(
                "X-Goog-FieldMask",
                "id,displayName,formattedAddress,location,rating,userRatingCount,googleMapsUri,websiteUri,internationalPhoneNumber,currentOpeningHours,regularOpeningHours,photos");

        ResponseEntity<Map<String, Object>> resp;
        try {
            resp = restTemplate.exchange(
                    endpoint,
                    Objects.requireNonNull(HttpMethod.GET),
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {
                    });
        } catch (HttpStatusCodeException e) {
            String details = e.getResponseBodyAsString() == null ? "" : e.getResponseBodyAsString().trim();
            String suffix = details.isBlank() ? "" : " - " + details;
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Place details failed" + suffix);
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Place details service unavailable");
        }

        Map<String, Object> body = resp.getBody();
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Place details returned empty response");
        }

        String id = body.get("id") instanceof String s ? s : placeId;
        String name = null;
        Object displayNameObj = body.get("displayName");
        if (displayNameObj instanceof Map<?, ?> dnMap) {
            Object textObj = dnMap.get("text");
            if (textObj instanceof String t)
                name = t;
        }
        String formattedAddress = body.get("formattedAddress") instanceof String s ? s : null;

        double lat = 0;
        double lng = 0;
        Object locationObj = body.get("location");
        if (locationObj instanceof Map<?, ?> locMap) {
            Object latObj = locMap.get("latitude");
            Object lngObj = locMap.get("longitude");
            if (latObj instanceof Number n)
                lat = n.doubleValue();
            if (lngObj instanceof Number n)
                lng = n.doubleValue();
        }

        Double rating = body.get("rating") instanceof Number n ? n.doubleValue() : null;
        Integer userRatingCount = body.get("userRatingCount") instanceof Number n ? n.intValue() : null;
        String googleMapsUri = body.get("googleMapsUri") instanceof String s ? s : null;
        String websiteUri = body.get("websiteUri") instanceof String s ? s : null;
        String phone = body.get("internationalPhoneNumber") instanceof String s ? s : null;

        Boolean openNow = null;
        Object currentOpeningObj = body.get("currentOpeningHours");
        if (currentOpeningObj instanceof Map<?, ?> cohMap) {
            Object openNowObj = cohMap.get("openNow");
            if (openNowObj instanceof Boolean b) {
                openNow = b;
            }
        }

        List<String> weekdayDescriptions = null;
        Object regularOpeningObj = body.get("regularOpeningHours");
        if (regularOpeningObj instanceof Map<?, ?> rohMap) {
            Object wdObj = rohMap.get("weekdayDescriptions");
            if (wdObj instanceof List<?> list) {
                List<String> out = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof String s) {
                        String trimmed = s.trim();
                        if (!trimmed.isBlank()) {
                            out.add(trimmed);
                        }
                    }
                }
                if (!out.isEmpty()) {
                    weekdayDescriptions = out;
                }
            }
        }
        if (weekdayDescriptions == null && currentOpeningObj instanceof Map<?, ?> cohMap) {
            Object wdObj = cohMap.get("weekdayDescriptions");
            if (wdObj instanceof List<?> list) {
                List<String> out = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof String s) {
                        String trimmed = s.trim();
                        if (!trimmed.isBlank()) {
                            out.add(trimmed);
                        }
                    }
                }
                if (!out.isEmpty()) {
                    weekdayDescriptions = out;
                }
            }
        }

        List<PlacePhoto> photos = null;
        Object photosObj = body.get("photos");
        if (photosObj instanceof List<?> list) {
            List<PlacePhoto> out = new ArrayList<>();
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> photoMap))
                    continue;
                Object nameObj = photoMap.get("name");
                String photoName = nameObj instanceof String s ? s : null;
                Integer widthPx = photoMap.get("widthPx") instanceof Number n ? n.intValue() : null;
                Integer heightPx = photoMap.get("heightPx") instanceof Number n ? n.intValue() : null;
                if (photoName == null || photoName.isBlank())
                    continue;
                out.add(new PlacePhoto(photoName, widthPx, heightPx));
            }
            if (!out.isEmpty()) {
                photos = out;
            }
        }

        return new PlaceDetailsResponse(
                id,
                name,
                formattedAddress,
                lat,
                lng,
                rating,
                userRatingCount,
                googleMapsUri,
                websiteUri,
                phone,
                openNow,
                weekdayDescriptions,
                photos);
    }
}
