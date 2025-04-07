import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import PostFeed from './pages/PostFeed';
import LearningPlan from './pages/LearningPlan';
import Profile from './pages/Profile';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/posts" element={<PostFeed />} />
      <Route path="/create" element={<CreatePost />} />
      <Route path="/learning-plan" element={<LearningPlan />} />
      <Route path="/profile/:userId" element={<Profile />} />
    </Routes>
  );
}

export default App;
