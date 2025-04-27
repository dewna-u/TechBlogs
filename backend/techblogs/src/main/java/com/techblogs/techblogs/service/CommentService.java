package com.techblogs.techblogs.service;

import com.techblogs.techblogs.model.Comment;
import com.techblogs.techblogs.model.Post;
import com.techblogs.techblogs.repository.CommentRepository;
import com.techblogs.techblogs.repository.PostRepository;
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

    public Comment createComment(Comment comment) {
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
            Optional<Post> postOpt = postRepository.findById(comment.getPostId());
            if (postOpt.isPresent() && postOpt.get().getUserId().equals(userId)) {
                commentRepository.deleteById(commentId);
                Post post = postOpt.get();
                post.getComments().remove(commentId);
                postRepository.save(post);
            }
        }
    }
}