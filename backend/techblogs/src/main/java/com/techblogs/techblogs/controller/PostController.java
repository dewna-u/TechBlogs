package com.techblogs.techblogs.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.techblogs.techblogs.model.Post;
import com.techblogs.techblogs.service.PostService;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostService postService;
    
    @Value("${upload.dir:${user.home}/techblogs-uploads}")
    private String uploadDir;
    
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;
    
    public PostController(PostService postService) {
        this.postService = postService;
    }
    
    // Test endpoint to check if the controller is accessible
    @GetMapping("/test")
    public Map<String, String> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "API is working");
        
        // Add authentication info if available
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            response.put("authenticated", "true");
            response.put("principal", auth.getPrincipal().toString());
            response.put("authorities", auth.getAuthorities().toString());
        } else {
            response.put("authenticated", "false");
        }
        
        return response;
    }
    
    @GetMapping("/posts")
    public List<Post> getAllPosts() {
        System.out.println("Fetching all posts...");
        List<Post> posts = postService.getAllPosts();
        System.out.println("Found " + posts.size() + " posts");
        return posts;
    }
    
    @GetMapping("/users/{userId}/posts")
    public List<Post> getUserPosts(@PathVariable String userId) {
        System.out.println("Fetching posts for user ID: " + userId);
        List<Post> userPosts = postService.getUserPosts(userId);
        System.out.println("Found " + userPosts.size() + " posts for user ID: " + userId);
        return userPosts;
    }
    
    @GetMapping("/posts/{postId}")
    public Post getPost(@PathVariable String postId) {
        return postService.getPost(postId);
    }
    
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            Authentication auth,
            @RequestParam("description") String description,
            @RequestParam(value = "userName", required = false) String userName,
            @RequestParam("files") MultipartFile[] files) {
        
        try {
            // Validate input
            if (files.length > 3) {
                return ResponseEntity.badRequest().body(Map.of("message", "Maximum 3 media files allowed"));
            }
            
            // Get authentication from security context if not provided
            Authentication authentication = auth != null ? auth : SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                // For development environment, create a mock authentication
                if ("dev".equals(activeProfile)) {
                    System.out.println("Development mode: creating mock authentication with userName: " + userName);
                    final String finalUserName = userName != null && !userName.trim().isEmpty() ? userName : "Guest User";
                    // Create a simple mock authentication with a fixed user ID
                    authentication = new Authentication() {
                        @Override public String getName() { return "dev-user"; }
                        @Override public Object getCredentials() { return null; }
                        @Override public Object getPrincipal() { return finalUserName; }
                        @Override public boolean isAuthenticated() { return true; }
                        @Override public void setAuthenticated(boolean b) {}
                        @Override public Object getDetails() { return null; }
                        @Override public java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() { return java.util.Collections.emptyList(); }
                    };
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
                }
            }
            
            System.out.println("Creating post with authentication: " + authentication.getName() + ", userName: " + userName);
            Post post = postService.createPost(authentication, description, userName, files);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            System.err.println("Error creating post: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to create post: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable String postId,
            @RequestParam(value = "userId", required = false) String userIdParam,
            Authentication authentication) {
        
        String userId;
        
        if (userIdParam != null && !userIdParam.isEmpty()) {
            userId = userIdParam;
            System.out.println("Using provided userId: " + userId);
        } else if (authentication != null) {
            userId = authentication.getName();
            System.out.println("Using authenticated userId: " + userId);
        } else if ("dev".equals(activeProfile)) {
            userId = "dev-user";
            System.out.println("Using default dev userId: " + userId);
        } else {
            throw new IllegalStateException("User not authenticated");
        }
        
        postService.deletePost(postId, userId);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(
            @PathVariable String postId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        
        try {
            if (authentication == null && !"dev".equals(activeProfile)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
            }
            
            String description = payload.get("description");
            if (description == null || description.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Description cannot be empty"));
            }
            
            // Get userId from payload first, then from authentication as fallback
            String userId = payload.get("userId");
            if (userId == null || userId.trim().isEmpty()) {
                userId = authentication != null ? authentication.getName() : "dev-user";
            }
            
            System.out.println("Updating post with userId from request: " + userId);
            Post updatedPost = postService.updatePost(postId, userId, description);
            
            return ResponseEntity.ok(updatedPost);
        } catch (Exception e) {
            System.err.println("Error updating post: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to update post: " + e.getMessage()));
        }
    }
    
    @PutMapping("/posts/{postId}/claim")
    public ResponseEntity<?> claimPost(
            @PathVariable String postId,
            @RequestBody Map<String, String> payload) {
        
        try {
            String userId = payload.get("userId");
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "User ID is required"));
            }
            
            Post post = postService.getPost(postId);
            
            // Update the post's userId
            post.setUserId(userId);
            Post updatedPost = postService.savePost(post);
            
            return ResponseEntity.ok(updatedPost);
        } catch (Exception e) {
            System.err.println("Error claiming post: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to claim post: " + e.getMessage()));
        }
    }
    
    @GetMapping("/uploads/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/posts/{postId}/update-with-media")
    public ResponseEntity<?> updatePostWithMedia(
            @PathVariable String postId,
            @RequestParam("description") String description,
            @RequestParam(value = "userId", required = false) String userIdParam,
            @RequestParam(value = "keepExistingMedia", defaultValue = "true") String keepExistingMediaParam,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            Authentication authentication) {
        
        try {
            if (authentication == null && !"dev".equals(activeProfile)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
            }
            
            if (description == null || description.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Description cannot be empty"));
            }
            
            // Get userId from request param or authentication
            String userId;
            if (userIdParam != null && !userIdParam.isEmpty()) {
                userId = userIdParam;
                System.out.println("Using provided userId for media update: " + userId);
            } else if (authentication != null) {
                userId = authentication.getName();
                System.out.println("Using authenticated userId for media update: " + userId);
            } else if ("dev".equals(activeProfile)) {
                userId = "dev-user";
                System.out.println("Using default dev userId for media update: " + userId);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not authenticated"));
            }
            
            // Parse boolean flag for keeping existing media
            boolean keepExistingMedia = Boolean.parseBoolean(keepExistingMediaParam);
            System.out.println("Keep existing media: " + keepExistingMedia);
            
            // Ensure we have files array, even if empty
            MultipartFile[] filesToProcess = files != null ? files : new MultipartFile[0];
            System.out.println("Number of new files: " + filesToProcess.length);
            
            // Call service to update post with media
            Post updatedPost = postService.updatePostWithMedia(postId, userId, description, keepExistingMedia, filesToProcess);
            
            return ResponseEntity.ok(updatedPost);
        } catch (Exception e) {
            System.err.println("Error updating post with media: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to update post: " + e.getMessage()));
        }
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        Map<String, String> response = new HashMap<>();
        response.put("error", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
} 