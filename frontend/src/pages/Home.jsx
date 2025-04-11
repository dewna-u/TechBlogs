import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>

      <Container
        maxWidth="md"
        sx={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          py: 10,
        }}
      >
        <Typography variant="h2" fontWeight="bold" gutterBottom>
          Welcome to <span style={{ color: "#3f51b5" }}>TechBlogs</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Share skills. Learn new ones. Grow together.
        </Typography>

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={Link}
            to="/register"
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            component={Link}
            to="/login"
          >
            Already have an account?
          </Button>
        </Box>
      </Container>
    </>
  );
}
