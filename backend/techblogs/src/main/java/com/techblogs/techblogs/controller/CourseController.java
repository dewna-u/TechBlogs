package com.leaning.learning_management.controller;

import com.leaning.learning_management.model.Course;
import com.leaning.learning_management.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*") // Allow CORS for frontend dev
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // Create a new course
    @PostMapping("/create")
    public Course addCourse(@RequestBody Course course) {
        return courseService.createCourse(course);
    }

    // Get all courses
    @GetMapping("/getall")
    public List<Course> getAllCourses() {
        return courseService.getAllCourses();
    }

    // Get course by ID
    @GetMapping("/get/{id}")
    public Course getCourseById(@PathVariable String id) {
        return courseService.getCourseById(id);
    }

    // Update a course by ID
    @PutMapping("/update/{id}")
    public Course updateCourse(@PathVariable String id, @RequestBody Course course) {
        return courseService.updateCourse(id, course);
    }

    // Delete a course by ID
    @DeleteMapping("/delete/{id}")
    public void deleteCourse(@PathVariable String id) {
        courseService.deleteCourse(id);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadVideo(@RequestParam("file") MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
//        Path path = Paths.get("uploads/" + fileName);
//        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
        Path targetPath = Paths.get("uploads").resolve(fileName);
        Files.createDirectories(targetPath.getParent()); // ensures parent folder exists
        Files.copy(file.getInputStream(), targetPath);

        return ResponseEntity.ok(fileName); // store this in MongoDB
    }

}
