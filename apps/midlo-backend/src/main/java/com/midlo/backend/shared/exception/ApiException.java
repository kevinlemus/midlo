package com.midlo.backend.shared.exception;

import org.springframework.http.HttpStatusCode;
import org.springframework.lang.NonNull;

import java.util.Objects;

public class ApiException extends RuntimeException {
	private final @NonNull HttpStatusCode status;

	public ApiException(@NonNull HttpStatusCode status, String message) {
		super(message);
		this.status = Objects.requireNonNull(status, "status");
	}

	public @NonNull HttpStatusCode getStatus() {
		return status;
	}
}
