"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Badge, Spinner, Alert } from "react-bootstrap"
import { Link } from "react-router-dom"
import { getHighestDiscountedProducts } from "../firebase/products"
import { addProductToWishlist, getAllWishlistProducts } from "../firebase/wishlist"

const DealsSection = () => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlistStatus, setWishlistStatus] = useState({})
  const user = JSON.parse(localStorage.getItem("user"))

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        const result = await getHighestDiscountedProducts(4) // Fetch top 4 discounted products
        if (result.success) {
          setDeals(result.data)
        } else {
          setError("Failed to fetch deals")
        }
      } catch (err) {
        setError("Error fetching deals: " + err.message)
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
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

  // Function to get discount percentage safely
  const getDiscountPercent = (product) => {
    if (product.discountPercent && !isNaN(Number(product.discountPercent))) {
      return Number(product.discountPercent)
    }
    if (product.calculatedDiscountPercent && !isNaN(Number(product.calculatedDiscountPercent))) {
      return Number(product.calculatedDiscountPercent)
    }
    return calculateDiscount(product.originalPrice, product.price)
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
  }, [deals]);  // Re-run when products or user changes
  console.log("kk", deals)
  if (loading) {
    return (
      <Container fluid className="my-5 px-4 px-md-5 text-center">
        <h2 className="text-center mb-4 fw-bold">DEALS OF THE DAY</h2>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid className="my-5 px-4 px-md-5">
        <h2 className="text-center mb-4 fw-bold">DEALS OF THE DAY</h2>
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  // Update the component title to emphasize these are sale products
  return (
    <Container fluid className="my-5 px-4 px-md-5">
      <h2 className="text-center mb-4 fw-bold">TOP DISCOUNTS OF THE DAY</h2>
      <Row>
        {deals.length > 0 ? (
          deals.map((deal) => {
            const discountPercent = getDiscountPercent(deal)

            return (
              <Col key={deal.id} md={6} lg={3} className="mb-4">
                <Card className="h-100 border-0 shadow-sm deal-card position-relative" style={{ cursor: "pointer" }}>
                  {/* Heart icon - outside the Link */}
                  <i
                    className={`position-absolute ${wishlistStatus[deal.id] ? "bi-heart-fill text-danger" : "bi-heart text-danger"}`}
                    style={{ top: "10px", left: "10px", cursor: "pointer", zIndex: 2 }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation
                      handleHeartClick(e, deal);
                    }}
                  ></i>

                  {/* Full clickable area */}
                  <Link
                    to={`/product/${deal.id}`}
                    className="text-decoration-none text-dark d-block h-100"
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}
                  ></Link>

                  {/* Visible content (behind the overlaying Link) */}
                  <div className="position-relative" style={{ backgroundColor: "#fff0e6", padding: "15px", zIndex: 0 }}>
                    <Card.Img
                      variant="top"
                      src={deal.image || "/placeholder.svg?height=250&width=400&query=fashion sale item"}
                      style={{ height: "200px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/stylish-streetwear-collection.png";
                      }}
                    />
                    {discountPercent > 0 && (
                      <Badge
                        bg="danger"
                        className="position-absolute"
                        style={{ top: "25px", right: "25px", fontSize: "1rem", padding: "0.5rem" }}
                      >
                        {discountPercent}% OFF
                      </Badge>
                    )}
                  </div>

                  <Card.Body className="text-center" style={{ zIndex: 0 }}>
                    <Card.Title className="fw-bold text-truncate text-dark">{deal.name}</Card.Title>
                    <div className="d-flex justify-content-center align-items-center mb-2">
                      <span className="fw-bold fs-5">Rs. {displayPrice(deal.price)}</span>
                      <span className="text-muted text-decoration-line-through ms-2">
                        Rs. {displayPrice(deal.originalPrice)}
                      </span>
                    </div>
                    {deal.website && (
                      <Badge bg="secondary" className="website-badge">
                        {formatWebsiteName(deal.website)}
                      </Badge>
                    )}
                  </Card.Body>
                </Card>

              </Col>
            )
          })
        ) : (
          <Col>
            <Alert variant="info">No deals available at the moment.</Alert>
          </Col>
        )}
      </Row>
    </Container>
  )
}

export default DealsSection
