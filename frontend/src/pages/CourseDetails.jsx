import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8089/api/courses";

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      const res = await axios.get(`${API_URL}/get/${id}`);
      setCourse(res.data);
    };
    fetchCourse();
  }, [id]);

  if (!course) return <div className="p-6 text-center">Loading course details...</div>;

  return (
    <div className="p-6 max-w-6xl max-h-48 mx-auto bg-slate-400 shadow-lg rounded-lg">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-4">{course.title}</h1>
      <p className="mb-6 text-lg text-gray-600">{course.description}</p>
{/* 
      {course.videoUrl && (
        <div className="mb-6">
          <video controls className="w-full h-4/6 rounded-lg shadow-md">
            <source
              src={`http://localhost:8089/uploads/${course.videoUrl}`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      )} */}

        {course.videoUrl && (
        <div className="mb-6">
            <video
            controls
            className="w-full max-w-4xl h-96 object-cover rounded-lg shadow-md mx-auto"
            >
            <source
                src={`http://localhost:8089/uploads/${course.videoUrl}`}
                type="video/mp4"
            />
            Your browser does not support the video tag.
            </video>
        </div>
        )}

      <div className="mb-6">
        <strong className="text-xl text-gray-800">Instructor:</strong>
        <p className="text-gray-700">{course.instructorName}</p>
        <p className="text-gray-600 mt-2">{course.instructorBio}</p>
      </div>

      <div className="mb-6">
        <strong className="text-xl text-gray-800">Modules:</strong>
        <p className="text-gray-700">{course.modules.join(", ")}</p>
      </div>

      <div className="mb-6">
        <strong className="text-xl text-gray-800">Duration:</strong>
        <p className="text-gray-700">{course.duration}</p>
      </div>

      <div className="mb-6">
        <strong className="text-xl text-gray-800">Resources:</strong>
        <p className="text-gray-700">{course.resources.join(", ")}</p>
      </div>

      <div className="mb-6">
        <strong className="text-xl text-gray-800">Tags:</strong>
        <p className="text-gray-700">{course.tags.join(", ")}</p>
      </div>

      <div className="mb-6">
        <strong className="text-xl text-gray-800">Learning Outcomes:</strong>
        <p className="text-gray-700">{course.learningOutcomes.join(", ")}</p>
      </div>

      <div className="text-center mt-8">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-200 ease-in-out">
          Enroll Now
        </button>
      </div>
    </div>
  );
};

export default CourseDetails;
