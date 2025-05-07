import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  TextField,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Stack,
} from "@mui/material";
import { AddPhotoAlternate, Videocam, CloudUpload, Close } from "@mui/icons-material";

export default function CreatePost() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file count
    if (files.length + selectedFiles.length > 3) {
      setError("Maximum 3 files allowed");
      return;
    }
    
    // Validate file types
    const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime"];
    const invalidFiles = selectedFiles.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError("Only images (JPEG, PNG, GIF) and videos (MP4, QuickTime) are allowed");
      return;
    }
    
    // Validate video duration
    const videoFiles = selectedFiles.filter(file => file.type.startsWith("video/"));
    
    const checkVideoDuration = async () => {
      for (const videoFile of videoFiles) {
        const duration = await getVideoDuration(videoFile);
        if (duration > 30) {
          setError("Videos must be 30 seconds or less");
          return false;
        }
      }
      return true;
    };
    
    checkVideoDuration().then(valid => {
      if (valid) {
        // Create previews
        const newPreviews = selectedFiles.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type.startsWith("image/") ? "image" : "video"
        }));
        
        setFiles([...files, ...selectedFiles]);
        setPreviews([...previews, ...newPreviews]);
        setError("");
      }
    });
  };
  
  // Get video duration
  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  };
  
  // Remove a file
  const removeFile = (index) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };
  
  // Submit the post
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    
    if (files.length === 0) {
      setError("At least one image or video is required");
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Create form data
    const formData = new FormData();
    formData.append("description", description);
    
    // Add user information if available
    if (user) {
      // Add user name
      if (user.name) {
        formData.append("userName", user.name);
        console.log("Adding user name to post:", user.name);
      }
      
      // Add user ID - Use id or _id, whichever is available
      if (user.id || user._id) {
        const userId = user.id || user._id;
        formData.append("userId", userId);
        console.log("Adding user ID to post:", userId);
      }
    } else {
      // Get user name from localStorage if available
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const userName = parsedUser?.name || "Guest User";
      formData.append("userName", userName);
      console.log("Using stored user name:", userName);
      
      // Add stored user ID if available
      if (parsedUser?.id || parsedUser?._id) {
        const userId = parsedUser.id || parsedUser._id;
        formData.append("userId", userId);
        console.log("Using stored user ID:", userId);
      }
    }
    
    files.forEach(file => {
      formData.append("files", file);
    });
    
    try {
      console.log("Submitting post to /api/posts");
      
      const response = await axios.post("/api/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });
      
      console.log("Post created successfully:", response.data);
      navigate("/posts");
    } catch (err) {
      console.error("Error creating post:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        
        if (err.response.status === 401) {
          setError("Please log in to create a post. For development, you may need to modify SecurityConfig.java.");
        } else {
          setError(err.response.data?.message || `Error ${err.response.status}: Failed to create post`);
        }
      } else if (err.request) {
        console.error("No response received from server");
        setError("Server not responding. Please try again later.");
      } else {
        setError("Failed to create post: " + err.message);
      }
      setLoading(false);
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get("/api/test");
      console.log("API test response:", response.data);
      alert("API connection successful: " + JSON.stringify(response.data));
      setLoading(false);
    } catch (err) {
      console.error("API test error:", err);
      setError("API connection failed: " + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5">
              Share Your Skills
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={testApiConnection}
              disabled={loading}
            >
              Test API
            </Button>
          </Box>
          
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Describe your skill or what you want to share"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              required
            />
            
            {/* Preview area */}
            {previews.length > 0 && (
              <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                {previews.map((preview, index) => (
                  <Grid key={index} sx={{ width: '33%', padding: 1 }}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        position: "relative", 
                        height: 200, 
                        overflow: "hidden"
                      }}
                    >
                      {preview.type === "image" ? (
                        <img 
                          src={preview.url} 
                          alt={`Preview ${index}`} 
                          style={{ 
                            width: "100%", 
                            height: "100%", 
                            objectFit: "cover" 
                          }} 
                        />
                      ) : (
                        <video 
                          src={preview.url} 
                          controls
                          style={{ 
                            width: "100%", 
                            height: "100%", 
                            objectFit: "cover" 
                          }} 
                        />
                      )}
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "white",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.7)" }
                        }}
                        size="small"
                        onClick={() => removeFile(index)}
                      >
                        <Close />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {/* Upload buttons */}
            <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 3 }}>
              {files.length < 3 && (
                <>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<AddPhotoAlternate />}
                  >
                    Add Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </Button>
                  
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<Videocam />}
                  >
                    Add Video
                    <input
                      type="file"
                      hidden
                      accept="video/*"
                      onChange={handleFileSelect}
                    />
                  </Button>
                </>
              )}
            </Box>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<CloudUpload />}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Share Skill"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}