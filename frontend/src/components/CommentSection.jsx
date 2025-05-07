import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "../config/axios";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  Divider,
  CircularProgress,
  IconButton,
  Stack,
} from "@mui/material";
import { Delete as DeleteIcon, Send as SendIcon, Edit as EditIcon, Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";

const CommentSection = ({ postId }) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [commentUsers, setCommentUsers] = useState({}); // Store user data by ID
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Fetch comments for the post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/comments`);
        const postComments = response.data.filter(comment => comment.postId === postId);
        setComments(postComments);
        
        // Fetch user data for each unique commenter (excluding guest)
        const userIds = [...new Set(postComments.map(comment => comment.userId))].filter(id => id !== "guest");
        
        if (userIds.length > 0) {
          const userDataPromises = userIds.map(userId => 
            axios.get(`/api/users/${userId}`)
              .then(res => res.data)
              .catch(() => ({ id: userId, name: "Unknown User" }))
          );
          
          const users = await Promise.all(userDataPromises);
          const usersMap = users.reduce((acc, user) => {
            acc[user.id || user._id] = user;
            return acc;
          }, {});
          
          setCommentUsers(usersMap);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching comments:", err);
        setError("Failed to load comments");
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // Submit a new comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      // Create a comment with user information - use correct ID property
      const newComment = {
        postId,
        userId: user?.id || "guest", // Use user.id instead of user._id
        userName: user?.name || "Guest",
        content: content.trim()
      };

      console.log("Submitting comment:", newComment);
      
      const response = await axios.post("/api/comments", newComment);
      
      // Add the new comment to the existing comments
      setComments(prevComments => [...prevComments, response.data]);
      
      // Clear the input
      setContent("");
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing a comment
  const handleEditStart = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  // Save edited comment
  const handleEditSave = async (commentId) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await axios.put(`/api/comments/${commentId}`, {
        content: editContent.trim()
      });
      
      // Update comment in state
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: editContent.trim() } 
            : comment
        )
      );
      
      // Exit edit mode
      setEditingCommentId(null);
      setEditContent("");
    } catch (err) {
      console.error("Error updating comment:", err);
      setError("Failed to update comment");
    }
  };

  // Delete a comment
  const handleDelete = async (commentId) => {
    if (!user) return;
    
    try {
      await axios.delete(`/api/comments/${commentId}/${user.id}`); // Use user.id here
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  // Function to get commenter name
  const getCommenterName = (userId, comment) => {
    // First check if the comment has a userName field directly (for new comments)
    if (comment.userName) {
      return comment.userName;
    }
    
    // Otherwise fall back to existing logic
    if (userId === user?.id) return "You"; // Use user.id here
    if (userId === "guest") return "Guest";
    
    const commenter = commentUsers[userId];
    return commenter?.name || "Unknown User";
  };

  // Check if the current user owns this comment
  const isCommentOwner = (comment) => {
    return user && user.id === comment.userId; // Use user.id here
  };

  // Render the comment section
  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      
      {/* Comment input */}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", mb: 2 }}>
        <Avatar 
          src={user?.profilePic} 
          sx={{ width: 36, height: 36, mr: 1 }}
        />
        <TextField
          fullWidth
          size="small"
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
          variant="outlined"
        />
        <Button 
          type="submit" 
          disabled={!content.trim() || submitting}
          sx={{ ml: 1 }}
        >
          {submitting ? <CircularProgress size={24} /> : <SendIcon />}
        </Button>
      </Box>

      {/* Error message */}
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Comments list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ my: 2, textAlign: "center" }}>
          No comments yet. Be the first to comment!
        </Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          {comments.map((comment) => (
            <Box key={comment.id} sx={{ display: "flex", mb: 2 }}>
              <Avatar 
                src={commentUsers[comment.userId]?.profilePic}
                sx={{ width: 32, height: 32, mr: 1 }}
              />
              <Box 
                sx={{ 
                  bgcolor: "background.paper", 
                  p: 1, 
                  borderRadius: 2,
                  flex: 1
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {getCommenterName(comment.userId, comment)}
                </Typography>
                
                {editingCommentId === comment.id ? (
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button 
                        size="small" 
                        startIcon={<SaveIcon />}
                        onClick={() => handleEditSave(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<CloseIcon />}
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2">{comment.content}</Typography>
                )}
              </Box>
              
              {/* Action buttons if comment belongs to current user */}
              {isCommentOwner(comment) && editingCommentId !== comment.id && (
                <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditStart(comment)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(comment.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CommentSection;