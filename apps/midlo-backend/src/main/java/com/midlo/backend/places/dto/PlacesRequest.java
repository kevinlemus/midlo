package com.midlo.backend.places.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record PlacesRequest(
		@Min(-90) @Max(90) double lat,
		@Min(-180) @Max(180) double lng
) {
}
