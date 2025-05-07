import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

import Layout from "./Layout";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import PostFeed from "./pages/PostFeed";
import LearningPlan from "./pages/LearningPlan";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AllProfiles from "./pages/AllProfiles";
import Dashboard from "./pages/Dashboard";
import MyPosts from "./pages/MyPosts";

function App() {
  const [mode, setMode] = useState("light");

  const theme = createTheme({
    palette: {
      mode,
    },
  });

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Ensures base styles switch correctly */}
      <Routes>
        {/* Routes with Navbar */}
        <Route element={<Layout toggleTheme={toggleTheme} />}>
          <Route path="/" element={<Home />} />
          <Route path="/posts" element={<PostFeed />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/my-posts" element={<MyPosts />} />
          <Route path="/learning-plan" element={<LearningPlan />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/users" element={<AllProfiles />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Auth routes without Navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />

      </Routes>
    </ThemeProvider>
  );
}

export default App;
