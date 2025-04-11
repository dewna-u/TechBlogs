import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
} from "@mui/material";
import axios from "axios";
import { Link } from "react-router-dom";

export default function AllProfiles() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/users")
      .then((res) => {
        console.log("✅ Users fetched:", res.data);
        setUsers(res.data);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch users:", err.response?.data || err.message);
      });
  }, []);
  

  return (
    <Container sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom>
        All TechBlogs Users
      </Typography>
      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card>
              {user.profilePic && (
                <CardMedia
                  component="img"
                  height="180"
                  image={user.profilePic}
                  alt={user.name}
                />
              )}
              <CardContent>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2">{user.email}</Typography>
                <Button
                  component={Link}
                  to={`/profile/${user.id}`}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
