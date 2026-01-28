package com.midlo.backend.shared.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MidloCorsProperties.class)
public class MidloCorsConfig {
}
