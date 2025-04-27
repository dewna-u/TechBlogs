package com.techblogs.techblogs.repository;

import com.techblogs.techblogs.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PostRepository extends MongoRepository<Post, String> {
}