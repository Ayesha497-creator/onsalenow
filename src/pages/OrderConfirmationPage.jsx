"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Container, Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap"
import { getOrderById } from "../firebase/orders"

const OrderConfirmationPage = ({ user }) => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        console.log("Fetching order details for ID:", orderId)
        const result = await getOrderById(orderId)
        console.log("Order fetch result:", result)

        if (result.success && result.order) {
          setOrder(result.order)
        } else {
          setError(result.error || "Failed to load order details")
        }
      } catch (err) {
        console.error("Error fetching order:", err)
        setError("Failed to load order details: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    } else {
      setError("No order ID provided")
      setLoading(false)
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
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div
                  className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-check-lg" style={{ fontSize: "2.5rem" }}></i>
                </div>
                <h2>Order Confirmed!</h2>
                <p className="text-muted">Thank you for your purchase</p>
              </div>

              <Alert variant="success" className="mb-4">
                <p className="mb-0">
                  Your order has been placed successfully. We've sent a confirmation email to{" "}
                  <strong>{order.customerEmail}</strong>.
                </p>
              </Alert>

              <div className="mb-4">
                <h5>Order Details</h5>
                <hr />
                <Row>
                  <Col sm={6}>
                    <p className="mb-1">
                      <strong>Order Number:</strong>
                    </p>
                    <p className="text-muted">{order.id}</p>
                  </Col>
                  <Col sm={6}>
                    <p className="mb-1">
                      <strong>Order Date:</strong>
                    </p>
                    <p className="text-muted">{formatDate(order.orderDate)}</p>
                  </Col>
                </Row>
                <Row>
                  <Col sm={6}>
                    <p className="mb-1">
                      <strong>Payment Method:</strong>
                    </p>
                    <p className="text-muted">{order.paymentMethod}</p>
                  </Col>
                  <Col sm={6}>
                    <p className="mb-1">
                      <strong>Order Status:</strong>
                    </p>
                    <p>
                      <span className="badge bg-warning text-dark">{order.status.toUpperCase()}</span>
                    </p>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <h5>Shipping Address</h5>
                <hr />
                <p className="mb-1">
                  <strong>{order.customerName}</strong>
                </p>
                <p className="text-muted mb-1">{order.shippingAddress}</p>
                <p className="text-muted mb-0">Phone: {order.customerPhone}</p>
              </div>

              <div className="mb-4">
                <h5>Order Summary</h5>
                <hr />
                <div className="mb-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <img
                            src={item.image || "/placeholder.svg?height=50&width=50&query=product"}
                            alt={item.name}
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = "/stylish-streetwear-collection.png"
                            }}
                          />
                        </div>
                        <div>
                          <p className="mb-0 fw-medium">{item.name}</p>
                          <small className="text-muted">
                            {item.size && `Size: ${item.size}`}
                            {item.color && `, Color: ${item.color}`}
                            {`, Qty: ${item.quantity}`}
                          </small>
                        </div>
                      </div>
                      <p className="mb-0 fw-medium">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <p className="fw-bold">Total</p>
                  <p className="fw-bold">Rs. {order.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <Button as={Link} to="/" variant="outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Continue Shopping
                </Button>
                <Button as={Link} to={`/order/${order.id}`} variant="danger">
                  View Order Details
                  <i className="bi bi-arrow-right ms-2"></i>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default OrderConfirmationPage
