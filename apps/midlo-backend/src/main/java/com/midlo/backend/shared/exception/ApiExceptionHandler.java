package com.midlo.backend.shared.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Arrays;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
	private final Environment environment;

	public ApiExceptionHandler(Environment environment) {
		this.environment = environment;
	}

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<String> handleApiException(ApiException e) {
		String body = e.getMessage() == null ? "" : e.getMessage();
		return ResponseEntity.status(e.getStatus()).body(body);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<String> handleValidation(MethodArgumentNotValidException e) {
		String msg = e.getBindingResult().getFieldErrors().stream()
				.map(err -> err.getField() + ": " + err.getDefaultMessage())
				.collect(Collectors.joining("; "));
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(msg.isBlank() ? "Invalid request" : msg);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<String> handleUnknown(Exception e) {
		log.error("Unhandled exception", e);
		boolean isLocal = Arrays.asList(environment.getActiveProfiles()).contains("local");
		if (isLocal) {
			String msg = e.getClass().getSimpleName() + ": " + (e.getMessage() == null ? "" : e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(msg.trim().isEmpty() ? "Server error" : msg);
		}
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
	}
}
