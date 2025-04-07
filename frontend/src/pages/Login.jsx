import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';
import { Box, Container, Typography, Paper } from '@mui/material';

export default function Login() {
  const handleSuccess = (credentialResponse) => {
    const decoded = jwt_decode(credentialResponse.credential);
    console.log('Decoded JWT:', decoded);
    // You can send `decoded` to your backend
  };
  axios.post("http://localhost:8080/api/auth/google", {
    name: decoded.name,
    email: decoded.email,
    profilePic: decoded.picture
  }).then(res => {
    console.log("User saved:", res.data);
    // Optionally store user in context or localStorage
  });

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to TechBlogs
        </Typography>
        <Typography variant="body1" gutterBottom>
          Login with your Google account to continue
        </Typography>

        <Box mt={4}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.log('Login Failed');
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
}
