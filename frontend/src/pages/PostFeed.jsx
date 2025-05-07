import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import axios from "../config/axios";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  Fab,
} from "@mui/material";
import { Add as AddIcon, PlayArrow, Pause, Comment as CommentIcon } from "@mui/icons-material";
import CommentSection from "../components/CommentSection";

export default function PostFeed() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  
  useEffect(() => {
    fetchPosts();
  }, []);
  
  const fetchPosts = async () => {
    try {
      const response = await axios.get("/api/posts");
      // Ensure that response.data is an array
      const postsData = Array.isArray(response.data) ? response.data : [];
      console.log("Posts data:", postsData);
      setPosts(postsData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts");
      setLoading(false);
    }
  };
  
  const handleVideoToggle = (postId, mediaIndex) => {
    const videoId = `${postId}-${mediaIndex}`;
    const video = document.getElementById(videoId);
    
    if (video) {
      if (playing[videoId]) {
        video.pause();
        setPlaying(prev => ({ ...prev, [videoId]: false }));
      } else {
        // Pause all other videos
        Object.keys(playing).forEach(key => {
          if (playing[key]) {
            const [otherPostId, otherMediaIndex] = key.split("-");
            const otherVideo = document.getElementById(key);
            if (otherVideo) {
              otherVideo.pause();
            }
          }
        });
        
        video.play();
        setPlaying(prev => ({ ...prev, [videoId]: true }));
      }
    }
  };
  
  const videoEnded = (postId, mediaIndex) => {
    const videoId = `${postId}-${mediaIndex}`;
    setPlaying(prev => ({ ...prev, [videoId]: false }));
  };

  // Toggle comment section visibility
  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchPosts} sx={{ mt: 2 }}>
          Try Again
        </Button>
      </Box>
    );
  }

  // Guard against non-array posts
  const postList = Array.isArray(posts) ? posts : [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h5">Skill Sharing Feed</Typography>
        <Tooltip title="Share a new skill">
          <Fab
            color="primary"
            component={Link}
            to="/create"
            size="medium"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>
      
      {postList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No posts yet
          </Typography>
          <Typography color="text.secondary" paragraph>
            Be the first to share your skills!
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/create"
            startIcon={<AddIcon />}
          >
            Share a Skill
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {postList.map((post) => (
            <Card key={post.id} elevation={3}>
              <CardHeader
                avatar={
                  <Avatar 
                    src={post.userProfilePic} 
                    alt={post.userName}
                    component={Link}
                    to={`/profile/${post.userId}`}
                    sx={{ cursor: "pointer" }}
                  />
                }
                title={
                  <Typography
                    component={Link}
                    to={`/profile/${post.userId}`}
                    sx={{ 
                      color: "inherit", 
                      textDecoration: "none",
                      fontWeight: "bold",
                      "&:hover": { textDecoration: "underline" }
                    }}
                  >
                    {post.userName}
                  </Typography>
                }
                subheader={new Date(post.createdAt).toLocaleString()}
              />
              
              <Divider />
              
              {/* Display media content */}
              {post.media && post.media.length > 0 && (
                <Box 
                  sx={{ 
                    p: 2,
                    display: post.media.length > 1 ? "grid" : "block",
                    gridTemplateColumns: post.media.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
                    gap: 2
                  }}
                >
                  {post.media.map((media, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        position: "relative",
                        height: post.media.length > 1 ? 250 : 400,
                        borderRadius: 1,
                        overflow: "hidden"
                      }}
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.url}
                          alt={`Content ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                          <video
                            id={`${post.id}-${index}`}
                            src={media.url}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onEnded={() => videoEnded(post.id, index)}
                          />
                          <IconButton
                            onClick={() => handleVideoToggle(post.id, index)}
                            sx={{
                              position: "absolute",
                              bottom: 10,
                              right: 10,
                              bgcolor: "rgba(0,0,0,0.6)",
                              color: "white",
                              "&:hover": { bgcolor: "rgba(0,0,0,0.8)" }
                            }}
                          >
                            {playing[`${post.id}-${index}`] ? <Pause /> : <PlayArrow />}
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              
              <CardContent>
                <Typography variant="body1" paragraph>
                  {post.description}
                </Typography>
                
                {/* Comment button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Button 
                    startIcon={<CommentIcon />}
                    onClick={() => toggleComments(post.id)}
                    size="small"
                  >
                    {post.comments && post.comments.length > 0 
                      ? `Comments (${post.comments.length})` 
                      : "Add Comment"}
                  </Button>
                </Box>
                
                {/* Comment section */}
                {expandedComments[post.id] && (
                  <CommentSection postId={post.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}