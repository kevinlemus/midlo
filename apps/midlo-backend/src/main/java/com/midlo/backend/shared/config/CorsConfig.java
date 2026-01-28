package com.midlo.backend.shared.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
	private final MidloCorsProperties corsProperties;

	public CorsConfig(MidloCorsProperties corsProperties) {
		this.corsProperties = corsProperties;
	}

	@Override
	@SuppressWarnings("null")
	public void addCorsMappings(@NonNull CorsRegistry registry) {
		var registration = registry
				.addMapping("/**")
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
				.allowedHeaders("*")
				.exposedHeaders("*")
				.allowCredentials(false)
				.maxAge(3600);

		var allowedOriginPatterns = normalize(corsProperties.allowedOriginPatterns());
		if (!allowedOriginPatterns.isEmpty()) {
			String[] patterns = allowedOriginPatterns.toArray(new String[0]);
			registration.allowedOriginPatterns(patterns);
			return;
		}

		var allowedOrigins = normalize(corsProperties.allowedOrigins());
		if (!allowedOrigins.isEmpty()) {
			String[] origins = allowedOrigins.toArray(new String[0]);
			registration.allowedOrigins(origins);
		}
	}

	private static List<String> normalize(List<String> raw) {
		if (raw == null) {
			return List.of();
		}
		return raw.stream()
				.filter(v -> v != null && !v.isBlank())
				.map(String::trim)
				.toList();
	}
}
