package com.midlo.backend.places.photos;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Objects;

@RestController
public class PlacePhotoController {
    private final PlacePhotoService placePhotoService;

    public PlacePhotoController(PlacePhotoService placePhotoService) {
        this.placePhotoService = placePhotoService;
    }

    /**
     * Redirects to a Google-hosted photo URL without exposing the API key.
     * Example: /place-photo?name=places%2F...%2Fphotos%2F...&maxWidthPx=1200
     */
    @GetMapping(value = "/place-photo", produces = MediaType.ALL_VALUE)
    public ResponseEntity<Void> placePhoto(
            @RequestParam("name") String name,
            @RequestParam(value = "maxWidthPx", required = false) Integer maxWidthPx,
            @RequestParam(value = "maxHeightPx", required = false) Integer maxHeightPx) {

        String photoUri = Objects.requireNonNull(
                placePhotoService.resolvePhotoUri(name, maxWidthPx, maxHeightPx),
                "photoUri");

        URI redirectUri = Objects.requireNonNull(URI.create(photoUri), "redirectUri");

        return ResponseEntity
                .status(302)
                .location(redirectUri)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .build();
    }
}
