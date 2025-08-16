"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from "react-bootstrap"
import { getOrderById } from "../firebase/orders"

const OrderDetailPage = ({ user }) => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const result = await getOrderById(orderId)

        if (result.success) {
          setOrder(result.order)
        } else {
          setError(result.error)
        }
      } catch (err) {
        console.error("Error fetching order:", err)
        setError("Failed to load order details")
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading your order details...</p>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
        <Button as={Link} to="/" variant="primary">
          Return to Home
        </Button>
      </Container>
    )
  }

  if (!order) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>Order Not Found</Alert.Heading>
          <p>We couldn't find the order you're looking for.</p>
        </Alert>
        <Button as={Link} to="/" variant="primary">
          Return to Home
        </Button>
      </Container>
    )
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning"
      case "processing":
      case "in progress":
        return "info"
      case "shipped":
        return "primary"
      case "delivered":
        return "success"
      case "cancelled":
        return "danger"
      default:
        return "secondary"
    }
  }

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Details</h2>
        <Button as={Link} to="/orders" variant="outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Orders
        </Button>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Items</h5>
                <Badge bg={getStatusBadgeVariant(order.status)} className="px-3 py-2">
                  {order.status.toUpperCase()}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              {order.items.map((item, index) => (
                <div key={index} className="d-flex mb-3 pb-3 border-bottom">
                  <div className="me-3">
                    <img
                      src={item.image || "/placeholder.svg?height=80&width=80&query=product"}
                      alt={item.name}
                      style={{ width: "80px", height: "80px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/stylish-streetwear-collection.png"
                      }}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{item.name}</h6>
                    <p className="text-muted mb-1">
                      {item.size && `Size: ${item.size}`}
                      {item.color && `, Color: ${item.color}`}
                    </p>
                    <div className="d-flex justify-content-between">
                      <p className="mb-0">Qty: {item.quantity}</p>
                      <p className="mb-0 fw-bold">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Shipping Information</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-1">
                <strong>{order.customerName}</strong>
              </p>
              <p className="mb-1">{order.shippingAddress}</p>
              <p className="mb-0">Phone: {order.customerPhone}</p>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Payment Information</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-1">
                <strong>Payment Method:</strong> {order.paymentMethod}
              </p>
              <p className="mb-0">
                <strong>Billing Address:</strong> {order.billingAddress}
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-1">
                <strong>Order Number:</strong> {order.id}
              </p>
              <p className="mb-3">
                <strong>Order Date:</strong> {formatDate(order.orderDate)}
              </p>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>Rs. {order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total</strong>
                <strong>Rs. {order.totalAmount.toLocaleString()}</strong>
              </div>

              <div className="mt-4">
                <h6>Order Timeline</h6>
                <div className="position-relative pt-2">
                  <div className="timeline-track"></div>

                  <div className="timeline-item">
                    <div className="timeline-indicator bg-success"></div>
                    <p className="mb-0 small fw-medium">Order Placed</p>
                    <p className="text-muted small mb-0">{formatDate(order.createdAt)}</p>
                  </div>

                  {order.status !== "pending" && (
                    <div className="timeline-item">
                      <div className="timeline-indicator bg-info"></div>
                      <p className="mb-0 small fw-medium">Processing</p>
                      <p className="text-muted small mb-0">
                        {order.updatedAt ? formatDate(order.updatedAt) : "In progress"}
                      </p>
                    </div>
                  )}

                  {(order.status === "shipped" || order.status === "delivered") && (
                    <div className="timeline-item">
                      <div className="timeline-indicator bg-primary"></div>
                      <p className="mb-0 small fw-medium">Shipped</p>
                      <p className="text-muted small mb-0">
                        {order.shippedAt ? formatDate(order.shippedAt) : "In transit"}
                      </p>
                    </div>
                  )}

                  {order.status === "delivered" && (
                    <div className="timeline-item">
                      <div className="timeline-indicator bg-success"></div>
                      <p className="mb-0 small fw-medium">Delivered</p>
                      <p className="text-muted small mb-0">
                        {order.deliveredAt ? formatDate(order.deliveredAt) : "Completed"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <style jsx>{`
                .timeline-track {
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  left: 7px;
                  width: 2px;
                  background-color: #e9ecef;
                }
                .timeline-item {
                  position: relative;
                  padding-left: 30px;
                  margin-bottom: 20px;
                }
                .timeline-indicator {
                  position: absolute;
                  left: 0;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                }
              `}</style>
            </Card.Body>
          </Card>

          <div className="mt-4">
            <Button as={Link} to="/" variant="outline-secondary" className="w-100 mb-2">
              Continue Shopping
            </Button>
            <Button as={Link} to="/orders" variant="danger" className="w-100">
              View All Orders
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default OrderDetailPage
