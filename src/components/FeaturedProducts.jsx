"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Badge, Spinner, Alert } from "react-bootstrap"
import { Link } from "react-router-dom"
import { getRandomProducts } from "../firebase/products"
import { addProductToWishlist, getAllWishlistProducts } from "../firebase/wishlist"

const FeaturedProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlistStatus, setWishlistStatus] = useState({})
  const user = JSON.parse(localStorage.getItem("user"))

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const result = await getRandomProducts(8) // Fetch 8 random products
        if (result.success) {
          setProducts(result.data)
        } else {
          setError("Failed to fetch products")
        }
      } catch (err) {
        setError("Error fetching products: " + err.message)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Function to format website name for display
  const formatWebsiteName = (website) => {
    if (!website) return ""

    // Convert hyphenated names to capitalized words
    return website
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Function to parse price by removing currency symbols and non-numeric characters
  const parsePrice = (priceValue) => {
    if (!priceValue) return 0

    // Convert to string if it's not already
    const priceStr = String(priceValue)

    // Remove currency symbols and any non-numeric characters except decimal point
    // This will handle "Rs. 1,299", "PKR 1299", "1299", etc.
    const cleanPrice = priceStr.replace(/[^0-9.]/g, "")

    return Number.parseFloat(cleanPrice) || 0
  }

  // Function to calculate discount percentage with safety checks
  const calculateDiscount = (originalPrice, price) => {
    // Parse prices to remove currency symbols and get numeric values
    const original = parsePrice(originalPrice)
    const current = parsePrice(price)

    // Check if both are valid numbers and original is greater than current
    if (original > 0 && current > 0 && original > current) {
      return Math.round(((original - current) / original) * 100)
    }
    return 0
  }

  // Function to check if a product has a valid discount
  const hasDiscount = (product) => {
    if (product.discountPercent && !isNaN(Number(product.discountPercent)) && Number(product.discountPercent) > 0) {
      return true
    }

    const original = parsePrice(product.originalPrice)
    const current = parsePrice(product.price)
    return original > 0 && current > 0 && original > current
  }

  // Function to display price without currency symbol
  const displayPrice = (priceValue) => {
    const numericPrice = parsePrice(priceValue)
    return numericPrice.toLocaleString()
  }

  const handleHeartClick = async (e, product) => {
    if (!user) alert("You must be logged in to add to wishlist")
    try {
      const response = await addProductToWishlist(user?.uid, product.id, product?.name);
      // const responseCheck = await isProductInWishlist(user?.uid, product?.id)
      if (response?.success) {
        setWishlistStatus(prev => ({
          ...prev,
          [product.id]: !prev[product.id],
        }))
      }
      console.log("bhai", response)
    } catch (error) {
      console.log("Error adding/removing product from wishlist:- ", error)
    }
  };

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (user) {
        const response = await getAllWishlistProducts(user.uid);
        if (response?.success) {
          const status = {};
          response.data.forEach(item => {
            status[item.product_id] = true;
          });
          setWishlistStatus(status);
        }
      }
    };
    checkWishlistStatus();
  }, []);  // Re-run when products or user changes


  if (loading) {
    return (
      <Container fluid className="my-5 px-4 px-md-5 text-center">
        <h2 className="text-center mb-4 fw-bold">FEATURED PRODUCTS</h2>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid className="my-5 px-4 px-md-5">
        <h2 className="text-center mb-4 fw-bold">FEATURED PRODUCTS</h2>
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container fluid className="my-5 px-4 px-md-5">
      <h2 className="text-center mb-4 fw-bold">FEATURED PRODUCTS</h2>
      <Row>
        {products.length > 0 ? (
          products.map((product) => {
            // Get discount percent with safety checks
            let discountPercent = 0
            if (product.discountPercent && !isNaN(Number(product.discountPercent))) {
              discountPercent = Number(product.discountPercent)
            } else {
              discountPercent = calculateDiscount(product.originalPrice, product.price)
            }

            return (
              <Col key={product.id} xs={6} md={4} lg={3} className="mb-4">
                <Card className="h-100 border-0 shadow-sm product-card position-relative" style={{ cursor: "pointer" }}>
                  {/* Heart icon - excluded from navigation */}
                  <i
                    className={`position-absolute ${wishlistStatus[product.id] ? "bi-heart-fill text-danger" : "bi-heart text-danger"}`}
                    style={{ top: "10px", left: "10px", cursor: "pointer", zIndex: 2 }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation
                      handleHeartClick(e, product);
                    }}
                  ></i>

                  {/* Entire card is wrapped in a Link */}
                  <Link
                    to={`/product/${product.id}`}
                    className="text-decoration-none text-dark d-block h-100"
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}
                  ></Link>

                  {/* Card content underneath the clickable overlay */}
                  <div className="position-relative" style={{ zIndex: 0 }}>
                    <Card.Img
                      variant="top"
                      src={product.image || "/placeholder.svg?height=300&width=250&query=product"}
                      style={{ height: "280px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/stylish-streetwear-collection.png";
                      }}
                    />
                    {hasDiscount(product) && discountPercent > 0 && (
                      <Badge bg="danger" className="position-absolute" style={{ top: "10px", right: "10px" }}>
                        {discountPercent}% OFF
                      </Badge>
                    )}
                  </div>

                  <Card.Body style={{ zIndex: 0 }}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <Card.Title className="fs-6 fw-bold text-truncate" style={{ maxWidth: "80%" }}>
                        {product.name}
                      </Card.Title>
                      {product.website && (
                        <Badge bg="secondary" className="website-badge">
                          {formatWebsiteName(product.website)}
                        </Badge>
                      )}
                    </div>
                    <Card.Text className="text-muted small mb-2 text-truncate">
                      {product.description || `Product ID: ${product.id}`}
                    </Card.Text>
                    <div className="d-flex align-items-center">
                      <span className="fw-bold">Rs. {displayPrice(product.price)}</span>
                      {hasDiscount(product) && (
                        <>
                          <span className="text-muted text-decoration-line-through ms-2">
                            Rs. {displayPrice(product.originalPrice)}
                          </span>
                          {discountPercent > 0 && (
                            <span className="text-danger ms-2 small">({discountPercent}% OFF)</span>
                          )}
                        </>
                      )}
                    </div>
                    {product.sizes && (
                      <div className="mt-2 small text-muted">
                        {Array.isArray(product.sizes)
                          ? `Sizes: ${product.sizes.join(", ")}`
                          : "Multiple sizes available"}
                      </div>
                    )}
                  </Card.Body>
                </Card>

              </Col>
            )
          })
        ) : (
          <Col>
            <Alert variant="info">No products found.</Alert>
          </Col>
        )}
      </Row>
    </Container>
  )
}

export default FeaturedProducts
