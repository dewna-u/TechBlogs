import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";

const API_URL = "http://localhost:8089/api/courses";

const CourseManager = () => {
  const { register, handleSubmit, reset } = useForm();
  const [courses, setCourses] = useState([]);

  const fetchCourses = async () => {
    const res = await axios.get(`${API_URL}/getall`);
    setCourses(res.data);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onSubmit = async (data) => {
    try {
      let videoUrl = "";

      if (data.video[0]) {
        const formData = new FormData();
        formData.append("file", data.video[0]);
        const uploadRes = await axios.post(`${API_URL}/upload`, formData);
        videoUrl = uploadRes.data;
      }

      const formattedData = {
        title: data.title,
        description: data.description,
        videoUrl,
        modules: data.modules.split(",").map((m) => m.trim()),
        instructorName: data.instructorName,
        instructorBio: data.instructorBio,
        resources: data.resources.split(",").map((r) => r.trim()),
        tags: data.tags.split(",").map((t) => t.trim()),
        duration: data.duration,
        learningOutcomes: data.learningOutcomes
          .split(",")
          .map((l) => l.trim()),
      };

      await axios.post(`${API_URL}/create`, formattedData);
      reset();
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_URL}/delete/${id}`);
    fetchCourses();
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Course Manager</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Course</h2>

        <input
          {...register("title")}
          placeholder="Course Title"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <textarea
          {...register("description")}
          placeholder="Course Description"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="file"
          {...register("video")}
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          {...register("modules")}
          placeholder="Modules (comma-separated)"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          {...register("instructorName")}
          placeholder="Instructor Name"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <textarea
          {...register("instructorBio")}
          placeholder="Instructor Bio"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          {...register("resources")}
          placeholder="Resources (comma-separated)"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          {...register("tags")}
          placeholder="Tags (comma-separated)"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          {...register("duration")}
          placeholder="Course Duration"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          {...register("learningOutcomes")}
          placeholder="Learning Outcomes (comma-separated)"
          className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Course
        </button>
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-6 text-left text-gray-600 font-semibold">Title</th>
              <th className="py-3 px-6 text-left text-gray-600 font-semibold">Instructor</th>
              <th className="py-3 px-6 text-left text-gray-600 font-semibold">Duration</th>
              <th className="py-3 px-6 text-left text-gray-600 font-semibold">Tags</th>
              <th className="py-3 px-6 text-center text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-6 text-gray-700">
                  <a href={`/course/${course.id}`} className="text-blue-600 hover:underline">{course.title}</a>
                </td>
                <td className="py-4 px-6 text-gray-700">{course.instructorName}</td>
                <td className="py-4 px-6 text-gray-700">{course.duration}</td>
                <td className="py-4 px-6 text-gray-700">{course.tags?.join(", ")}</td>
                <td className="py-4 px-6 text-center">
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    onClick={() => handleDelete(course.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseManager;
