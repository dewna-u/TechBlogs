package com.sliit.skillsharingplatform.service;

import com.sliit.skillsharingplatform.model.Comment;
import com.sliit.skillsharingplatform.model.Post;
import com.sliit.skillsharingplatform.repository.CommentRepository;
import com.sliit.skillsharingplatform.repository.PostRepository;
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