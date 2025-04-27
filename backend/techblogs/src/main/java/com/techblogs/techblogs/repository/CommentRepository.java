package com.sliit.skillsharingplatform.repository;

import com.sliit.skillsharingplatform.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CommentRepository extends MongoRepository<Comment, String> {
}