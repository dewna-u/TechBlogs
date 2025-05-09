import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:8089/api/courses";

const CourseManager = () => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState("hidden"); // hidden, create, edit
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ show: false, message: "", type: "" });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/getall`);
      setCourses(res.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onSubmit = async (data) => {
    try {
      setSubmitStatus({ show: true, message: "Submitting course data...", type: "info" });
      let videoUrl = data.videoUrl || "";

      if (data.video && data.video[0]) {
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

      if (formMode === "edit" && editingCourseId) {
        // Update existing course
        await axios.put(`${API_URL}/update/${editingCourseId}`, formattedData);
        setSubmitStatus({ show: true, message: "Course updated successfully!", type: "success" });
      } else {
        // Create new course
        await axios.post(`${API_URL}/create`, formattedData);
        setSubmitStatus({ show: true, message: "Course added successfully!", type: "success" });
      }
      
      reset();
      fetchCourses();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus({ show: false, message: "", type: "" });
        setFormMode("hidden");
        setEditingCourseId(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setSubmitStatus({ 
        show: true, 
        message: `Error ${formMode === "edit" ? "updating" : "adding"} course. Please try again.`, 
        type: "error" 
      });
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await axios.delete(`${API_URL}/delete/${id}`);
        fetchCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  const handleEdit = (course) => {
    setEditingCourseId(course.id);
    setFormMode("edit");
    
    // Populate form with course data
    setValue("title", course.title);
    setValue("description", course.description);
    setValue("videoUrl", course.videoUrl); // Store current videoUrl
    setValue("modules", course.modules.join(", "));
    setValue("instructorName", course.instructorName);
    setValue("instructorBio", course.instructorBio || "");
    setValue("resources", course.resources.join(", "));
    setValue("tags", course.tags.join(", "));
    setValue("duration", course.duration);
    setValue("learningOutcomes", course.learningOutcomes.join(", "));
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelForm = () => {
    setFormMode("hidden");
    setEditingCourseId(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-12 mb-10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Course Manager</h1>
          <p className="text-blue-100 text-center max-w-3xl mx-auto text-lg">
            Create and manage your learning platform's educational content
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-gray-700 font-medium">
            {loading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading courses...
              </span>
            ) : (
              <span>Showing {courses.length} courses</span>
            )}
          </div>
          {formMode === "hidden" && (
            <button
              onClick={() => {
                reset();
                setFormMode("create");
              }}
              className="inline-flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Course
            </button>
          )}
          {formMode !== "hidden" && (
            <button
              onClick={cancelForm}
              className="inline-flex items-center px-5 py-3 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          )}
        </div>

        {/* Status Messages */}
        {submitStatus.show && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitStatus.type === "success" 
              ? "bg-green-50 text-green-800 border border-green-200"
              : submitStatus.type === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}>
            <div className="flex items-center">
              {submitStatus.type === "success" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {submitStatus.type === "error" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {submitStatus.type === "info" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {submitStatus.message}
            </div>
          </div>
        )}

        {/* Course Form */}
        <div className={`transition-all duration-500 ease-in-out ${
          formMode === "hidden" 
            ? "max-h-0 opacity-0 overflow-hidden" 
            : "max-h-[5000px] opacity-100 mb-12"
        }`}>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
              {formMode === "edit" ? "Edit Course" : "Create New Course"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Title*</label>
                  <input
                    {...register("title", { required: true })}
                    placeholder="e.g. Introduction to Web Development"
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">Title is required</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Description*</label>
                  <textarea
                    {...register("description", { required: true })}
                    placeholder="Provide a detailed description of the course"
                    rows={4}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">Description is required</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Video</label>
                  <div className="border border-gray-300 p-3 rounded-lg">
                    <input
                      type="file"
                      {...register("video")}
                      accept="video/*"
                      className="w-full text-gray-700 focus:outline-none"
                    />
                  </div>
                  <input type="hidden" {...register("videoUrl")} />
                  {formMode === "edit" && (
                    <p className="mt-1 text-xs text-blue-600">
                      {register("videoUrl").value ? "Current video will be kept unless you upload a new one" : "No video currently attached"}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Upload MP4 format, max 100MB</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Modules*</label>
                  <input
                    {...register("modules", { required: true })}
                    placeholder="Module 1: Introduction, Module 2: Basics, ..."
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.modules && <p className="mt-1 text-sm text-red-600">At least one module is required</p>}
                  <p className="mt-1 text-xs text-gray-500">Enter comma-separated module names</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    {...register("tags")}
                    placeholder="web, programming, beginner, ..."
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter comma-separated tags</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Name*</label>
                  <input
                    {...register("instructorName", { required: true })}
                    placeholder="e.g. John Smith"
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.instructorName && <p className="mt-1 text-sm text-red-600">Instructor name is required</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Bio</label>
                  <textarea
                    {...register("instructorBio")}
                    placeholder="Brief description of the instructor's background"
                    rows={3}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Duration*</label>
                  <input
                    {...register("duration", { required: true })}
                    placeholder="e.g. 4 weeks, 10 hours, etc."
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.duration && <p className="mt-1 text-sm text-red-600">Duration is required</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resources</label>
                  <input
                    {...register("resources")}
                    placeholder="PDF Guide, Cheat Sheet, Practice Files, ..."
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter comma-separated resource names</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes*</label>
                  <input
                    {...register("learningOutcomes", { required: true })}
                    placeholder="Build a website, Understand basic algorithms, ..."
                    className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.learningOutcomes && <p className="mt-1 text-sm text-red-600">At least one learning outcome is required</p>}
                  <p className="mt-1 text-xs text-gray-500">Enter comma-separated learning outcomes</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={cancelForm}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg mr-4 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${
                  formMode === "edit" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                } text-white px-8 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center`}
              >
                {formMode === "edit" ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Update Course
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Course List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">All Courses</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-20">
              <div className="w-12 h-12 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-600 text-lg">No courses available. Add a new course to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md flex items-center justify-center text-white font-bold">
                            {course.title.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              <Link to={`/course/${course.id}`} className="hover:text-blue-600 hover:underline">
                                {course.title}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {course.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.instructorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.duration}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {course.tags?.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {tag}
                            </span>
                          ))}
                          {course.tags?.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{course.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/course/${course.id}`}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-md hover:bg-blue-100 transition-colors"
                            title="View course"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleEdit(course)}
                            className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-md hover:bg-green-100 transition-colors"
                            title="Edit course"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(course.id, course.title)}
                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md hover:bg-red-100 transition-colors"
                            title="Delete course"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseManager;
