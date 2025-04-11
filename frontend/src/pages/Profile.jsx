import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", profilePic: "" });
  const [isEditing, setIsEditing] = useState(false);
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const canEdit = loggedInUser && loggedInUser.id === userId;


  // Fetch user data
  useEffect(() => {
    axios.get(`http://localhost:8080/api/users/${userId}`).then((res) => {
      setForm(res.data);
    });
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    axios
      .put(`http://localhost:8080/api/users/${userId}`, form)
      .then((res) => {
        alert("Profile updated");
        setIsEditing(false);
      })
      .catch((err) => {
        alert("Update failed");
        console.error(err);
      });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your account?")) {
      axios
        .delete(`http://localhost:8080/api/users/${userId}`)
        .then(() => {
          localStorage.removeItem("user");
          navigate("/register");
        })
        .catch((err) => {
          alert("Deletion failed");
          console.error(err);
        });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Avatar
            src={form.profilePic}
            sx={{ width: 100, height: 100, mb: 2 }}
          />
          <Typography variant="h5" fontWeight="bold">
            {form.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {form.email}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {isEditing ? (
          <>
            <TextField
              label="Name"
              name="name"
              fullWidth
              value={form.name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              name="email"
              fullWidth
              value={form.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Profile Picture URL"
              name="profilePic"
              fullWidth
              value={form.profilePic}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </Box>
          </>
        ) : (
            <Box display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
            <Button color="error" onClick={handleDelete}>
              Delete Account
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
