package com.midlo.backend.places.details;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PlaceDetailsController {
    private final PlaceDetailsService placeDetailsService;

    public PlaceDetailsController(PlaceDetailsService placeDetailsService) {
        this.placeDetailsService = placeDetailsService;
    }

    @GetMapping(value = "/places/{placeId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public PlaceDetailsResponse placeDetails(@PathVariable String placeId) {
        return placeDetailsService.getPlaceDetails(placeId);
    }
}
