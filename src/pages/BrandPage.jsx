"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Alert,
  Breadcrumb,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap"
import { getProductsByBrand } from "../firebase/brands"
import { brands } from "../components/BrandSection"
import { checkBrandSubscription, toggleBrandSubscription } from "../firebase/brandSubscriptions"
import { messaging } from "../firebase/config"
import { addProductToWishlist, getAllWishlistProducts } from "../firebase/wishlist"
import OneSignal from "react-onesignal";

const BrandPage = () => {
  const { brandName } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [brandInfo, setBrandInfo] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [wishlistStatus, setWishlistStatus] = useState({})
  // const user = JSON.parse(localStorage.getItem("user"))

  // Get user from localStorage
  const user = useMemo(() => {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  }, [])

  // Find the brand info from the brands array
  useEffect(() => {
    const currentBrand = brands.find((brand) => {
      // Extract the last part of the path to match with URL parameter
      const pathSegments = brand.path.split("/")
      const brandPathName = pathSegments[pathSegments.length - 1]
      return brandPathName === brandName
    })

    if (currentBrand) {
      setBrandInfo(currentBrand)
    } else {
      setBrandInfo({
        name: brandName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        websiteValue: brandName,
      })
    }
  }, [brandName])

  // Check if user is subscribed to this brand
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !brandInfo) return

      try {
        const result = await checkBrandSubscription(user.uid, brandInfo.name)
        if (result.success) {
          setIsSubscribed(result.isSubscribed)
        }
      } catch (err) {
        console.error("Error checking brand subscription:", err)
      }
    }

    checkSubscription()
  }, [user, brandInfo])

  // Handle subscription toggle
  const handleSubscriptionToggle = async () => {
    if (!user || !brandInfo) return

    try {
      setSubscriptionLoading(true)

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }
      const token = "df"

      const result = await toggleBrandSubscription(user.uid, brandInfo.name, isSubscribed, token)
      if (result.success) {
        setIsSubscribed(!isSubscribed)
        //   const tagKey = `brand_${brandName.replace(/\s+/g, "_").toLowerCase()}`;
        // if (!isSubscribed) {
        //   await OneSignal.sendTags({ [tagKey]: "true" });
        // } else {
        //   await OneSignal.deleteTag(tagKey);
        // }

      }
    } catch (err) {
      console.error("Error toggling subscription:", err)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  // Fetch products by brand using the website property
  useEffect(() => {
    let isMounted = true
    const fetchBrandProducts = async () => {
      if (!brandInfo) return

      try {
        setLoading(true)
        setError(null)

        // Use the websiteValue to get products
        const websiteValue = brandInfo.websiteValue || brandName
        console.log(`Attempting to fetch products for brand: ${websiteValue}`)

        // First try exact match with website field
        let result = await getProductsByBrand(websiteValue, false)

        // If no exact matches, try case-insensitive match
        if (result.success && result.data.length === 0) {
          console.log("No exact matches found, trying case-insensitive match")
          result = await getProductsByBrand(websiteValue, true)
        }

        // If still no matches, try with brand field instead of website
        if (result.success && result.data.length === 0) {
          console.log("No matches found with website field, trying brand field")
          result = await getProductsByBrand(websiteValue, true, "brand")
        }

        // Only update state if component is still mounted
        if (!isMounted) return

        // Collect debug info
        setDebugInfo({
          brandName: brandName,
          formattedBrandName: brandInfo.name,
          websiteValue: websiteValue,
          resultSuccess: result.success,
          resultError: result.error || null,
          productsFound: result.success ? result.data.length : 0,
          partialMatch: result.partialMatch || false,
          searchStrategy: result.searchStrategy || "website-exact",
        })

        if (result.success) {
          // Sort products to ensure consistent order and prevent flickering
          const sortedProducts = result.data.sort((a, b) => a.id.localeCompare(b.id))

          // Important: Set products in a single update to prevent flickering
          setProducts(sortedProducts)
          console.log(`Found ${sortedProducts.length} products for brand: ${websiteValue}`)
        } else {
          console.error("Failed to fetch products:", result.error)
          setError(`Failed to fetch products: ${result.error || "Unknown error"}`)
        }
      } catch (err) {
        if (!isMounted) return
        console.error("Error fetching brand products:", err)
        setError(`Error fetching products: ${err.message}`)
        setDebugInfo({
          brandName: brandName,
          websiteValue: brandInfo.websiteValue || brandName,
          error: err.message,
          stack: err.stack,
        })
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (brandInfo) {
      fetchBrandProducts()
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [brandInfo, brandName])

  // Function to parse price by removing currency symbols
  const parsePrice = (priceValue) => {
    if (!priceValue) return 0
    const priceStr = String(priceValue)
    const cleanPrice = priceStr.replace(/[^0-9.]/g, "")
    return Number.parseFloat(cleanPrice) || 0
  }

  // Function to calculate discount percentage
  const calculateDiscount = (originalPrice, price) => {
    const original = parsePrice(originalPrice)
    const current = parsePrice(price)

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

  // Function to try alternative product search
  const tryAlternativeSearch = async () => {
    if (!brandInfo) return

    try {
      setLoading(true)
      setError(null)

      // Try multiple search strategies in sequence
      console.log("Trying alternative search strategies")

      // Strategy 1: Try brand name with partial matching
      let result = await getProductsByBrand(brandInfo.name, true, "brand", true)

      // Strategy 2: If no results, try with the name split into parts
      if (result.success && result.data.length === 0) {
        const nameParts = brandInfo.name.split(" ")
        if (nameParts.length > 1) {
          const firstPart = nameParts[0]
          console.log(`Trying with first part of name: ${firstPart}`)
          result = await getProductsByBrand(firstPart, true, "brand", true)
        }
      }

      // Strategy 3: Try with category field if available
      if (result.success && result.data.length === 0 && brandInfo.category) {
        console.log(`Trying with category: ${brandInfo.category}`)
        result = await getProductsByBrand(brandInfo.category, true, "category", true)
      }

      if (result.success) {
        // Sort products to ensure consistent order
        const sortedProducts = result.data.sort((a, b) => a.id.localeCompare(b.id))
        setProducts(sortedProducts)
        console.log(`Found ${sortedProducts.length} products using alternative search`)

        setDebugInfo({
          ...debugInfo,
          alternativeSearch: true,
          alternativeSearchQuery: result.searchQuery || brandInfo.name,
          alternativeSearchField: result.searchField || "brand",
          productsFound: sortedProducts.length,
        })
      } else {
        setError("Failed to find products with alternative search")
      }
    } catch (err) {
      console.error("Error in alternative search:", err)
      setError(`Error in alternative search: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(8)
      .fill(0)
      .map((_, index) => (
        <Col key={`skeleton-${index}`} xs={6} md={4} lg={3} className="mb-4">
          <div className="h-100 border-0 shadow-sm product-card">
            <div className="product-image-container skeleton-loading"></div>
            <div className="p-3">
              <div className="skeleton-text-short mb-2"></div>
              <div className="skeleton-text-long mb-3"></div>
              <div className="skeleton-text-medium"></div>
            </div>
          </div>
        </Col>
      ))
  }

  // Memoize the sorted products to prevent unnecessary re-renders
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.id.localeCompare(b.id))
  }, [products])

  // Memoize the product cards to prevent unnecessary re-renders
  const productCards = useMemo(() => {
    return sortedProducts.map((product) => {
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
            {/* Transparent Link overlay to make the whole card clickable */}
            <Link
              to={`/product/${product.id}`}
              className="stretched-link"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                textDecoration: "none",
              }}
            ></Link>

            {/* Heart icon excluded from navigation */}
            <i
              className={`position-absolute ${wishlistStatus[product.id] ? "bi-heart-fill text-danger" : "bi-heart text-danger"}`}
              style={{ top: "10px", left: "10px", zIndex: 2, cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation(); // Prevents card click
                e.preventDefault();  // Prevents link navigation
                handleHeartClick(e, product);
              }}
            ></i>

            {/* Image and discount badge */}
            <div className="position-relative product-image-container">
              <Card.Img
                variant="top"
                src={product.image || "/placeholder.svg?height=300&width=250&query=product"}
                className="product-image"
                loading="lazy"
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

            {/* Card body with product info */}
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-1">
                <Card.Title className="fs-6 fw-bold text-truncate text-dark" style={{ maxWidth: "80%" }}>
                  {product.name}
                </Card.Title>
                {product.brand && (
                  <Badge bg="secondary" className="website-badge">
                    {product.brand}
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
                    {discountPercent > 0 && <span className="text-danger ms-2 small">({discountPercent}% OFF)</span>}
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
  }, [sortedProducts, wishlistStatus])

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
  }, []);


  if (!brandInfo) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    )
  }

  return (
    <Container fluid className="my-4 px-4 px-md-5 brand-page-container">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
          Brands
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{brandInfo.name}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="text-center mb-5 position-relative">
        {brandInfo.imageUrl && brandInfo.imageUrl.trim() !== "" && (
          <img
            src={brandInfo.imageUrl || "/placeholder.svg"}
            alt={`${brandInfo.name} logo`}
            className="rounded-circle mb-3"
            style={{ width: "100px", height: "100px", objectFit: "cover" }}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/circular-abstract-design.png"
            }}
          />
        )}
        <div className="d-flex align-items-center justify-content-center">
          <h2 className="fw-bold mb-0">{brandInfo.name}</h2>

          {/* Bell icon for notifications */}
          {user && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>{isSubscribed ? "Turn off notifications" : "Get notified about new products"}</Tooltip>}
            >
              <Button
                variant="link"
                className="ms-2 p-0 text-decoration-none"
                onClick={handleSubscriptionToggle}
                disabled={subscriptionLoading}
              >
                {subscriptionLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className={`bi ${isSubscribed ? "bi-bell-fill text-warning" : "bi-bell"} fs-5`}></i>
                )}
              </Button>
            </OverlayTrigger>
          )}
        </div>
        <p className="text-muted">Explore the latest collection from {brandInfo.name}</p>
      </div>

      {/* Debug toggle button */}
      <div className="text-end mb-3">
        <Button variant="outline-secondary" size="sm" onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? "Hide Debug Info" : "Show Debug Info"}
        </Button>
      </div>

      {/* Debug information */}
      {showDebug && debugInfo && (
        <Alert variant="info" className="mb-3">
          <h5>Debug Information</h5>
          <pre className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Alert>
      )}

      <div className="min-height-container">
        {loading ? (
          <>
            <p className="text-muted mb-4">Loading products...</p>
            <Row>{renderSkeletons()}</Row>
          </>
        ) : error ? (
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <div className="mt-3">
              <button className="btn btn-outline-primary me-2" onClick={tryAlternativeSearch}>
                Try Alternative Search
              </button>
              <Link to="/" className="btn btn-outline-secondary">
                Return to Home
              </Link>
            </div>
          </Alert>
        ) : products.length === 0 ? (
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            No products found for {brandInfo.name}.
            <div className="mt-3">
              <button className="btn btn-outline-primary me-2" onClick={tryAlternativeSearch}>
                Try Alternative Search
              </button>
              <Link to="/" className="btn btn-outline-secondary">
                Browse All Products
              </Link>
            </div>
          </Alert>
        ) : (
          <>
            <p className="text-muted mb-4">
              Showing {products.length} products from {brandInfo.name}
              {debugInfo?.partialMatch && " (using partial match)"}
            </p>
            <Row>{productCards}</Row>
          </>
        )}
      </div>
    </Container>
  )
}

export default BrandPage
