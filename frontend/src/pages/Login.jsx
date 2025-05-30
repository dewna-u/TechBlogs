import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button
} from '@mui/material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  // 🔐 Custom login handler
  const handleCustomLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8080/api/auth/login", {
        email,
        password,
      });
      console.log("✅ Custom login:", res.data);
      setUser(res.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login error:", err);
      alert("Invalid credentials");
    }
  };

  // 🔑 Google OAuth handler
  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log('✅ Google user decoded:', decoded);

    axios.post("http://localhost:8080/api/auth/google", {
      name: decoded.name,
      email: decoded.email,
      profilePic: decoded.picture
    }).then(res => {
      console.log("✅ Google user saved:", res.data);
      setUser(res.data);
      navigate("/dashboard");
    }).catch(err => {
      console.error("❌ Google login error:", err);
    });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to TechBlogs
        </Typography>
        <Typography variant="body1" gutterBottom>
          Sign in with your email or Google account
        </Typography>

        {/* 📨 Email/password login */}
        <Box component="form" onSubmit={handleCustomLogin} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </Box>

        <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>
          OR
        </Typography>

        {/* 🔐 Google Login */}
        <Box display="flex" justifyContent="center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('❌ Google Login Failed');
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
}
