"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Container, Row, Col, Card, Badge, Spinner, Alert, Breadcrumb, Button } from "react-bootstrap"
import { getProductsByCategory } from "../firebase/products"
import { addProductToWishlist, getAllWishlistProducts } from "../firebase/wishlist"

const CategoryPage = () => {
  const { categoryName } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlistStatus, setWishlistStatus] = useState({})
  const user = JSON.parse(localStorage.getItem("user"))
  const [scraping, setScraping] = useState(false)
  const [scrapingStatus, setScrapingStatus] = useState({
    success: false,
    jjStatus: null,
    outfittersStatus: null,
  })

  // Update the fetchProducts function to add more debugging
  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log(`Fetching products for category: ${categoryName}`)
      const result = await getProductsByCategory(categoryName)

      if (result.success) {
        console.log(`Successfully fetched ${result.data.length} products for ${categoryName}`)
        // Log the first few products to see what we're getting
        if (result.data.length > 0) {
          console.log(
            "Sample products:",
            result.data.slice(0, 3).map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              brand: p.brand,
              website: p.website,
            })),
          )
        }
        setProducts(result.data)
      } else {
        console.error("Failed to fetch products:", result.error)
        setError("Failed to fetch products")
      }
    } catch (err) {
      console.error("Error in fetchProducts:", err)
      setError("Error fetching products: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add debugging to see what products are being received
  useEffect(() => {
    fetchProducts()
  }, [categoryName])

  // Function to handle scraping products from partner websites with improved error handling
  const handleScrapeProducts = async () => {
    try {
      setScraping(true)
      setScrapingStatus({
        success: false,
        jjStatus: null,
        outfittersStatus: null,
      })
      setError(null)

      // Track if any scraping was successful
      let anyScrapeSuccessful = false

      // Call the first endpoint to scrape from Junaid Jamshed
      console.log(`Scraping Junaid Jamshed for category: ${categoryName}`)
      try {
        const jjResponse = await fetch(
          `http://localhost:8000/api/scrap-junaid-jamshed?q=${encodeURIComponent(categoryName)}`,
          { signal: AbortSignal.timeout(30000) }, // 30 second timeout
        )

        if (jjResponse.ok) {
          const jjData = await jjResponse.json()
          console.log("Junaid Jamshed scraping result:", jjData)
          setScrapingStatus((prev) => ({
            ...prev,
            jjStatus: "success",
          }))
          anyScrapeSuccessful = true
        } else {
          console.warn(`Junaid Jamshed scraping failed with status: ${jjResponse.status}`)
          setScrapingStatus((prev) => ({
            ...prev,
            jjStatus: "failed",
          }))
        }
      } catch (jjError) {
        console.error("Error scraping from Junaid Jamshed:", jjError)
        setScrapingStatus((prev) => ({
          ...prev,
          jjStatus: "error",
        }))
      }

      // Call the second endpoint to scrape from Outfitters
      // Continue even if the first one failed
      console.log(`Scraping Outfitters for category: ${categoryName}`)
      try {
        const outfittersResponse = await fetch(
          `http://localhost:8000/api/scrap-outfitters?q=${encodeURIComponent(categoryName)}`,
          { signal: AbortSignal.timeout(30000) }, // 30 second timeout
        )

        if (outfittersResponse.ok) {
          const outfittersData = await outfittersResponse.json()
          console.log("Outfitters scraping result:", outfittersData)
          setScrapingStatus((prev) => ({
            ...prev,
            outfittersStatus: "success",
          }))
          anyScrapeSuccessful = true
        } else {
          console.warn(`Outfitters scraping failed with status: ${outfittersResponse.status}`)
          setScrapingStatus((prev) => ({
            ...prev,
            outfittersStatus: "failed",
          }))
        }
      } catch (outfittersError) {
        console.error("Error scraping from Outfitters:", outfittersError)
        setScrapingStatus((prev) => ({
          ...prev,
          outfittersStatus: "error",
        }))
      }

      // Set overall success state based on if any scraping was successful
      setScrapingStatus((prev) => ({
        ...prev,
        success: anyScrapeSuccessful,
      }))

      // Always fetch products after scraping attempts, regardless of success/failure
      await fetchProducts()
    } catch (err) {
      console.error("Unexpected error during scraping process:", err)
      setError(`Unexpected error during scraping: ${err.message}`)
    } finally {
      setScraping(false)
    }
  }

  // Function to format website name for display
  const formatWebsiteName = (website) => {
    if (!website) return ""

    // Convert hyphenated names to capitalized words
    return website
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Function to parse price by removing currency symbols
  const parsePrice = (priceValue) => {
    if (!priceValue) return 0

    // Convert to string if it's not already
    const priceStr = String(priceValue)

    // Remove currency symbols and any non-numeric characters except decimal point
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

  // Format category name for display
  const formatCategoryName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  // Function to render scraping status message
  const renderScrapingStatusMessage = () => {
    const { success, jjStatus, outfittersStatus } = scrapingStatus

    if (!jjStatus && !outfittersStatus) return null

    if (success) {
      return (
        <Alert variant="success" className="mb-4">
          <h5>Successfully found new products!</h5>
          <p className="mb-0">
            {jjStatus === "success" &&
              outfittersStatus === "success" &&
              "Products were found from both Junaid Jamshed and Outfitters."}
            {jjStatus === "success" && outfittersStatus !== "success" && "Products were found from Junaid Jamshed."}
            {jjStatus !== "success" && outfittersStatus === "success" && "Products were found from Outfitters."}
          </p>
        </Alert>
      )
    } else {
      return (
        <Alert variant="warning" className="mb-4">
          <h5>Partial or no results found</h5>
          <p className="mb-0">
            {jjStatus !== "success" &&
              outfittersStatus !== "success" &&
              "We couldn't find products from our partner websites at this time."}
            {jjStatus === "error" && "There was an error connecting to Junaid Jamshed."}
            {jjStatus === "failed" && "Junaid Jamshed didn't return any products for this category."}
            {outfittersStatus === "error" && "There was an error connecting to Outfitters."}
            {outfittersStatus === "failed" && "Outfitters didn't return any products for this category."}
          </p>
        </Alert>
      )
    }
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
  }, [products]);

  if (loading) {
    return (
      <Container fluid className="my-5 px-4 px-md-5 text-center">
        <h2 className="text-center mb-4 fw-bold">{formatCategoryName(categoryName)} Products</h2>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (scraping) {
    return (
      <Container fluid className="my-5 px-4 px-md-5 text-center">
        <h2 className="text-center mb-4 fw-bold">Scraping {formatCategoryName(categoryName)} Products</h2>
        <div className="mb-4">
          <Spinner animation="border" role="status" className="me-2">
            <span className="visually-hidden">Scraping...</span>
          </Spinner>
          <p className="mt-3">We're finding the best deals from our partner websites. This may take a minute...</p>
          <div className="mt-4 text-start mx-auto" style={{ maxWidth: "400px" }}>
            <div className="d-flex align-items-center mb-2">
              <div style={{ width: "20px", height: "20px" }} className="me-2">
                {scrapingStatus.jjStatus === "success" ? (
                  <i className="bi bi-check-circle-fill text-success"></i>
                ) : scrapingStatus.jjStatus === "failed" || scrapingStatus.jjStatus === "error" ? (
                  <i className="bi bi-x-circle-fill text-danger"></i>
                ) : (
                  <Spinner animation="border" size="sm" />
                )}
              </div>
              <span>Junaid Jamshed</span>
            </div>
            <div className="d-flex align-items-center">
              <div style={{ width: "20px", height: "20px" }} className="me-2">
                {scrapingStatus.outfittersStatus === "success" ? (
                  <i className="bi bi-check-circle-fill text-success"></i>
                ) : scrapingStatus.outfittersStatus === "failed" || scrapingStatus.outfittersStatus === "error" ? (
                  <i className="bi bi-x-circle-fill text-danger"></i>
                ) : (
                  <Spinner animation="border" size="sm" />
                )}
              </div>
              <span>Outfitters</span>
            </div>
          </div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid className="my-5 px-4 px-md-5">
        <h2 className="text-center mb-4 fw-bold">{formatCategoryName(categoryName)} Products</h2>
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={fetchProducts}>
            Try Again
          </Button>
        </div>
      </Container>
    )
  }

  // Update the title to reflect that we're showing sale products
  return (
    <Container fluid className="my-4 px-4 px-md-5">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{formatCategoryName(categoryName)}</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 fw-bold">{formatCategoryName(categoryName)} Sale Products</h2>

      {/* Show scraping status message if applicable */}
      {renderScrapingStatusMessage()}

      {products.length === 0 ? (
        <div className="text-center py-5">
          <Alert variant="info" className="mb-4">
            <h4>No sale products found in this category</h4>
            <p className="mb-0">
              Do you want to look into our partners "Outfitters and Junaid Jamshed" websites and scrap the amazing deals
              for you?
            </p>
          </Alert>
          <Button variant="danger" size="lg" onClick={handleScrapeProducts} disabled={scraping}>
            {scraping ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Scraping...
              </>
            ) : (
              "Yes, grab them for me"
            )}
          </Button>
        </div>
      ) : (
        <>
          <p className="text-muted mb-4">Showing {products.length} sale products</p>
          <Row>
            {products.map((product) => {
              // Get discount percent with safety checks
              let discountPercent = 0
              if (product.discountPercent && !isNaN(Number(product.discountPercent))) {
                discountPercent = Number(product.discountPercent)
              } else {
                discountPercent = calculateDiscount(product.originalPrice, product.price)
              }

              return (
                <Col key={product.id} xs={6} md={4} lg={3} className="mb-4">

                  <Card className="h-100 border-0 shadow-sm product-card position-relative">
                    {/* Heart icon OUTSIDE the Link */}
                    <i
                      className={`position-absolute ${wishlistStatus[product.id] ? "bi-heart-fill text-danger" : "bi-heart text-danger"}`}
                      style={{ top: "10px", left: "10px", cursor: "pointer", zIndex: 2 }}
                      onClick={(e) => {
                        e.stopPropagation(); // ✅ Prevent card click
                        handleHeartClick(e, product);
                      }}
                    ></i>

                    {/* Whole Card wrapped in Link */}
                    <Link
                      to={`/product/${product.id}`}
                      className="text-decoration-none text-dark d-block h-100"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}
                    ></Link>

                    <div style={{ position: "relative", zIndex: 0 }}>
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

                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <Card.Title className="fs-6 fw-bold text-truncate text-dark" style={{ maxWidth: "80%" }}>
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
            })}
          </Row>
        </>
      )}
    </Container>
  )
}

export default CategoryPage
