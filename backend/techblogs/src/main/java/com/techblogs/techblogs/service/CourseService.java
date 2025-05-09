package com.leaning.learning_management.service;

import com.leaning.learning_management.model.Course;
import com.leaning.learning_management.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    // Create a new course
    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    // Get all courses
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    // Get a course by ID
    public Course getCourseById(String id) {
        Optional<Course> course = courseRepository.findById(id);
        return course.orElseThrow(() -> new RuntimeException("Course not found"));
    }

    // Update an existing course
    public Course updateCourse(String id, Course course) {
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Course not found");
        }
        course.setId(id);
        return courseRepository.save(course);
    }

    // Delete a course by ID
    public void deleteCourse(String id) {
        if (!courseRepository.existsById(id)) {
            throw new RuntimeException("Course not found");
        }
        courseRepository.deleteById(id);
    }
}
