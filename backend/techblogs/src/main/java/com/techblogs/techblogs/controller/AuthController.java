package com.techblogs.techblogs.controller;

import com.techblogs.techblogs.model.User;
import com.techblogs.techblogs.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // <-- for CORS support
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Google Login
    @PostMapping("/google")
    public ResponseEntity<User> googleLogin(@RequestBody User userPayload) {
        Optional<User> existingUser = userRepository.findByEmail(userPayload.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.ok(existingUser.get());
        }
        return ResponseEntity.ok(userRepository.save(userPayload));
    }

    // Register with email/password
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User userPayload) {
    try {
        if (userPayload.getEmail() == null || userPayload.getPassword() == null || userPayload.getName() == null) {
            return ResponseEntity.badRequest().body("All fields (name, email, password) are required.");
        }

        if (userRepository.findByEmail(userPayload.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email is already registered.");
        }

        userPayload.setPassword(passwordEncoder.encode(userPayload.getPassword()));
        User savedUser = userRepository.save(userPayload);

        return ResponseEntity.ok(savedUser);

    } catch (Exception e) {
        e.printStackTrace(); // 👈 Logs full stack trace in console
        return ResponseEntity.status(500).body("Server error: " + e.getMessage());
    }
    }


    // Login with email/password
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginPayload) {
        Optional<User> optionalUser = userRepository.findByEmail(loginPayload.getEmail());

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (user.getPassword() != null &&
                passwordEncoder.matches(loginPayload.getPassword(), user.getPassword())) {
                return ResponseEntity.ok(user);
            }
        }

        return ResponseEntity.status(401).body("Invalid email or password.");
    }
}
