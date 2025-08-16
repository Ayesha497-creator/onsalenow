"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, Modal, Badge, InputGroup } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import AdminSidebar from "../../components/admin/AdminSidebar"
import AdminHeader from "../../components/admin/AdminHeader"
import { getProductsData, updateProduct, deleteProduct } from "../../firebase/database"

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all") // all, scrapped, manual
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const navigate = useNavigate()

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getProductsData()

      if (result.success && result.data) {
        // Convert object to array
        const productsArray = Object.keys(result.data).map((key) => ({
          id: key,
          ...result.data[key],
        }))
        setProducts(productsArray)
      } else {
        setError("Failed to fetch products")
      }
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(`Error fetching products: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle edit product
  const handleEditClick = (product) => {
    setCurrentProduct(product)
    setEditForm({
      name: product.name || "",
      brand: product.brand || "",
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      description: product.description || "",
      category: product.category || "",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes || "",
      keywords: Array.isArray(product.keywords) ? product.keywords.join(", ") : "",
    })
    setShowEditModal(true)
  }

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm({
      ...editForm,
      [name]: value,
    })
  }

  // Handle save product
  const handleSaveProduct = async () => {
    try {
      setSaving(true)
      setError(null)

      // Process sizes and keywords
      const processedSizes = editForm.sizes ? editForm.sizes.split(",").map((size) => size.trim()) : []

      const processedKeywords = editForm.keywords ? editForm.keywords.split(",").map((keyword) => keyword.trim()) : []

      const updatedProduct = {
        ...currentProduct,
        name: editForm.name,
        brand: editForm.brand,
        price: Number(editForm.price),
        originalPrice: Number(editForm.originalPrice),
        description: editForm.description,
        category: editForm.category,
        sizes: processedSizes,
        keywords: processedKeywords,
        updatedAt: new Date().toISOString(),
      }

      // Remove id from the object to be updated
      const { id, ...productData } = updatedProduct

      const result = await updateProduct(id, productData)

      if (result.success) {
        setSuccessMessage(`Product "${editForm.name}" updated successfully!`)
        setShowEditModal(false)

        // Update the product in the local state
        setProducts((prevProducts) => prevProducts.map((p) => (p.id === id ? updatedProduct : p)))
      } else {
        setError("Failed to update product")
      }
    } catch (err) {
      console.error("Error updating product:", err)
      setError(`Error updating product: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Handle delete click
  const handleDeleteClick = (id) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true)
      setError(null)

      const result = await deleteProduct(deleteId)

      if (result.success) {
        setSuccessMessage("Product deleted successfully!")
        setShowDeleteModal(false)

        // Remove the product from the local state
        setProducts((prevProducts) => prevProducts.filter((p) => p.id !== deleteId))
      } else {
        setError("Failed to delete product")
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      setError(`Error deleting product: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Filter products based on search term and filter type
  const filteredProducts = products.filter((product) => {
    // Search term filter
    const searchMatch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())

    // Type filter
    let typeMatch = true
    if (filterType === "scrapped") {
      typeMatch = !!product.website
    } else if (filterType === "manual") {
      typeMatch = !product.website
    }

    return searchMatch && typeMatch
  })

  // Format website name for display
  const formatWebsiteName = (website) => {
    if (!website) return ""
    return website
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="admin-dashboard d-flex" style={{ width: "100%", overflow: "hidden" }}>
      <AdminSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto", height: "100vh" }}>
        <AdminHeader />
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Product Management</h2>
            <Button variant="primary" onClick={() => navigate("/admin/products/add")}>
              <i className="bi bi-plus-circle me-2"></i>
              Add New Product
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

          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Row>
                <Col md={6} lg={4}>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>
                        <i className="bi bi-x"></i>
                      </Button>
                    )}
                  </InputGroup>
                </Col>
                <Col md={6} lg={3}>
                  <Form.Group className="mb-3">
                    <Form.Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                      <option value="all">All Products</option>
                      <option value="scrapped">Scrapped Products</option>
                      <option value="manual">Manually Added Products</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={5} className="text-end">
                  <span className="text-muted">
                    Showing {filteredProducts.length} of {products.length} products
                  </span>
                  <Button variant="outline-secondary" size="sm" className="ms-3" onClick={fetchProducts}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
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
              <p className="mt-3">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              No products found. {searchTerm && "Try a different search term."}
            </Alert>
          ) : (
            <Row>
              {filteredProducts.map((product) => (
                <Col key={product.id} lg={3} md={4} sm={6} className="mb-4">
                  <Card className="h-100 shadow-sm product-card">
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={product.image || "/placeholder.svg?height=200&width=200&query=product"}
                        style={{ height: "200px", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/stylish-streetwear-collection.png"
                        }}
                      />
                      {product.website && (
                        <Badge bg="info" className="position-absolute" style={{ top: "10px", right: "10px" }}>
                          Scrapped
                        </Badge>
                      )}
                    </div>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="h6 mb-0 text-truncate" style={{ maxWidth: "80%" }}>
                          {product.name}
                        </Card.Title>
                        {product.website && (
                          <Badge bg="secondary" className="website-badge">
                            {formatWebsiteName(product.website)}
                          </Badge>
                        )}
                      </div>
                      <Card.Text className="small text-muted mb-2">{product.brand || "No brand"}</Card.Text>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">Rs. {product.price}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-muted text-decoration-line-through small">
                            Rs. {product.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="small mb-2">
                        <span className="text-muted">Category: </span>
                        <span className="fw-semibold">{product.category || "Uncategorized"}</span>
                      </div>
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="small mb-2">
                          <span className="text-muted">Sizes: </span>
                          <span>{Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes}</span>
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="bg-white border-top-0">
                      <div className="d-flex justify-content-between">
                        <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(product)}>
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(product.id)}>
                          <i className="bi bi-trash me-1"></i>
                          Delete
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>

      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentProduct && (
            <Form>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name</Form.Label>
                    <Form.Control type="text" name="name" value={editForm.name} onChange={handleInputChange} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Brand</Form.Label>
                    <Form.Control type="text" name="brand" value={editForm.brand} onChange={handleInputChange} />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price (Rs. )</Form.Label>
                    <Form.Control
                      type="number"
                      name="price"
                      value={editForm.price}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Original Price (Rs. )</Form.Label>
                    <Form.Control
                      type="number"
                      name="originalPrice"
                      value={editForm.originalPrice}
                      onChange={handleInputChange}
                    />
                    <Form.Text className="text-muted">Leave empty if there's no discount</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select name="category" value={editForm.category} onChange={handleInputChange}>
                      <option value="">Select Category</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                      <option value="footwear">Footwear</option>
                      <option value="accessories">Accessories</option>
                      <option value="beauty">Beauty</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sizes (comma separated)</Form.Label>
                    <Form.Control
                      type="text"
                      name="sizes"
                      value={editForm.sizes}
                      onChange={handleInputChange}
                      placeholder="S, M, L, XL"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Keywords (comma separated)</Form.Label>
                <Form.Control
                  type="text"
                  name="keywords"
                  value={editForm.keywords}
                  onChange={handleInputChange}
                  placeholder="shirt, cotton, casual"
                />
                <Form.Text className="text-muted">Keywords help with search and categorization</Form.Text>
              </Form.Group>

              <div className="mb-3">
                <Form.Label>Product Image</Form.Label>
                <div className="d-flex align-items-center">
                  <img
                    src={currentProduct.image || "/placeholder.svg?height=100&width=100&query=product"}
                    alt={currentProduct.name}
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    className="me-3"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/stylish-streetwear-collection.png"
                    }}
                  />
                  <div>
                    <p className="mb-1">Image cannot be changed in this view.</p>
                    <small className="text-muted">To update the image, please use the full product editor.</small>
                  </div>
                </div>
              </div>

              {currentProduct.website && (
                <Alert variant="info" className="mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  This product was scrapped from {formatWebsiteName(currentProduct.website)}
                </Alert>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveProduct} disabled={saving}>
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          {deleteId && (
            <div className="d-flex align-items-center">
              <img
                src={
                  products.find((p) => p.id === deleteId)?.image || "/placeholder.svg?height=50&width=50&query=product"
                }
                alt="Product"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                className="me-3"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = "/stylish-streetwear-collection.png"
                }}
              />
              <div>
                <p className="mb-0 fw-bold">{products.find((p) => p.id === deleteId)?.name}</p>
                <small className="text-muted">ID: {deleteId}</small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete Product"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AdminProducts
