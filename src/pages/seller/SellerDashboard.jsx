"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import SellerSidebar from "../../components/seller/SellerSidebar"
import { getSellerProfile, getSellerProducts } from "../../firebase/sellerAuth"
import AddProductDrawer from "../../components/seller/AddProductDrawer";

const SellerDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sellerProfile, setSellerProfile] = useState(null)
  const [products, setProducts] = useState([])
  const navigate = useNavigate()
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  useEffect(() => {
    // Redirect if not logged in or not a seller
    if (!user) {
      navigate("/")
      return
    }

    const fetchSellerData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching seller data for user:", user.uid)

        // Fetch seller profile
        const profileResult = await getSellerProfile(user.uid)
        console.log("Profile result:", profileResult)

        if (profileResult.success) {
          setSellerProfile(profileResult.data)
        } else {
          setError("Failed to load seller profile: " + (profileResult.error || "Unknown error"))
        }

        // Fetch seller products
        const productsResult = await getSellerProducts(user.uid)
        console.log("Products result:", productsResult)

        if (productsResult.success) {
          setProducts(productsResult.data || [])
        } else {
          setError("Failed to load products: " + (productsResult.error || "Unknown error"))
        }
      } catch (err) {
        console.error("Error fetching seller data:", err)
        setError("An unexpected error occurred: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSellerData()
  }, [user, navigate])

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="d-flex">
      <SellerSidebar />
      <div className="flex-grow-1 p-4">
        <Container fluid>
          <h2 className="mb-4">Seller Dashboard</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Pending Account Notice */}
          {sellerProfile?.status === "pending" && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Your seller account is pending approval</Alert.Heading>
              <p>
                Your account is currently under review by our team. You can view your dashboard, but some features may
                be limited until your account is approved.
              </p>
              <hr />
              <p className="mb-0">
                This usually takes 1-2 business days. If you have any questions, please contact our support team.
              </p>
            </Alert>
          )}

          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Brand Information</Card.Title>
                      <hr />
                      <p>
                        <strong>Brand Name:</strong> {sellerProfile?.brandName || "Not set"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={`badge ${
                            sellerProfile?.status === "approved"
                              ? "bg-success"
                              : sellerProfile?.status === "pending"
                                ? "bg-warning"
                                : "bg-danger"
                          }`}
                        >
                          {sellerProfile?.status || "Pending"}
                        </span>
                      </p>
                      <p>
                        <strong>Joined:</strong>{" "}
                        {sellerProfile?.createdAt ? new Date(sellerProfile.createdAt).toLocaleDateString() : "Unknown"}
                      </p>
                      <Button variant="outline-primary" size="sm" disabled={sellerProfile?.status === "pending"} onClick={() => navigate("/seller/settings")}>Edit Brand Information</Button>
                      {sellerProfile?.status === "pending" && (
                        <small className="d-block text-muted mt-2">Editing will be available after approval</small>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 bg-primary text-white">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title>Products</Card.Title>
                      <hr className="border-white" />
                      <div className="text-center my-3">
                        <h1 className="display-4">{products.length}</h1>
                        <p>Total Products</p>
                      </div>
                      <Button
                        variant="light"
                        className="mt-auto"
                        onClick={() => navigate("/seller/products")}
                        disabled={sellerProfile?.status === "pending"}
                      >
                        Manage Products
                      </Button>
                      {sellerProfile?.status === "pending" && (
                        <small className="d-block text-center text-white-50 mt-2">Available after approval</small>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 bg-success text-white">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title>Orders</Card.Title>
                      <hr className="border-white" />
                      <div className="text-center my-3">
                        <h1 className="display-4">0</h1>
                        <p>Pending Orders</p>
                      </div>
                      <Button variant="light" className="mt-auto" onClick={() => navigate("/seller/orders")}
                        disabled={sellerProfile?.status === "pending"}>
                        View Orders
                      </Button>
                      {sellerProfile?.status === "pending" && (
                        <small className="d-block text-center text-white-50 mt-2">Available after approval</small>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Card>
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Recent Products</h5>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowAddDrawer(true)}
                          disabled={sellerProfile?.status === "pending"}
                        >
                          Add New Product
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {products.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="bi bi-box fs-1 text-muted"></i>
                          <h5 className="mt-3">No Products Yet</h5>
                          <p className="text-muted">
                            {sellerProfile?.status === "pending"
                              ? "You can add products after your account is approved"
                              : "Start adding products to your store"}
                          </p>
                          <Button
                            variant="primary"
                            onClick={() => navigate("/seller/products")}
                            disabled={sellerProfile?.status === "pending"}
                          >
                            {sellerProfile?.status === "pending"
                              ? "Available After Approval"
                              : "Add Your First Product"}
                          </Button>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.slice(0, 5).map((product) => (
                                <tr key={product.id}>
                                  <td>
                                    <img
                                      src={product.image || "/placeholder.svg?height=40&width=40&query=product"}
                                      alt={product.name}
                                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                      className="rounded"
                                    />
                                  </td>
                                  <td>{product.name}</td>
                                  <td>Rs. {product.price}</td>
                                  <td>{product.category || "Uncategorized"}</td>
                                  <td>
                                    <span className="badge bg-success">Active</span>
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => navigate(`/seller/manage-products?edit=${product.id}`)}
                                      disabled={sellerProfile?.status === "pending"}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => navigate(`/seller/manage-products?delete=${product.id}`)}
                                      disabled={sellerProfile?.status === "pending"}
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>
      {showAddDrawer && (
        <AddProductDrawer
          show={showAddDrawer}
          onHide={() => setShowAddDrawer(false)}
          seller={sellerProfile}
          onProductAdded={() => setShowAddDrawer(false)}
        />
      )}
    </div>
  )
}

export default SellerDashboard
