package com.midlo.backend.autocomplete.controller;

import com.midlo.backend.autocomplete.dto.AutocompleteSuggestion;
import com.midlo.backend.autocomplete.service.AutocompleteService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AutocompleteController {

	private final AutocompleteService autocompleteService;

	public AutocompleteController(AutocompleteService autocompleteService) {
		this.autocompleteService = autocompleteService;
	}

	@GetMapping(value = "/autocomplete", produces = MediaType.APPLICATION_JSON_VALUE)
	public List<AutocompleteSuggestion> autocomplete(@RequestParam(name = "input") String input) {
		return autocompleteService.suggest(input);
	}
}
