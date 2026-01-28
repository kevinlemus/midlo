package com.midlo.backend.midpoint.dto;

import jakarta.validation.constraints.NotBlank;

public record MidpointRequest(
		@NotBlank String addressA,
		@NotBlank String addressB
) {
}
