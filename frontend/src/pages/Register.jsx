import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log("🔐 Sending registration data:", form);

    try {
      const res = await axios.post("/api/auth/register", form);
      console.log("✅ Registered user:", res.data);
      navigate("/login");
    } catch (err) {
      console.error("❌ Registration failed:", err.response?.data || err.message);
      alert("Registration failed");
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    
    console.log("🔑 Google user decoded:", decoded);

    // Send to backend register/login endpoint
    axios
      .post("/api/auth/google", {
        name: decoded.name,
        email: decoded.email,
        profilePic: decoded.picture,
      })
      .then((res) => {
        console.log("✅ Google registered user:", res.data);
        navigate("/dashboard"); // Redirect to posts page on successful login
      })
      .catch((err) => {
        console.error("❌ Google signup error:", err.response?.data || err.message);
      });
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper elevation={4} sx={{ padding: 4, borderRadius: 3, width: "100%" }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          Register
        </Typography>

        {/* Email/Password Form */}
        <Box
          component="form"
          onSubmit={handleRegister}
          sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            size="large"
            sx={{ mt: 2 }}
          >
            Register
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>OR</Divider>

        {/* Google Sign Up */}
        <Box display="flex" justifyContent="center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.error("❌ Google Sign Up Failed");
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
}
