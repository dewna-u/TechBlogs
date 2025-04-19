package com.techblogs.techblogs.controller;

import com.techblogs.techblogs.model.User;
import com.techblogs.techblogs.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ✅ GET all user profiles
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // ✅ GET user by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            return ResponseEntity.ok(optionalUser.get());
        }
        return ResponseEntity.status(404).body("User not found");
    }

    // ✅ UPDATE user by ID
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        Optional<User> optionalUser = userRepository.findById(id);

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setName(updatedUser.getName());
            user.setEmail(updatedUser.getEmail());
            user.setProfilePic(updatedUser.getProfilePic());
            return ResponseEntity.ok(userRepository.save(user));
        }

        return ResponseEntity.status(404).body("User not found");
    }

    // ✅ DELETE user by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return ResponseEntity.ok("User deleted");
        }
        return ResponseEntity.status(404).body("User not found");
    }

    // ✅ Change password
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable String id, @RequestBody String newPassword) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok("Password updated");
        }
        return ResponseEntity.status(404).body("User not found");
    }

    // ✅ Follow user
    @PutMapping("/{id}/follow/{targetId}")
    public ResponseEntity<?> followUser(@PathVariable String id, @PathVariable String targetId) {
        System.out.println("🔁 Follow request: " + id + " → " + targetId);

        if (id.equals(targetId)) {
            return ResponseEntity.badRequest().body("You cannot follow yourself.");
        }

        Optional<User> userOpt = userRepository.findById(id);
        Optional<User> targetOpt = userRepository.findById(targetId);

        if (userOpt.isPresent() && targetOpt.isPresent()) {
            User user = userOpt.get();
            User target = targetOpt.get();

            if (!user.getFollowing().contains(targetId)) {
                user.getFollowing().add(targetId);
                target.getFollowers().add(id);

                userRepository.save(user);
                userRepository.save(target);

                return ResponseEntity.ok("Followed successfully.");
            } else {
                return ResponseEntity.badRequest().body("Already following this user.");
            }
        }

        return ResponseEntity.status(404).body("User or target not found");
    }

    // ✅ Unfollow user
    @PutMapping("/{id}/unfollow/{targetId}")
    public ResponseEntity<?> unfollowUser(@PathVariable String id, @PathVariable String targetId) {
        System.out.println("🔁 Unfollow request: " + id + " → " + targetId);

        Optional<User> userOpt = userRepository.findById(id);
        Optional<User> targetOpt = userRepository.findById(targetId);

        if (userOpt.isPresent() && targetOpt.isPresent()) {
            User user = userOpt.get();
            User target = targetOpt.get();

            if (user.getFollowing().contains(targetId)) {
                user.getFollowing().remove(targetId);
                target.getFollowers().remove(id);

                userRepository.save(user);
                userRepository.save(target);

                return ResponseEntity.ok("Unfollowed successfully.");
            } else {
                return ResponseEntity.badRequest().body("You are not following this user.");
            }
        }

        return ResponseEntity.status(404).body("User or target not found");
    }

    // ✅ Get followers
    @GetMapping("/{id}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            List<String> followerIds = userOpt.get().getFollowers();
            List<User> followers = userRepository.findAllById(followerIds);
            return ResponseEntity.ok(followers);
        }
        return ResponseEntity.status(404).body("User not found");
    }

    // ✅ Get following
    @GetMapping("/{id}/following")
    public ResponseEntity<?> getFollowing(@PathVariable String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            List<String> followingIds = userOpt.get().getFollowing();
            List<User> following = userRepository.findAllById(followingIds);
            return ResponseEntity.ok(following);
        }
        return ResponseEntity.status(404).body("User not found");
    }
}
