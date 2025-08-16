"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Container, Row, Col, Card, Badge, Spinner, Alert, Breadcrumb, Form, Button } from "react-bootstrap"
import { searchProducts } from "../firebase/products"
import { Link, useNavigate } from "react-router-dom"
import SearchModal from "../components/SearchModal"

const SearchPage = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams()
  const priceRange = searchParams.get("price");
  const sizes = searchParams.get("sizes")?.split(",") || [];
  const categories = searchParams.get("categories")?.split(",") || [];
  const query = searchParams.get("q") || ""

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState(query)
  const navigate = useNavigate()

  useEffect(() => {
    const filters = {
      priceRange,
      selectedSizes: sizes,
      selectedCategories: categories,
    };
    fetchSearchResults(query, filters);
  }, [query, priceRange, searchParams]);


  const fetchSearchResults = async (searchTerm, appliedFilters = {}) => {
    try {
      setLoading(true);
      const result = await searchProducts(searchTerm, appliedFilters);
      if (result.success) setProducts(result.data);
      else setError("Failed to search products");
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (e) => {
    e.preventDefault()
    return
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() })
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

  if (loading) {
    return (
      <Container fluid className="my-5 px-4 px-md-5 text-center">
        <h2 className="text-center mb-4 fw-bold">Searching for "{query}"</h2>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid className="my-5 px-4 px-md-5">
        <h2 className="text-center mb-4 fw-bold">Search Results</h2>
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={() => fetchSearchResults(query)}>
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
        <Breadcrumb.Item active>Search</Breadcrumb.Item>
      </Breadcrumb>

      {/* <Form onSubmit={handleSearch} className="mb-4">
        <Row>
          <Col md={8} lg={6} className="mx-auto">
            <div className="d-flex">
              <Form.Control
                type="search"
                placeholder="Search for sale products, brands and more"
                value={searchQuery}
                // onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => setShowSearchModal(true)}
                className="me-2"
              />
              <Button variant="danger" type="submit">
                Search
              </Button>
            </div>
          </Col>
        </Row>
      </Form> */}

      <h2 className="mb-4 fw-bold">{query ? `Sale Products for "${query}"` : "Search Sale Products"}</h2>

      {(query || priceRange || sizes?.length > 0 || categories?.length > 0) && products.length === 0 ? (
        <Alert variant="info">No sale products found matching your search.</Alert>
      ) : (query || priceRange || sizes?.length > 0 || categories?.length > 0) ? (
        <>
          <p className="text-muted mb-4">Found {products.length} sale products</p>
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
                  <Card className="h-100 border-0 shadow-sm product-card">
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={product.image || "/placeholder.svg?height=300&width=250&query=product"}
                        style={{ height: "280px", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/stylish-streetwear-collection.png"
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
                      {product.keywords && product.keywords.length > 0 && (
                        <div className="mt-2">
                          {product.keywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                              {keyword}
                            </Badge>
                          ))}
                          {product.keywords.length > 3 && (
                            <Badge bg="light" text="dark">
                              +{product.keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </>
      ) : (
        <Alert variant="info">Enter a search term to find sale products.</Alert>
      )}

      <SearchModal
        show={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onApply={(appliedFilters) => {
          const { query, priceRange, selectedSizes, selectedCategories } = appliedFilters;

          const params = new URLSearchParams();
          if (query?.trim()) params.set("q", query.trim());
          if (priceRange) params.set("price", priceRange);
          if (selectedSizes?.length) params.set("sizes", selectedSizes.join(","));
          if (selectedCategories?.length) params.set("categories", selectedCategories.join(","));

          navigate(`/search?${params.toString()}`);
        }}
      />
    </Container>
  )
}

export default SearchPage
