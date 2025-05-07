import React, { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  InputBase,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";


export default function Navbar({ toggleTheme }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, setUser } = useContext(AuthContext);


  const [anchorEl, setAnchorEl] = useState(null);


  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
  };
  

  return (
    <AppBar position="static" sx={{ backgroundColor: "#2E3B55", px: 2 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Brand */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          TechBlogs
        </Typography>

        {/* Navigation Links */}
        {user && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button color="inherit" component={Link} to="/posts">
              Feed
            </Button>
            <Button color="inherit" component={Link} to="/create">
              Create
            </Button>
            <Button color="inherit" component={Link} to="/my-posts">
              My Posts
            </Button>
            <Button color="inherit" component={Link} to="/learning-plan">
              Learn
            </Button>
            <Button color="inherit" component={Link} to="/users">
              Profiles
            </Button>
          </Box>
        )}

        {/* Right Side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Search */}
          {user && (
            <Box
              sx={{
                backgroundColor: "rgba(255,255,255,0.15)",
                px: 2,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <SearchIcon />
              <InputBase
                placeholder="Search…"
                sx={{ ml: 1, color: "white" }}
              />
            </Box>
          )}

          {/* Dark Mode Toggle */}
          <Tooltip title="Toggle theme">
            <IconButton onClick={toggleTheme} color="inherit">
              {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          {user && (
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Avatar / Login */}
          {!user ? (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          ) : (
            <>
              <Tooltip title="Account settings">
                <IconButton onClick={handleMenuOpen}>
                  <Avatar src={user.profilePic} alt={user.name} />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate(`/profile/${user.id}`);
                  }}
                >
                  My Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    handleLogout();
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
