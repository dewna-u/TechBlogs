// controller/AuthController.java
package com.techblogs.techblogs.controller;

// In AuthController.java
import com.techblogs.techblogs.repository.UserRepository;
import com.techblogs.techblogs.model.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/google")
    public User googleLogin(@RequestBody User userPayload) {
        // Check if user exists by email
        Optional<User> existingUser = userRepository.findByEmail(userPayload.getEmail());

        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // Save new user
        return userRepository.save(userPayload);
    }
}
