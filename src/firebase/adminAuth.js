import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { app, database } from "./config";

// Initialize Firebase Auth
const auth = getAuth(app);

// Admin invite code (in a real app, this would be stored securely and generated dynamically)
const ADMIN_INVITE_CODE = "ONSALENOW-ADMIN-2025";

// Seed admin user if it doesn't exist
export const seedAdminUser = async () => {
  try {
    console.log("Checking if admin user exists...");

    // Format email for Firebase path (replace dots with commas)
    const formattedEmail = "admin@example.com".replace(/\./g, ",");

    // Check if admin user exists in the database
    const adminRef = ref(database, `admin/${formattedEmail}`);
    const snapshot = await get(adminRef);

    if (!snapshot.exists()) {
      console.log("Admin user doesn't exist in database. Creating...");

      try {
        // Try to create the user in Firebase Auth
        await createUserWithEmailAndPassword(
          auth,
          "admin@example.com",
          "abc123"
        );
        console.log("Admin user created in Firebase Auth");
      } catch (authError) {
        // If the user already exists in Auth but not in the database, that's fine
        if (authError.code !== "auth/email-already-in-use") {
          console.error("Error creating admin in auth:", authError);
          throw authError;
        }
        console.log("Admin user already exists in Auth but not in database");
      }

      // Create admin record in the database
      await set(adminRef, {
        email: "admin@example.com",
        role: "admin",
        name: "Admin User",
        createdAt: new Date().toISOString(),
      });

      console.log("Admin user created in database");
      return true;
    }

    console.log("Admin user already exists in database");
    return false;
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
};

// Register a new admin
export const registerAdmin = async (email, password, name, inviteCode) => {
  try {
    console.log("Attempting to register new admin:", email);

    // Verify invite code
    if (inviteCode !== ADMIN_INVITE_CODE) {
      console.log("Invalid invite code provided:", inviteCode);
      return {
        success: false,
        error: "Invalid invite code. Please contact an existing administrator.",
      };
    }

    // Format email for Firebase path
    const formattedEmail = email.replace(/\./g, ",");

    // Check if admin already exists
    const adminRef = ref(database, `admin/${formattedEmail}`);
    const snapshot = await get(adminRef);

    if (snapshot.exists()) {
      console.log("Admin already exists with this email");
      return {
        success: false,
        error: "An admin with this email already exists.",
      };
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("Admin created in Firebase Auth:", user.uid);

    // Create admin record in the database
    await set(adminRef, {
      email: email,
      role: "admin",
      name: name,
      uid: user.uid,
      createdAt: new Date().toISOString(),
    });

    console.log("Admin record created in database");
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: name,
        role: "admin",
      },
    };
  } catch (error) {
    console.error("Error registering admin:", error);
    let errorMessage = "Failed to register admin";

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already in use";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Login admin
export const loginAdmin = async (email, password) => {
  try {
    console.log("Attempting admin login for:", email);

    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    console.log("Auth successful, checking admin privileges");

    // Format email for Firebase path (replace dots with commas)
    const formattedEmail = email.replace(/\./g, ",");

    // Check if user is an admin in the database
    const adminRef = ref(database, `admin/${formattedEmail}`);
    const snapshot = await get(adminRef);

    console.log("Admin check result:", snapshot.exists());

    if (snapshot.exists()) {
      const adminData = snapshot.val();
      console.log("Admin data found:", adminData);

      // Return admin data for the app
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...adminData,
        },
      };
    } else {
      console.log("User authenticated but not an admin");
      // User exists in Auth but not in admin collection
      return {
        success: false,
        error:
          "You don't have admin privileges. Please contact the system administrator.",
      };
    }
  } catch (error) {
    console.error("Error logging in admin:", error);
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

// Logout admin
export const logoutAdmin = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem("adminUser");
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    return {
      success: false,
      error: "Failed to logout",
    };
  }
};

// Generate a new invite code (for future use)
export const generateInviteCode = async (adminId) => {
  try {
    // In a real app, you would generate a unique code and store it in the database
    // For now, we'll just return a static code
    return {
      success: true,
      inviteCode: ADMIN_INVITE_CODE,
    };
  } catch (error) {
    console.error("Error generating invite code:", error);
    return {
      success: false,
      error: "Failed to generate invite code",
    };
  }
};
