package com.techblogs.techblogs.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String FRONTEND_ORIGIN = "http://localhost:5173";
    private static final String VIDEO_RESOURCE_LOCATION = "file:uploads/";
    private static final String VIDEO_URL_PATTERN = "/videos/**";
    private static final String API_URL_PATTERN = "/api/**";

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(FRONTEND_ORIGIN)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ensure we're looking at the correct path for uploaded videos
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/");  // Ensure it's looking in the right folder
    }

}
