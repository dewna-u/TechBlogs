// src/components/FollowersModal.jsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from "@mui/material";
import axios from "axios";

export default function FollowersModal({ open, onClose, title, userIds }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (open && userIds?.length > 0) {
      Promise.all(userIds.map(id =>
        axios.get(`http://localhost:8080/api/users/${id}`).then(res => res.data)
      )).then(setUsers);
    }
  }, [open, userIds]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: 400,
          bgcolor: "background.paper",
          p: 3,
          m: "auto",
          mt: 10,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Divider />
        <List>
          {users.length > 0 ? users.map((u) => (
            <ListItem key={u.id}>
              <ListItemAvatar>
                <Avatar src={u.profilePic} />
              </ListItemAvatar>
              <ListItemText primary={u.name} secondary={u.email} />
            </ListItem>
          )) : (
            <Typography variant="body2" mt={2}>No users found.</Typography>
          )}
        </List>
      </Box>
    </Modal>
  );
}
