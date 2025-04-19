// src/components/FollowButton.jsx
import React, { useState, useEffect, useContext } from "react";
import { Button } from "@mui/material";
import axios from "axios";
import { AuthContext } from "./context/AuthContext"; // ✅ Adjust if needed

export default function FollowButton({ profileUserId }) {
  const { user, setUser } = useContext(AuthContext);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    console.log("🔍 Current user:", user);
    console.log("👤 Target profileUserId:", profileUserId);

    setIsFollowing(user?.following?.includes(profileUserId));
  }, [user, profileUserId]);

  const handleFollowToggle = async () => {
    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      const url = `http://localhost:8080/api/users/${user._id}/${endpoint}/${profileUserId}`;

      console.log(`🔁 Performing ${endpoint.toUpperCase()} request to:`, url);

      await axios.put(url);

      const res = await axios.get(`http://localhost:8080/api/users/${user._id}`);
      console.log("✅ Updated user after follow toggle:", res.data);

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("❌ Follow/unfollow error:", err.response?.data || err.message);
    }
  };

  if (user._id === profileUserId) {
    console.log("🛑 Follow button hidden on own profile");
    return null;
  }

  return (
    <Button
      variant={isFollowing ? "outlined" : "contained"}
      color="primary"
      onClick={handleFollowToggle}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
