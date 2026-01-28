package com.midlo.backend.shared.logging;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

public class KpiLoggingFilter extends OncePerRequestFilter {
	private static final Logger log = LoggerFactory.getLogger(KpiLoggingFilter.class);

	private static final Set<String> PATHS = Set.of("/midpoint", "/places", "/m");

	@Override
	protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
		String path = request.getRequestURI();
		if (path == null) {
			return true;
		}
		if (PATHS.contains(path)) {
			return false;
		}
		return !path.startsWith("/actuator");
	}

	@Override
	protected void doFilterInternal(
			@NonNull HttpServletRequest request,
			@NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {
		Instant start = Instant.now();
		try {
			filterChain.doFilter(request, response);
		} finally {
			long ms = Duration.between(start, Instant.now()).toMillis();
			String path = request.getRequestURI();
			String method = request.getMethod();
			int status = response.getStatus();

			log.info(
					"kpi_event method={} path={} status={} durationMs={} ua=\"{}\"",
					method,
					path,
					status,
					ms,
					safeHeader(request, "User-Agent"));
		}
	}

	private static String safeHeader(HttpServletRequest request, String name) {
		String value = request.getHeader(name);
		if (value == null) {
			return "";
		}
		String trimmed = value.trim();
		if (trimmed.length() > 180) {
			return trimmed.substring(0, 180);
		}
		return trimmed;
	}
}
