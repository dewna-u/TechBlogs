package com.techblogs.techblogs.repository;

import com.techblogs.techblogs.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CourseRepository extends MongoRepository<Course, String> {
    // Custom query methods can go here if needed
}
