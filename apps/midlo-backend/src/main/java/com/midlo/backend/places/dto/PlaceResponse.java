package com.midlo.backend.places.dto;

public record PlaceResponse(
		String placeId,
		String name,
		String distance,
		double lat,
		double lng) {
}
