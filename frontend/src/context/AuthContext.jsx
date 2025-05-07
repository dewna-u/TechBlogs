import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Normalize user object to ensure id field is always present
  const normalizeUser = (userData) => {
    if (!userData) return null;
    
    // Ensure we always have an id field (some backends return _id)
    if (!userData.id && userData._id) {
      userData.id = userData._id;
    }
    
    // Make sure user has a name
    if (!userData.name && userData.email) {
      // Extract name from email if needed
      const nameFromEmail = userData.email.split('@')[0];
      userData.name = nameFromEmail;
    }
    
    return userData;
  };

  // Override setUser to normalize the user object
  const setNormalizedUser = (userData) => {
    if (typeof userData === 'function') {
      setUser((prevUser) => normalizeUser(userData(prevUser)));
    } else {
      setUser(normalizeUser(userData));
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Expose a way to update just the user's profile information
  const updateUserProfile = (profile) => {
    setNormalizedUser(currentUser => ({
      ...currentUser,
      ...profile
    }));
  };

  return (
    <AuthContext.Provider value={{ user, setUser: setNormalizedUser, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
