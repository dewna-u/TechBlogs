package com.techblogs.techblogs.service;

import com.techblogs.techblogs.model.Comment;
import com.techblogs.techblogs.model.Post;
import com.techblogs.techblogs.repository.CommentRepository;
import com.techblogs.techblogs.repository.UserRepository;
import com.techblogs.techblogs.repository.PostRepository;
import com.techblogs.techblogs.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CommentService {
    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private PostRepository postRepository;
    @Autowired
    private UserRepository userRepository;

    public Comment createComment(Comment comment) {
        // If userName isn't provided, try to get it from the user repository
        if (comment.getUserName() == null && !comment.getUserId().equals("guest")) {
            Optional<User> userOpt = userRepository.findById(comment.getUserId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                comment.setUserName(user.getName());
            } else {
                comment.setUserName("Unknown User");
            }
        } else if (comment.getUserId().equals("guest") && comment.getUserName() == null) {
            comment.setUserName("Guest");
        }

        Comment saved = commentRepository.save(comment);
        Optional<Post> postOpt = postRepository.findById(comment.getPostId());
        if (postOpt.isPresent()) {
            Post post = postOpt.get();
            post.getComments().add(saved.getId());
            postRepository.save(post);
        }
        return saved;
    }

    public List<Comment> getAllComments() {
        return commentRepository.findAll();
    }

    public Comment updateComment(String id, Comment updatedComment) {
        Comment existingComment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        existingComment.setContent(updatedComment.getContent());
        // You can allow update of other fields if needed

        return commentRepository.save(existingComment);
    }

    public void deleteComment(String commentId, String userId) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isPresent()) {
            Comment comment = commentOpt.get();

            // Check if the user is the comment owner OR the post owner
            boolean isCommentOwner = comment.getUserId().equals(userId);
            boolean isPostOwner = false;

            Optional<Post> postOpt = postRepository.findById(comment.getPostId());
            if (postOpt.isPresent()) {
                Post post = postOpt.get();
                isPostOwner = post.getUserId().equals(userId);

                // Allow deletion if user is comment owner OR post owner
                if (isCommentOwner || isPostOwner) {
                    commentRepository.deleteById(commentId);
                    post.getComments().remove(commentId);
                    postRepository.save(post);
                }
            }
        }
    }
}