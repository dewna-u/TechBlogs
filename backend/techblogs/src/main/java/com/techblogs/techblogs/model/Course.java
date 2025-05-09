package com.leaning.learning_management.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "courses")
public class Course {
    @Id
    private String id;
    private String title;
    private String description;
    private String videoUrl;
    private List<String> modules;
    private String instructorName;
    private String instructorBio;
    private List<String> resources;
    private List<String> tags;
    private String duration;
    private List<String> learningOutcomes;
}

