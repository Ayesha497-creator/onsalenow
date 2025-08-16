import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";
import { app, database } from "./config";

// Initialize Firebase Auth
const auth = getAuth(app);

// Register a new user
export const registerUser = async (email, password, userData) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Store additional user data in the database
    await set(ref(database, `Buyer/${user.uid}`), {
      ...userData,
      uid: user.uid,
      createdAt: new Date().toISOString(),
    });

    // Return user data for the app
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userData,
      },
    };
  } catch (error) {
    console.error("Error registering user:", error);
    let errorMessage = "Failed to register user";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email is already in use";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Get additional user data from the database
    const userRef = ref(database, `Buyer/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();

      // Check if user is blocked
      if (userData.status === "blocked") {
        await signOut(auth);
        return {
          success: false,
          error: "Your account has been blocked. Please contact support.",
        };
      }

      // Return user data for the app
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...userData,
        },
      };
    } else {
      // User exists in Auth but not in database
      await signOut(auth);
      return {
        success: false,
        error: "User data not found. Please contact support.",
      };
    }
  } catch (error) {
    console.error("Error logging in:", error);
    let errorMessage = "Failed to login";

    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      errorMessage = "Invalid email or password";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed login attempts. Please try again later.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Update user profile
export const updateUserProfile = async (userId, userData) => {
  try {
    const userRef = ref(database, `Buyer/${userId}`);
    await update(userRef, {
      ...userData,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    return {
      success: false,
      error: "Failed to logout",
    };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

