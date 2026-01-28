package com.midlo.backend.shared.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "midlo.cors")
public record MidloCorsProperties(
		List<String> allowedOrigins,
		List<String> allowedOriginPatterns
) {
}
