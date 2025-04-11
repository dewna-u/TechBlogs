import React from "react";
import { Container, Typography } from "@mui/material";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Container sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This is your personalized dashboard. Start posting, learning, or exploring!
      </Typography>
    </Container>
  );
}
