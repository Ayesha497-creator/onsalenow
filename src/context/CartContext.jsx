"use client"

import { createContext, useState, useEffect, useContext } from "react"

// Create the cart context
export const CartContext = createContext()

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

// Cart provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)

  // Load cart from local storage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem("ONSALENOWCart")
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart)
        setCartItems(parsedCart)

        // Calculate and set cart count and total immediately after loading from storage
        const count = parsedCart.reduce((total, item) => total + item.quantity, 0)
        setCartCount(count)

        const total = parsedCart.reduce((sum, item) => {
          const price =
            typeof item.price === "string" ? Number.parseFloat(item.price.replace(/[^0-9.]/g, "")) : item.price
          return sum + price * item.quantity
        }, 0)
        setCartTotal(total)
      } catch (error) {
        console.error("Error parsing cart from local storage:", error)
        localStorage.removeItem("ONSALENOWCart")
      }
    }
  }, [])

  // Update cart count and total whenever cart items change
  useEffect(() => {
    // Update cart count (total quantity of all items)
    const count = cartItems.reduce((total, item) => total + item.quantity, 0)
    setCartCount(count)

    // Update cart total price
    const total = cartItems.reduce((sum, item) => {
      const price = typeof item.price === "string" ? Number.parseFloat(item.price.replace(/[^0-9.]/g, "")) : item.price
      return sum + price * item.quantity
    }, 0)
    setCartTotal(total)

    // Save to local storage
    localStorage.setItem("ONSALENOWCart", JSON.stringify(cartItems))
  }, [cartItems])

  // Add item to cart
  const addToCart = (product, quantity = 1, size = null, color = null) => {
    setCartItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.size === size && item.color === color,
      )

      let updatedItems
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += quantity
      } else {
        // Add new item to cart
        updatedItems = [
          ...prevItems,
          {
            ...product,
            quantity,
            size,
            color,
            addedAt: new Date().toISOString(),
          },
        ]
      }

      // Immediately save to localStorage
      localStorage.setItem("ONSALENOWCart", JSON.stringify(updatedItems))
      return updatedItems
    })

    return true // Return success
  }

  // Update item quantity
  const updateQuantity = (itemId, size, color, quantity) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        if (item.id === itemId && item.size === size && item.color === color) {
          return { ...item, quantity }
        }
        return item
      })

      // Immediately save to localStorage
      localStorage.setItem("ONSALENOWCart", JSON.stringify(updatedItems))
      return updatedItems
    })
  }

  // Remove item from cart
  const removeFromCart = (itemId, size, color) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.filter(
        (item) => !(item.id === itemId && item.size === size && item.color === color),
      )

      // Immediately save to localStorage
      localStorage.setItem("ONSALENOWCart", JSON.stringify(updatedItems))
      return updatedItems
    })
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem("ONSALENOWCart")
  }

  // Context value
  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
