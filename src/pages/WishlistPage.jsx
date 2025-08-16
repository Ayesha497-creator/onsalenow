// "use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from "react-bootstrap"
import { Link } from "react-router-dom"
import { getAllWishlistProducts, removeProductFromWishlist } from "../firebase/wishlist"

const WishlistPage = ({ user }) => {
  const [wishlist, setWishlist] = useState([])  // Wishlist data
  const [loading, setLoading] = useState(true)  // Loading state
  const [error, setError] = useState(null)  // Error state
  const [removingId, setRemovingId] = useState(null)  // ID of the product being removed
  console.log("bos", user)
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setError("You must be logged in to view your wishlist")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Use user.uid or user._id depending on what's available
        const userId = user.uid || user._id || user.id

        if (!userId) {
          console.error("No user ID found in user object:", user)
          setError("Unable to retrieve your user information. Please try logging in again.")
          setLoading(false)
          return
        }

        const result = await getAllWishlistProducts(userId)
        console.log("kk", result)

        if (result.success) {
          // Assuming result.data returns an array of product objects with product details
          setWishlist(result.data)
          setError(null) // Clear any previous errors
        } else {
          setError(result.error || "Failed to load wishlist products")
        }
      } catch (err) {
        console.error("Error fetching wishlist:", err)
        setError("An error occurred while loading your wishlist")
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [user])

  const handleRemoveFromWishlist = async (productId) => {
    if (!user) return

    try {
      setRemovingId(productId)
      const userId = user.uid || user._id || user.id
      const result = await removeProductFromWishlist(userId, productId)

      if (result.success) {
        // Update the local state to remove the product
        setWishlist((prevWishlist) =>
          prevWishlist.filter((product) => product.productId !== productId)
        )
      } else {
        setError(`Failed to remove product from wishlist`)
      }
    } catch (err) {
      console.error("Error removing product from wishlist:", err)
      setError(`An error occurred while removing the product from your wishlist`)
    } finally {
      setRemovingId(null)
    }
  }

  // If we're still in the initial loading state, show a loading spinner
  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your wishlist...</p>
        </div>
      </Container>
    )
  }

  // If there's no user after loading is complete, show the login message
  if (!user) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          You must be logged in to view your wishlist.
          <div className="mt-3">
            <Link to="/" className="btn btn-outline-primary">
              Go to Home
            </Link>
          </div>
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4">Your Wishlist</h2>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading wishlist...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading your wishlist...</p>
        </div>
      ) : wishlist.length === 0 ? (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          Your wishlist is empty.
          <div className="mt-3">
            <Link to="/" className="btn btn-outline-primary">
              Start Shopping
            </Link>
          </div>
        </Alert>
      ) : (
        <>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <Row className="fw-bold">
                <Col xs={6}>Product</Col>
                <Col xs={3} className="text-center">
                  Date Added
                </Col>
                <Col xs={3} className="text-center">
                  Action
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {wishlist.map((product) => (
                <Row key={product.productId} className="border-bottom py-3 px-3 m-0 align-items-center">
                  <Col xs={6}>
                    <Link
                      to={`/product/${product.productId}`}
                      className="text-decoration-none"
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <i className="bi bi-heart"></i>
                        </div>
                        <div>
                          <div className="fw-bold">{product.productName}</div>
                          <div className="text-muted small">
                            Added on {new Date(product.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Col>
                  <Col xs={3} className="text-center">
                    <div className="text-muted small">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </div>
                  </Col>
                  <Col xs={3} className="text-center">
                    {removingId === product.productId ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Button
                        variant="outline-danger"
                        onClick={() => handleRemoveFromWishlist(product.productId)}
                      >
                        Remove
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
            </Card.Body>
          </Card>

          <div className="mt-4 text-end">
            <Button variant="outline-secondary" as={Link} to="/">
              Back to Shopping
            </Button>
          </div>
        </>
      )}
    </Container>
  )
}

export default WishlistPage
