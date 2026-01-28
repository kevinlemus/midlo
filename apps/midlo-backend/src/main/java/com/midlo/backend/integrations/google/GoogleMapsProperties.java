package com.midlo.backend.integrations.google;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "midlo.google")
public record GoogleMapsProperties(
		String apiKey
) {
}
