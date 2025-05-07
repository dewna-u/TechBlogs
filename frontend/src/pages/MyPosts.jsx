import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  Paper,
  ButtonGroup,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow,
  Pause,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddPhotoAlternate,
  Videocam,
  Close
} from "@mui/icons-material";

export default function MyPosts() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState({});
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // For edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editPostId, setEditPostId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFiles, setEditFiles] = useState([]);
  const [editPreviews, setEditPreviews] = useState([]);
  const [currentPostMedia, setCurrentPostMedia] = useState([]);
  const [keepExistingMedia, setKeepExistingMedia] = useState(true);
  
  // For delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [allPosts, setAllPosts] = useState([]);
  const [checkingAllPosts, setCheckingAllPosts] = useState(false);
  const [claimingPosts, setClaimingPosts] = useState(false);

  // Success notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  useEffect(() => {
    if (user) {
      console.log("Current user in MyPosts:", user);
      console.log("User ID type:", typeof user.id);
      console.log("User ID value:", user.id);
      fetchUserPosts();
    } else {
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Helper function to validate post data
  const validatePost = (post) => {
    // Make sure it has at least minimal required fields
    if (!post || !post.id || !post.description) {
      console.warn("Post is missing required fields:", post);
      return false;
    }
    
    // Make sure media items have valid URLs
    if (post.media && Array.isArray(post.media)) {
      for (const media of post.media) {
        if (!media.url || !media.type) {
          console.warn("Post has media with missing url or type:", media);
          return false;
        }
      }
    }
    
    return true;
  };

  const fetchUserPosts = async () => {
    try {
      // Check for user object existence
      if (!user) {
        console.error("User object is missing");
        setError("Unable to fetch posts: User is not logged in");
        setLoading(false);
        return;
      }
      
      // Get userId from either id or _id field (MongoDB often uses _id)
      const userId = user.id || user._id;
      
      if (!userId) {
        console.error("User ID is missing from user object:", user);
        setError("Unable to fetch posts: User ID is missing");
        setLoading(false);
        return;
      }
      
      console.log("Fetching posts for user ID:", userId);
      const response = await axios.get(`/api/users/${userId}/posts`);
      
      // Ensure that response.data is an array
      let postsData = Array.isArray(response.data) ? response.data : [];
      console.log("User posts data by ID:", postsData);
      
      // If no posts found by ID, try getting all posts and filter by username
      if (postsData.length === 0 && user.name) {
        console.log("No posts found by ID, trying to find posts by username:", user.name);
        const allPostsResponse = await axios.get('/api/posts');
        const allPosts = Array.isArray(allPostsResponse.data) ? allPostsResponse.data : [];
        
        // Filter posts by username (case insensitive)
        const userPostsByName = allPosts.filter(post => 
          post.userName && post.userName.toLowerCase() === user.name.toLowerCase()
        );
        
        console.log(`Found ${userPostsByName.length} posts by username "${user.name}"`);
        
        if (userPostsByName.length > 0) {
          postsData = userPostsByName;
        }
      }
      
      // Filter out posts that don't have valid data
      const validPosts = postsData.filter(validatePost);
      if (validPosts.length !== postsData.length) {
        console.warn(`Filtered out ${postsData.length - validPosts.length} invalid posts`);
      }
      
      setPosts(validPosts);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user posts:", err);
      setError("Failed to load your posts: " + (err.response?.data?.message || err.message));
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
  
  // Post menu handlers
  const handleMenuOpen = (event, postId) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentPostId(postId);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentPostId(null);
  };
  
  // Edit post handlers
  const handleEditClick = () => {
    const post = posts.find(p => p.id === currentPostId);
    if (post) {
      setEditDescription(post.description);
      setEditPostId(post.id);
      setCurrentPostMedia(post.media || []);
      setKeepExistingMedia(true);
      setEditFiles([]);
      setEditPreviews([]);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };
  
  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditDescription("");
    setEditPostId(null);
    setEditFiles([]);
    setEditPreviews([]);
    setCurrentPostMedia([]);
  };
  
  // Handle file selection for edit
  const handleEditFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file count
    if (editFiles.length + selectedFiles.length > 3) {
      setSnackbar({
        open: true,
        message: "Maximum 3 files allowed",
        severity: "error"
      });
      return;
    }
    
    // Validate file types
    const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime"];
    const invalidFiles = selectedFiles.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setSnackbar({
        open: true,
        message: "Only images (JPEG, PNG, GIF) and videos (MP4, QuickTime) are allowed",
        severity: "error"
      });
      return;
    }
    
    // Create previews for the selected files
    const newPreviews = selectedFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "image" : "video"
    }));
    
    setEditFiles([...editFiles, ...selectedFiles]);
    setEditPreviews([...editPreviews, ...newPreviews]);
    
    // If adding new files, don't keep existing media
    if (selectedFiles.length > 0) {
      setKeepExistingMedia(false);
    }
  };
  
  // Remove a file from edit previews
  const removeEditFile = (index) => {
    const newFiles = [...editFiles];
    const newPreviews = [...editPreviews];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(editPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setEditFiles(newFiles);
    setEditPreviews(newPreviews);
  };
  
  // Toggle keeping existing media
  const toggleKeepExistingMedia = () => {
    setKeepExistingMedia(!keepExistingMedia);
    
    // If toggling to not keep existing media and no new files added yet,
    // clear edit files to ensure clean slate
    if (keepExistingMedia && editFiles.length === 0) {
      setEditFiles([]);
      setEditPreviews([]);
    }
  };
  
  const handleEditSubmit = async () => {
    try {
      setEditLoading(true);
      
      // Get the user ID from either field
      const userId = user?.id || user?._id;
      const userName = user?.name;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Find the post we're trying to edit
      const postToEdit = posts.find(post => post.id === editPostId);
      
      if (!postToEdit) {
        throw new Error("Post not found");
      }
      
      console.log(`Attempting to update post ${editPostId} for user ${userId}`);
      console.log(`Post belongs to userId: ${postToEdit.userId}, userName: ${postToEdit.userName}`);
      
      // Use the post's userId if the usernames match, otherwise use the logged-in user's ID
      const effectiveUserId = (userName && userName.toLowerCase() === postToEdit.userName?.toLowerCase()) 
        ? postToEdit.userId 
        : userId;
      
      console.log(`Using effectiveUserId for update: ${effectiveUserId}`);
      
      // Check if we're updating media files
      const isMediaUpdate = editFiles.length > 0 || !keepExistingMedia;
      
      if (isMediaUpdate) {
        // We need to use FormData for file uploads
        const formData = new FormData();
        formData.append("description", editDescription);
        formData.append("userId", effectiveUserId);
        formData.append("keepExistingMedia", keepExistingMedia.toString());
        
        // Add files if we have any new ones
        editFiles.forEach(file => {
          formData.append("files", file);
        });
        
        // Make the update request
        const response = await axios.post(`/api/posts/${editPostId}/update-with-media`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        });
        
        // Update local state with the response
        const updatedPost = response.data;
        setPosts(posts.map(post => 
          post.id === editPostId ? updatedPost : post
        ));
      } else {
        // Simple description update without media changes
        await axios.put(`/api/posts/${editPostId}`, { 
          description: editDescription,
          userId: effectiveUserId 
        });
        
        // Update the post in the local state
        setPosts(posts.map(post => 
          post.id === editPostId 
            ? { ...post, description: editDescription } 
            : post
        ));
      }
      
      setEditLoading(false);
      handleEditClose();
      
      // Show success message
      setSnackbar({
        open: true,
        message: "Post updated successfully!",
        severity: "success"
      });
    } catch (err) {
      console.error("Error updating post:", err);
      setEditLoading(false);
      
      // Show error message
      setSnackbar({
        open: true,
        message: "Failed to update post: " + (err.response?.data?.message || err.message),
        severity: "error"
      });
    }
  };
  
  // Delete post handlers
  const handleDeleteClick = () => {
    setDeletePostId(currentPostId);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setDeletePostId(null);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      
      // Get the user ID from either field
      const userId = user?.id || user?._id;
      const userName = user?.name;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Find the post we're trying to delete
      const postToDelete = posts.find(post => post.id === deletePostId);
      
      if (!postToDelete) {
        throw new Error("Post not found");
      }
      
      console.log(`Attempting to delete post ${deletePostId} for user ${userId}`);
      console.log(`Post belongs to userId: ${postToDelete.userId}, userName: ${postToDelete.userName}`);
      
      // Use the post's userId if the usernames match, otherwise use the logged-in user's ID
      const effectiveUserId = (userName && userName.toLowerCase() === postToDelete.userName?.toLowerCase()) 
        ? postToDelete.userId 
        : userId;
      
      console.log(`Using effectiveUserId for deletion: ${effectiveUserId}`);
      
      // Include userId as a query parameter
      await axios.delete(`/api/posts/${deletePostId}`, {
        params: { userId: effectiveUserId }
      });
      
      // Remove the post from the local state
      setPosts(posts.filter(post => post.id !== deletePostId));
      setDeleteLoading(false);
      handleDeleteClose();
      
      // Show success message
      setSnackbar({
        open: true,
        message: "Post deleted successfully!",
        severity: "success"
      });
    } catch (err) {
      console.error("Error deleting post:", err);
      setDeleteLoading(false);
      
      // Show error message with more details
      setSnackbar({
        open: true,
        message: "Failed to delete post: " + (err.response?.data?.message || err.message),
        severity: "error"
      });
    }
  };

  // Utility function to check if user has created posts but they're not showing up
  const checkAllPosts = async () => {
    try {
      setCheckingAllPosts(true);
      const response = await axios.get(`/api/posts`);
      const allPostsData = Array.isArray(response.data) ? response.data : [];
      console.log("All posts data:", allPostsData);
      setAllPosts(allPostsData);
      
      // Get user ID
      const userId = user?.id || user?._id;
      
      if (userId) {
        // Filter posts by user ID to see if any exist
        const userPostsInAll = allPostsData.filter(post => 
          post.userId === userId || post.user_id === userId || post.authorId === userId
        );
        
        console.log(`Found ${userPostsInAll.length} posts for user ID ${userId} in all posts`);
        
        if (userPostsInAll.length > 0 && posts.length === 0) {
          console.log("User has posts but they're not showing up in MyPosts - ID mismatch likely");
          console.log("First user post details:", userPostsInAll[0]);
        }
      }
      
      setCheckingAllPosts(false);
    } catch (err) {
      console.error("Error checking all posts:", err);
      setCheckingAllPosts(false);
    }
  };

  // Utility function to claim posts that match your username
  const claimPosts = async () => {
    try {
      if (!user || (!user.id && !user._id) || !user.name) {
        setError("You must be logged in to claim posts");
        return;
      }
      
      setClaimingPosts(true);
      
      // Get all posts
      const allPostsResponse = await axios.get('/api/posts');
      const allPosts = Array.isArray(allPostsResponse.data) ? allPostsResponse.data : [];
      
      // Get user ID - both formats
      const userId = user.id || user._id;
      
      // Filter posts by username (case insensitive)
      const userPostsByName = allPosts.filter(post => 
        post.userName && post.userName.toLowerCase() === user.name.toLowerCase() &&
        post.userId !== userId // Only include posts that don't already have your ID
      );
      
      console.log(`Found ${userPostsByName.length} posts with username "${user.name}" not linked to your user ID`);
      
      if (userPostsByName.length === 0) {
        alert("No posts found matching your username that need to be claimed.");
        setClaimingPosts(false);
        return;
      }
      
      // Update each post with the current user ID
      let updatedCount = 0;
      let errors = 0;
      
      for (const post of userPostsByName) {
        try {
          // Get the post ID (handle different formats)
          const postId = post.id || post._id;
          if (!postId) {
            console.error("Post missing ID field:", post);
            errors++;
            continue;
          }
          
          // Update post with your user ID
          console.log(`Attempting to claim post ${postId} for user ${userId}`);
          await axios.put(`/api/posts/${postId}/claim`, { userId: userId });
          updatedCount++;
        } catch (err) {
          console.error(`Failed to claim post:`, err);
          errors++;
        }
      }
      
      if (updatedCount > 0) {
        console.log(`Successfully claimed ${updatedCount} posts`);
        alert(`Successfully claimed ${updatedCount} posts. Refreshing your posts.`);
        
        // Wait a moment for the backend to update
        setTimeout(() => {
          // Refresh posts after claiming
          fetchUserPosts();
        }, 1000);
      } else {
        alert("No posts were successfully claimed. Please check the console for errors.");
      }
      
      if (errors > 0) {
        console.error(`Failed to claim ${errors} posts`);
      }
      
      setClaimingPosts(false);
    } catch (err) {
      console.error("Error claiming posts:", err);
      setError("Failed to claim posts: " + (err.response?.data?.message || err.message));
      setClaimingPosts(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
        <Button onClick={fetchUserPosts} sx={{ mt: 2 }}>
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
        <Typography variant="h5">My Posts</Typography>
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
            You haven't posted anything yet
          </Typography>
          <Typography color="text.secondary" paragraph>
            Share your skills or knowledge with others!
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/create"
            startIcon={<AddIcon />}
          >
            Create Your First Post
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
                  />
                }
                title={post.userName}
                subheader={new Date(post.createdAt).toLocaleString()}
                action={
                  <IconButton 
                    aria-label="post settings"
                    onClick={(e) => handleMenuOpen(e, post.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                }
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
                
                {/* Enhanced action buttons for the post */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 1, 
                    mt: 2,
                    borderTop: '1px solid #eee',
                    pt: 2 
                  }}
                >
                  <ButtonGroup variant="outlined" size="small">
                    <Tooltip title="Edit this post">
                      <Button
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditDescription(post.description);
                          setEditPostId(post.id);
                          setCurrentPostMedia(post.media || []);
                          setKeepExistingMedia(true);
                          setEditFiles([]);
                          setEditPreviews([]);
                          setEditDialogOpen(true);
                        }}
                        sx={{ 
                          borderRadius: '4px 0 0 4px',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                          }
                        }}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                    
                    <Tooltip title="Delete this post">
                      <Button
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          setDeletePostId(post.id);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{ 
                          borderRadius: '0 4px 4px 0',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.08)'
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </Tooltip>
                  </ButtonGroup>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      {/* Post options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Edit dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eee', 
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <EditIcon fontSize="small" color="primary" />
          Edit Post
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
            Update your post description and media below. You can keep existing media or replace it.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="description"
            label="Post Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {/* Existing media toggle */}
          {currentPostMedia && currentPostMedia.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="outlined" 
                color={keepExistingMedia ? "success" : "error"}
                onClick={toggleKeepExistingMedia}
                sx={{ mb: 2 }}
              >
                {keepExistingMedia ? "Keeping Existing Media" : "Replacing All Media"}
              </Button>
              
              {keepExistingMedia && (
                <Box 
                  sx={{ 
                    display: "grid",
                    gridTemplateColumns: currentPostMedia.length === 1 ? "1fr" : 
                                          currentPostMedia.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
                    gap: 2,
                    mb: 2
                  }}
                >
                  {currentPostMedia.map((media, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        position: "relative",
                        height: 150,
                        borderRadius: 1,
                        overflow: "hidden",
                        border: '1px solid #eee'
                      }}
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.url}
                          alt={`Current content ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '100%',
                          bgcolor: '#f5f5f5'
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            Video content
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
          
          {/* New media previews */}
          {editPreviews.length > 0 && (
            <Box 
              sx={{ 
                display: "grid",
                gridTemplateColumns: editPreviews.length === 1 ? "1fr" : 
                                     editPreviews.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
                gap: 2,
                mb: 2
              }}
            >
              {editPreviews.map((preview, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    position: "relative",
                    height: 150,
                    borderRadius: 1,
                    overflow: "hidden",
                    border: '1px solid #eee'
                  }}
                >
                  {preview.type === "image" ? (
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      bgcolor: '#f5f5f5'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Video preview
                      </Typography>
                    </Box>
                  )}
                  <IconButton
                    sx={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                      padding: 0.5
                    }}
                    size="small"
                    onClick={() => removeEditFile(index)}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
          
          {/* Upload buttons */}
          {(editFiles.length < 3 && (!keepExistingMedia || currentPostMedia.length === 0)) && (
            <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 3 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoAlternate />}
                size="small"
              >
                Add Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleEditFileSelect}
                />
              </Button>
              
              <Button
                component="label"
                variant="outlined"
                startIcon={<Videocam />}
                size="small"
              >
                Add Video
                <input
                  type="file"
                  hidden
                  accept="video/*"
                  onChange={handleEditFileSelect}
                />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={handleEditClose}
            color="inherit"
            sx={{ fontWeight: 'normal' }}
            disabled={editLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            color="primary"
            disabled={!editDescription.trim() || editLoading}
            startIcon={editLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {editLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eee', 
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <DeleteIcon fontSize="small" color="error" />
          Delete Post
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
          <Button 
            onClick={handleDeleteClose}
            color="inherit"
            sx={{ fontWeight: 'normal' }}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/error notification */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={5000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 