package com.midlo.backend.midpoint.controller;

import com.midlo.backend.midpoint.dto.MidpointRequest;
import com.midlo.backend.midpoint.dto.MidpointResponse;
import com.midlo.backend.midpoint.service.MidpointService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MidpointController {

	private final MidpointService midpointService;

	public MidpointController(MidpointService midpointService) {
		this.midpointService = midpointService;
	}

	@PostMapping(value = "/midpoint", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public MidpointResponse midpoint(@Valid @RequestBody MidpointRequest request) {
		return midpointService.calculateMidpoint(request);
	}
}
