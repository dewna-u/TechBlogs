package com.techblogs.techblogs.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.techblogs.techblogs.model.Post;
import com.techblogs.techblogs.model.User;
import com.techblogs.techblogs.repository.PostRepository;
import com.techblogs.techblogs.repository.UserRepository;

import jakarta.annotation.PostConstruct;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Value("${upload.dir:${user.home}/techblogs-uploads}")
    private String uploadDir;
    
    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Created upload directory: " + uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + uploadDir, e);
        }
    }
    
    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<Post> getUserPosts(String userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public Post createPost(Authentication authentication, String description, String userName, MultipartFile[] files) throws IOException {
        User user;
        
        if (authentication instanceof OAuth2AuthenticationToken) {
            // Use OAuth2 information
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            user = getUserFromOAuth2Token(oauthToken);
        } else {
            // Try to find user by auth name or create a default user
            String userId = authentication.getName();
            
            // If it's anonymousUser but we have a userName parameter, use that instead
            if ("anonymousUser".equals(userId) && userName != null && !userName.trim().isEmpty()) {
                userId = "user-" + UUID.randomUUID().toString().substring(0, 8);
                System.out.println("Creating user with provided name: " + userName);
            }
            
            user = userRepository.findById(userId).orElse(null);
            
            if (user == null) {
                // Create a user with the provided or default name
                String displayName = userName != null && !userName.trim().isEmpty() 
                                    ? userName 
                                    : ("anonymousUser".equals(userId) ? "Guest User" : userId);
                
                System.out.println("Creating new user for: " + displayName);
                user = new User();
                user.setId(userId);
                user.setName(displayName);
                user.setEmail(userId + "@example.com");
                user.setProfilePic("https://ui-avatars.com/api/?name=" + displayName.replaceAll("\\s+", "+"));
                userRepository.save(user);
            }
        }
        
        return createPostWithUser(user, description, files);
    }
    
    // Overload for backward compatibility
    public Post createPost(Authentication authentication, String description, MultipartFile[] files) throws IOException {
        return createPost(authentication, description, null, files);
    }
    
    private User getUserFromOAuth2Token(OAuth2AuthenticationToken authentication) {
        OAuth2User oAuth2User = authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        
        // Find or create the user in the database
        return userRepository.findByEmail(email)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName(name);
                newUser.setProfilePic(picture);
                return userRepository.save(newUser);
            });
    }
    
    // Original method - keep for backward compatibility
    public Post createPost(OAuth2AuthenticationToken authentication, String description, MultipartFile[] files) throws IOException {
        User user = getUserFromOAuth2Token(authentication);
        return createPostWithUser(user, description, files);
    }
    
    // Common post creation logic
    private Post createPostWithUser(User user, String description, MultipartFile[] files) throws IOException {
        // Create post with user information
        Post post = new Post();
        post.setUserId(user.getId());
        post.setUserName(user.getName());
        post.setUserProfilePic(user.getProfilePic());
        post.setDescription(description);
        
        // Handle media uploads (max 3)
        List<Post.Media> mediaList = new ArrayList<>();
        int count = Math.min(files.length, 3);
        
        // Ensure upload directory exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            System.out.println("Created upload directory: " + uploadPath.toAbsolutePath());
        }
        
        for (int i = 0; i < count; i++) {
            MultipartFile file = files[i];
            String fileType = file.getContentType();
            String originalFilename = file.getOriginalFilename();
            
            // Skip empty files
            if (file.isEmpty() || originalFilename == null || originalFilename.trim().isEmpty()) {
                System.out.println("Skipping empty file or file with no name");
                continue;
            }
            
            String fileName = UUID.randomUUID().toString() + "_" + originalFilename;
            
            // Save the file
            try {
                Path filePath = uploadPath.resolve(fileName);
                System.out.println("Saving file to: " + filePath.toAbsolutePath());
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                
                // Add to media list
                String mediaType = fileType != null && fileType.startsWith("image/") ? "image" : "video";
                String url = "/api/uploads/" + fileName;
                mediaList.add(new Post.Media(url, mediaType));
                System.out.println("Added media: " + url + " of type " + mediaType);
            } catch (IOException e) {
                System.err.println("Failed to save file: " + fileName);
                e.printStackTrace();
                throw new IOException("Failed to save file: " + fileName, e);
            }
        }
        
        post.setMedia(mediaList);
        return postRepository.save(post);
    }
    
    public Post getPost(String postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }
    
    public void deletePost(String postId, String userId) {
        Post post = getPost(postId);
        
        // Add debug logging
        System.out.println("Attempting to delete post: " + postId);
        System.out.println("Post userId: " + post.getUserId());
        System.out.println("Provided userId: " + userId);
        
        // Check for user-prefix in stored userId
        if (post.getUserId().startsWith("user-") && !userId.startsWith("user-")) {
            // If the post was created with a "user-" prefix but the provided ID doesn't have it,
            // we'll check if the user is identified by username instead
            System.out.println("Post has user- prefix but provided ID doesn't. Checking by username...");
            User postOwner = userRepository.findById(post.getUserId()).orElse(null);
            User requestUser = userRepository.findById(userId).orElse(null);
            
            if (postOwner != null && requestUser != null && 
                postOwner.getName() != null && requestUser.getName() != null &&
                postOwner.getName().equalsIgnoreCase(requestUser.getName())) {
                // Allow deletion if usernames match
                System.out.println("Usernames match. Allowing deletion.");
                postRepository.delete(post);
                return;
            }
        }
        
        // Continue with standard ID comparison
        if (!post.getUserId().equals(userId)) {
            System.out.println("Not authorized to delete this post. User ID mismatch.");
            throw new RuntimeException("Not authorized to delete this post");
        }
        
        postRepository.delete(post);
    }
    
    public Post updatePost(String postId, String userId, String description) {
        Post post = getPost(postId);
        
        // Add debug logging
        System.out.println("Attempting to update post: " + postId);
        System.out.println("Post userId: " + post.getUserId());
        System.out.println("Provided userId: " + userId);
        
        // Check for user-prefix in stored userId
        if (post.getUserId().startsWith("user-") && !userId.startsWith("user-")) {
            // If the post was created with a "user-" prefix but the provided ID doesn't have it,
            // we'll check if the user is identified by username instead
            System.out.println("Post has user- prefix but provided ID doesn't. Checking by username...");
            User postOwner = userRepository.findById(post.getUserId()).orElse(null);
            User requestUser = userRepository.findById(userId).orElse(null);
            
            if (postOwner != null && requestUser != null && 
                postOwner.getName() != null && requestUser.getName() != null &&
                postOwner.getName().equalsIgnoreCase(requestUser.getName())) {
                // Allow update if usernames match
                System.out.println("Usernames match. Allowing update.");
                post.setDescription(description);
                return postRepository.save(post);
            }
        }
        
        // Continue with standard ID comparison
        if (!post.getUserId().equals(userId)) {
            System.out.println("Not authorized to update this post. User ID mismatch.");
            throw new RuntimeException("Not authorized to update this post");
        }
        
        // Update the description
        post.setDescription(description);
        
        // Save and return the updated post
        return postRepository.save(post);
    }
    
    // Method to save a post without ownership check (for admin operations)
    public Post savePost(Post post) {
        return postRepository.save(post);
    }
    
    public Post updatePostWithMedia(String postId, String userId, String description, boolean keepExistingMedia, MultipartFile[] files) throws IOException {
        Post post = getPost(postId);
        
        // Add debug logging
        System.out.println("Attempting to update post with media: " + postId);
        System.out.println("Post userId: " + post.getUserId());
        System.out.println("Provided userId: " + userId);
        System.out.println("Keep existing media: " + keepExistingMedia);
        System.out.println("New files count: " + files.length);
        
        // Check for user-prefix in stored userId (same as with update/delete)
        if (post.getUserId().startsWith("user-") && !userId.startsWith("user-")) {
            System.out.println("Post has user- prefix but provided ID doesn't. Checking by username...");
            User postOwner = userRepository.findById(post.getUserId()).orElse(null);
            User requestUser = userRepository.findById(userId).orElse(null);
            
            if (postOwner != null && requestUser != null && 
                postOwner.getName() != null && requestUser.getName() != null &&
                postOwner.getName().equalsIgnoreCase(requestUser.getName())) {
                System.out.println("Usernames match. Allowing media update.");
                // Continue with update below (using original user ID)
                userId = post.getUserId();
            } else {
                System.out.println("Not authorized to update this post. Username mismatch.");
                throw new RuntimeException("Not authorized to update this post");
            }
        } else if (!post.getUserId().equals(userId)) {
            System.out.println("Not authorized to update this post. User ID mismatch.");
            throw new RuntimeException("Not authorized to update this post");
        }
        
        // Update the description
        post.setDescription(description);
        
        // Handle media updates
        List<Post.Media> updatedMediaList = new ArrayList<>();
        
        // If we're keeping existing media, add it to our list first
        if (keepExistingMedia && post.getMedia() != null) {
            updatedMediaList.addAll(post.getMedia());
            System.out.println("Keeping " + updatedMediaList.size() + " existing media files");
        }
        
        // Process new files if any
        if (files.length > 0) {
            // Ensure upload directory exists
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Created upload directory: " + uploadPath.toAbsolutePath());
            }
            
            // Process each new file
            for (MultipartFile file : files) {
                String fileType = file.getContentType();
                String originalFilename = file.getOriginalFilename();
                
                // Skip empty files
                if (file.isEmpty() || originalFilename == null || originalFilename.trim().isEmpty()) {
                    System.out.println("Skipping empty file or file with no name");
                    continue;
                }
                
                String fileName = UUID.randomUUID().toString() + "_" + originalFilename;
                
                // Save the file
                try {
                    Path filePath = uploadPath.resolve(fileName);
                    System.out.println("Saving file to: " + filePath.toAbsolutePath());
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    
                    // Add to media list
                    String mediaType = fileType != null && fileType.startsWith("image/") ? "image" : "video";
                    String url = "/api/uploads/" + fileName;
                    updatedMediaList.add(new Post.Media(url, mediaType));
                    System.out.println("Added new media: " + url + " of type " + mediaType);
                } catch (IOException e) {
                    System.err.println("Failed to save file: " + fileName);
                    e.printStackTrace();
                    throw new IOException("Failed to save file: " + fileName, e);
                }
            }
        }
        
        // Update media list and save
        post.setMedia(updatedMediaList);
        System.out.println("Final media count: " + updatedMediaList.size());
        
        return postRepository.save(post);
    }
} 