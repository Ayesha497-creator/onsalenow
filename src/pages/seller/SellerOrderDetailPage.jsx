"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Form } from "react-bootstrap"
import SellerSidebar from "../../components/seller/SellerSidebar"
import { getOrderById, updateOrderStatus } from "../../firebase/orders"

const SellerOrderDetailPage = ({ user }) => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    // Redirect if not logged in or not a seller
    if (!user) {
      navigate("/")
      return
    }

    fetchOrder()
  }, [user, navigate, orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!orderId) {
        setError("Order ID is missing")
        setLoading(false)
        return
      }

      const result = await getOrderById(orderId)
      if (result.success) {
        setOrder(result.data)
      } else {
        setError(result.error || "Failed to fetch order details")
      }
    } catch (err) {
      console.error("Error fetching order:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true)

      const result = await updateOrderStatus(orderId, newStatus)

      if (result.success) {
        setOrder((prevOrder) => ({ ...prevOrder, status: newStatus }))
      } else {
        alert("Failed to update order status: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      console.error("Error updating order status:", err)
      alert("An unexpected error occurred while updating the order status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "processing":
        return <Badge bg="warning">Processing</Badge>
      case "shipped":
        return <Badge bg="info">Shipped</Badge>
      case "delivered":
        return <Badge bg="success">Delivered</Badge>
      case "cancelled":
        return <Badge bg="danger">Cancelled</Badge>
      default:
        return <Badge bg="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="d-flex">
        <SellerSidebar />
        <div className="flex-grow-1 p-4">
          <Container fluid className="text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </Container>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex">
        <SellerSidebar />
        <div className="flex-grow-1 p-4">
          <Container fluid className="my-5">
            <Alert variant="danger">{error}</Alert>
          </Container>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="d-flex">
        <SellerSidebar />
        <div className="flex-grow-1 p-4">
          <Container fluid className="my-5">
            <Alert variant="warning">Order not found</Alert>
          </Container>
        </div>
      </div>
    )
  }

  return (
    <div className="d-flex">
      <SellerSidebar />
      <div className="flex-grow-1 p-4">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Order Details</h2>
            <Button onClick={() => navigate("/seller/orders")} variant="outline-secondary" size="sm">
              <i className="bi bi-arrow-left me-1"></i> Back to Orders
            </Button>
          </div>

          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Order #{order.id}</h5>
                  <p className="text-muted mb-0 small">Placed on {new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <div className="d-flex align-items-center">
                  {getStatusBadge(order.status)}
                  <Form.Select
                    size="sm"
                    className="ms-3"
                    style={{ width: "150px" }}
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6} className="mb-3 mb-md-0">
                  <h6>Customer Information</h6>
                  <p className="mb-1">
                    <strong>Name:</strong> {order.customerName}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {order.customerEmail}
                  </p>
                  <p className="mb-0">
                    <strong>Phone:</strong> {order.customerPhone}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Shipping Information</h6>
                  <p className="mb-0">
                    <strong>Address:</strong> {order.shippingAddress}
                  </p>
                </Col>
              </Row>

              <h6>Order Items</h6>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items
                      .filter((item) => item.sellerId === user.uid)
                      .map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={item.image || "/placeholder.svg?height=40&width=40&query=product"}
                                alt={item.name}
                                style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                className="me-2"
                              />
                              <div>
                                <p className="mb-0">{item.name}</p>
                                <small className="text-muted">
                                  {item.size && `Size: ${item.size}`}
                                  {item.color && `, Color: ${item.color}`}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>Rs. {item.price.toLocaleString()}</td>
                          <td>{item.quantity}</td>
                          <td className="text-end">Rs. {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Subtotal</strong>
                      </td>
                      <td className="text-end">
                        <strong>
                          Rs. 
                          {order.items
                            .filter((item) => item.sellerId === user.uid)
                            .reduce((sum, item) => sum + item.price * item.quantity, 0)
                            .toLocaleString()}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-4">
                <h6>Order Notes</h6>
                <p className="text-muted">{order.notes || "No notes for this order."}</p>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  )
}

export default SellerOrderDetailPage
