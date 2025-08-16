"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from "react-bootstrap"
import { getUserOrders } from "../../firebase/orders"

const OrdersPage = ({ userId }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchOrders()
    }
  }, [userId])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const result = await getUserOrders(userId)
      if (result.success) {
        setOrders(result.data || [])
      } else {
        setError("Failed to fetch orders")
      }
    } catch (err) {
      setError("An error occurred while fetching orders")
      console.error(err)
    } finally {
      setLoading(false)
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
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4">My Orders</h2>

      {orders.length === 0 ? (
        <Alert variant="info">
          You haven't placed any orders yet. <a href="#shop">Continue shopping</a>
        </Alert>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="mb-4 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-light">
              <div>
                <span className="fw-bold">Order #{order.id}</span>
                <span className="text-muted ms-3">Placed on {new Date(order.orderDate).toLocaleDateString()}</span>
              </div>
              {getStatusBadge(order.status)}
            </Card.Header>
            <Card.Body>
              <Row>
                {order.items.map((item) => (
                  <Col key={item.id} md={6} lg={3} className="mb-3">
                    <div className="d-flex">
                      <img
                        src={item.imageUrl || "/placeholder.svg?height=80&width=60&query=product"}
                        alt={item.name}
                        style={{ width: "60px", height: "80px", objectFit: "cover" }}
                        className="me-3"
                      />
                      <div>
                        <h6 className="mb-1">{item.name}</h6>
                        <p className="mb-1 text-muted small">
                          Size: {item.size}, Qty: {item.quantity}
                        </p>
                        <p className="mb-0 fw-bold">Rs. {item.price}</p>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="mb-0">
                    <strong>Total: Rs. {order.totalAmount}</strong> ({order.items.length} items)
                  </p>
                  <p className="mb-0 text-muted small">Delivered to: {order.shippingAddress}</p>
                </div>
                <div>
                  <Button variant="outline-secondary" size="sm" className="me-2">
                    Track Order
                  </Button>
                  <Button variant="outline-danger" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  )
}

export default OrdersPage
