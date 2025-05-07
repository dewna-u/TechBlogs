package com.techblogs.techblogs.config;

import com.techblogs.techblogs.model.User;
import com.techblogs.techblogs.repository.UserRepository;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Optional;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Resource
    private UserRepository userRepository;
    
    @Resource
    private Environment environment;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Check if we're in development mode
        boolean isDev = Arrays.asList(environment.getActiveProfiles()).contains("dev") || 
                       Arrays.asList(environment.getDefaultProfiles()).contains("dev");
        
        if (isDev) {
            System.out.println("Running in development mode with relaxed security");
            // In development mode, allow all requests without authentication
            http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                    .anyRequest().permitAll()
                );
        } else {
            // In production mode, enforce normal security
            http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/", "/error", "/login**").permitAll()
                    .requestMatchers("/api/auth/**", "/api/users/**").permitAll()
                    .requestMatchers("/api/posts/**").permitAll() // Consider changing this in production
                    .requestMatchers("/api/uploads/**", "/uploads/**").permitAll()
                    .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                    .userInfoEndpoint(endpoint -> endpoint.userService(customOAuth2UserService()))
                    .successHandler(authenticationSuccessHandler())
                );
        }

        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public AuthenticationSuccessHandler authenticationSuccessHandler() {
        SimpleUrlAuthenticationSuccessHandler handler = new SimpleUrlAuthenticationSuccessHandler();
        handler.setUseReferer(true);
        return handler;
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService() {
        return userRequest -> {
            OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);

            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String picture = oAuth2User.getAttribute("picture");

            // Save or update user in the database
            Optional<User> optionalUser = userRepository.findByEmail(email);

            User user;
            if (optionalUser.isEmpty()) {
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setProfilePic(picture);
                user = userRepository.save(user);
                System.out.println("Created new user: " + user.getId() + " - " + user.getName());
            } else {
                user = optionalUser.get();
                System.out.println("Authenticated existing user: " + user.getId() + " - " + user.getName());
            }

            // Store the user ID in the security context for easier retrieval
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                System.out.println("Current authentication: " + auth.getName());
            }

            return oAuth2User;
        };
    }
}
