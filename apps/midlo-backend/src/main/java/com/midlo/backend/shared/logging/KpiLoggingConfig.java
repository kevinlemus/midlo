package com.midlo.backend.shared.logging;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "midlo.analytics.enabled", havingValue = "true", matchIfMissing = true)
public class KpiLoggingConfig {
	@Bean
	public FilterRegistrationBean<KpiLoggingFilter> kpiLoggingFilter() {
		FilterRegistrationBean<KpiLoggingFilter> reg = new FilterRegistrationBean<>();
		reg.setFilter(new KpiLoggingFilter());
		reg.setOrder(10);
		return reg;
	}
}
