import { getStorage } from "firebase/storage";
import { app } from "./config";

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

export { storage };
