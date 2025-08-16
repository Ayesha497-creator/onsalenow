import { ref, get, query, orderByChild, equalTo, set, remove } from "firebase/database";
import { database } from "./config";

// Get all wishlist products for a user
export const getAllWishlistProducts = async (userId) => {
    try {
        const wishlistRef = ref(database, `wishlist/${userId}`);
        const snapshot = await get(wishlistRef);

        if (snapshot.exists()) {
            const wishlistProducts = [];
            snapshot.forEach((childSnapshot) => {
                wishlistProducts.push({
                    productId: childSnapshot.key,  // The productId
                    ...childSnapshot.val(),       // The product details: productName, createdAt, etc.
                });
            });

            return {
                success: true,
                data: wishlistProducts,  // Return an array of products in the wishlist
            };
        }

        return {
            success: true,
            data: [],  // Return an empty array if no products are found
        };
    } catch (error) {
        console.error("Error getting user wishlist:", error);
        return {
            success: false,
            error: "Failed to load wishlist products",
        };
    }
};

// Check if a product is in the user's wishlist
// Check if a product is in the user's wishlist
export const isProductInWishlist = async (userId, productId) => {
    try {
        const wishlistRef = ref(database, `wishlist/${userId}/${productId}`);
        const productSnapshot = await get(wishlistRef);

        if (productSnapshot.exists()) {
            return true;  // Product is in the wishlist
        }

        return false;  // Product is not in the wishlist
    } catch (error) {
        console.error("Error checking if product is in wishlist:", error);
        return {
            success: false,
            error: "Failed to check wishlist",
        };
    }
};


// Add or remove a product from the wishlist
export const addProductToWishlist = async (userId, productId, productName = "") => {
    try {
        const wishlistRef = ref(database, `wishlist/${userId}/${productId}`);

        // Check if the product is already in the wishlist
        const existingProductSnapshot = await get(wishlistRef);

        // If the product exists, remove it, otherwise add it
        if (existingProductSnapshot.exists()) {
            // Remove the product from the wishlist
            await remove(wishlistRef);
            return {
                success: true,
                message: "Product removed from wishlist",
            };
        } else {
            // Add the product to the wishlist
            await set(wishlistRef, {
                productName,
                product_id: productId,
                createdAt: new Date().toISOString(),
            });
            return {
                success: true,
                message: "Product added to wishlist",
            };
        }
    } catch (error) {
        console.error("Error adding/removing product from wishlist:", error);
        return {
            success: false,
            error: "Failed to add/remove product to/from wishlist",
        };
    }
};


// Remove a product from the user's wishlist
export const removeProductFromWishlist = async (userId, productId) => {
    try {
        const wishlistRef = ref(database, `wishlist/${userId}/${productId}`);

        // Check if the product exists in the wishlist
        const productSnapshot = await get(wishlistRef);
        if (!productSnapshot.exists()) {
            return {
                success: false,
                message: "Product not found in wishlist",
            };
        }

        // Remove the product from the wishlist
        await remove(wishlistRef);

        return {
            success: true,
            message: "Product removed from wishlist",
        };
    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        return {
            success: false,
            error: "Failed to remove product from wishlist",
        };
    }
};
