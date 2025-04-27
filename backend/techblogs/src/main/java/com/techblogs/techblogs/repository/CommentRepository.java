package com.techblogs.techblogs.repository;

import com.techblogs.techblogs.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CommentRepository extends MongoRepository<Comment, String> {
}