package com.midlo.backend.places.controller;

import com.midlo.backend.places.dto.PlaceResponse;
import com.midlo.backend.places.dto.PlacesRequest;
import com.midlo.backend.places.service.PlacesService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PlacesController {

	private final PlacesService placesService;

	public PlacesController(PlacesService placesService) {
		this.placesService = placesService;
	}

	@PostMapping(value = "/places", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public List<PlaceResponse> places(@Valid @RequestBody PlacesRequest request) {
		return placesService.getMockPlaces(request);
	}
}
