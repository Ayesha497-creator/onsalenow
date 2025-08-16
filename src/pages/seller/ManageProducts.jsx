"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, Table, Modal, Spinner, Alert, Badge } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import SellerSidebar from "../../components/seller/SellerSidebar"
import AddProductDrawer from "../../components/seller/AddProductDrawer"
import { getSellerProfile, getSellerProducts, deleteSellerProduct } from "../../firebase/sellerAuth"

const ManageProducts = ({ user }) => {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [sellerProfile, setSellerProfile] = useState(null)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const navigate = useNavigate()
  const [topProducts, setTopProducts] = useState([]);
  const [sellerSoldPercentage, setSellerSoldPercentage] = useState(0);

  useEffect(() => {
    // Redirect if not logged in or not a seller
    if (!user || !user.isSeller) {
      navigate("/")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null) // Clear any previous errors

        // Fetch seller profile
        const profileResult = await getSellerProfile(user.uid)
        console.log("Profile result:", profileResult)

        if (profileResult.success) {
          setSellerProfile(profileResult.data)
        } else {
          setError("Failed to load seller profile: " + (profileResult.error || "Unknown error"))
          return
        }

        // Fetch products
        const result = await getSellerProducts(user.uid)
        console.log("Products result:", result)

        if (result.success) {
          setProducts(result.data || [])

          // Calculate seller's total sold percentage
          const totalStock = (result.data || []).reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
          const totalSold = (result.data || []).reduce((sum, product) => sum + (Number(product.sold) || 0), 0);
          const percentage = totalStock > 0 ? (totalSold / totalStock) * 100 : 0;
          setSellerSoldPercentage(percentage);
        } else {
          setError("Failed to load products: " + (result.error || "Unknown error"))
        }
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("An unexpected error occurred: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  useEffect(() => {
    if (user?.uid) {
      fetch(`http://localhost:8000/seller/top-products/${user.uid}`)
        .then(res => res.json())
        .then(data => setTopProducts(data || []))
        .catch(() => setTopProducts([]));
    }
  }, [user?.uid]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const handleEditClick = (product) => {
    console.log("Editing product:", product) // Add this debug log
    setEditingProduct(product)
    setShowAddDrawer(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteSellerProduct(productToDelete.id)
      if (result.success) {
        setProducts(products.filter((p) => p.id !== productToDelete.id))
        setSuccessMessage(`Product "${productToDelete.name}" deleted successfully`)
      } else {
        setError("Failed to delete product")
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      setError("An unexpected error occurred")
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleProductAdded = (productId, productData) => {
    // Add the new product to the list
    setProducts([
      {
        id: productId,
        ...productData,
      },
      ...products,
    ])
    setSuccessMessage(`Product "${productData.name}" added successfully`)
  }

  const handleProductUpdated = (productId, updatedProductData) => {
    console.log("Updating product in list:", productId, updatedProductData) // Add this debug log
    // Update the product in the list
    setProducts(products.map((product) => (product.id === productId ? { ...product, ...updatedProductData } : product)))
    setSuccessMessage(`Product "${updatedProductData.name}" updated successfully`)
    setEditingProduct(null)
  }

  const handleDrawerClose = () => {
    setShowAddDrawer(false)
    setEditingProduct(null)
  }

  // Filter products based on search term and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory =
      categoryFilter === "" || (product.category && product.category.toLowerCase() === categoryFilter.toLowerCase())

    return matchesSearch && matchesCategory
  })

  if (!user || !user.isSeller) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="d-flex">
      <SellerSidebar />
      <div className="flex-grow-1 p-4">
        <Container fluid>
          {/* Pending Account Notice */}
          {sellerProfile?.status === "pending" && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Your seller account is pending approval</Alert.Heading>
              <p>
                Your account is currently under review by our team. You cannot add or manage products until your account is approved.
              </p>
              <hr />
              <p className="mb-0">
                This usually takes 1-2 business days. If you have any questions, please contact our support team.
              </p>
            </Alert>
          )}

          {/* High Sales Threshold Notice */}
          {sellerSoldPercentage >= 70 && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>⚠️ Sales Threshold Reached</Alert.Heading>
              <p>
                Your account has reached {sellerSoldPercentage.toFixed(1)}% sold. Product management is temporarily disabled until payment is processed.
              </p>
              <hr />
              <p className="mb-0">
                Please contact our support team to process your payment and restore product management access.
              </p>
            </Alert>
          )}

          {topProducts.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3 fw-bold">Your Top Selling Products</h5>
                <Row>
                  {topProducts.map(product => (
                    <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Img variant="top" src={product.image || "/placeholder.svg"} style={{ height: "180px", objectFit: "cover" }} />
                        <Card.Body>
                          <Card.Title className="fs-6 fw-bold text-truncate">{product.name}</Card.Title>
                          <div className="fw-bold">Sold: {product.salesCount}</div>
                          <div className="small text-secondary">{product.brand} | {product.category}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Manage Products</h2>
            <Button
              variant="primary"
              onClick={() => {
                setEditingProduct(null) // Ensure we're not in edit mode
                setShowAddDrawer(true)
              }}
              disabled={sellerProfile?.status === "pending" || sellerSoldPercentage >= 70}
            >
              <i className="bi bi-plus-circle me-2"></i>
              {sellerProfile?.status === "pending"
                ? "Account Pending Approval"
                : sellerSoldPercentage >= 70
                  ? "Product Management Disabled"
                  : "Add New Product"}
            </Button>
          </div>

          {successMessage && (
            <Alert variant="success" className="mb-4">
              <i className="bi bi-check-circle me-2"></i>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <Button variant="outline-danger" size="sm" className="ms-3" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </Alert>
          )}

          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      <option value="">All Categories</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="footwear">Footwear</option>
                      <option value="accessories">Accessories</option>
                      <option value="beauty">Beauty</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setSearchTerm("")
                      setCategoryFilter("")
                    }}
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="text-center p-5">
              <Card.Body>
                <i className="bi bi-box fs-1 text-muted"></i>
                <h4 className="mt-3">No Products Found</h4>
                <p className="text-muted">
                  {products.length === 0
                    ? "You haven't added any products yet."
                    : "No products match your search criteria."}
                </p>
                {products.length === 0 && (
                  <Button variant="primary" className="mt-3" onClick={() => setShowAddDrawer(true)}>
                    Add Your First Product
                  </Button>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Original Price</th>
                        <th>Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <img
                              src={product.image || "/placeholder.svg?height=50&width=50&query=product"}
                              alt={product.name}
                              style={{ width: "50px", height: "50px", objectFit: "cover" }}
                              className="rounded"
                            />
                          </td>
                          <td>
                            <div>{product.name}</div>
                            {product.brand && <small className="text-muted">{product.brand}</small>}
                          </td>
                          <td>Rs. {product.price}</td>
                          <td>
                            {product.originalPrice ? (
                              <>
                                Rs. {product.originalPrice}{" "}
                                <Badge bg="danger">
                                  {product.discountPercent ||
                                    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}
                                  % OFF
                                </Badge>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            <Badge bg="info">{product.category}</Badge>
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditClick(product)}
                              disabled={sellerSoldPercentage >= 70}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                              disabled={sellerSoldPercentage >= 70}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>

      {/* Only render the drawer if sellerProfile is loaded */}
      {sellerProfile && (
        <AddProductDrawer
          show={showAddDrawer}
          onHide={handleDrawerClose}
          seller={sellerProfile}
          onProductAdded={handleProductAdded}
          onProductUpdated={handleProductUpdated}
          editProduct={editingProduct}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this product?</p>
          {productToDelete && (
            <div className="d-flex align-items-center">
              <img
                src={productToDelete.image || "/placeholder.svg?height=50&width=50&query=product"}
                alt={productToDelete.name}
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                className="me-3 rounded"
              />
              <div>
                <h6 className="mb-0">{productToDelete.name}</h6>
                <small className="text-muted">Rs. {productToDelete.price}</small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ManageProducts
