"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert, Spinner } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import SellerSidebar from "../../components/seller/SellerSidebar"
import {
  getSellerOrders,
  updateOrderStatus,
  createTestOrderForSeller,
  checkOrdersExist,
  fixOrderSellerIds,
} from "../../firebase/orders"
import { updateSellerProduct } from "../../firebase/sellerAuth"
import { getDatabase, ref, update, get } from "firebase/database";

// Jab order ka status delivered ho:
async function markOrderAsDelivered(orderId, productId, quantity) {
  const db = getDatabase();
  // 1. Update order status
  await update(ref(db, `orders/${orderId}`), { status: "delivered" });

  // 2. Update product's sold value
  const productRef = ref(db, `products/${productId}`);
  const productSnap = await get(productRef);
  const currentSold = productSnap.val()?.sold || 0;
  await update(productRef, { sold: currentSold + quantity });
}

const SellerOrdersPage = ({ user }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [creatingTestOrder, setCreatingTestOrder] = useState(false)
  const [checkingOrders, setCheckingOrders] = useState(false)
  const [fixingOrders, setFixingOrders] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect if not logged in or not a seller
    if (!user) {
      navigate("/")
      return
    }

    fetchOrders()
  }, [user, navigate])

  useEffect(() => {
    // Apply filters whenever orders, statusFilter, or searchQuery changes
    filterOrders()
  }, [orders, statusFilter, searchQuery])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching orders for seller:", user.uid)

      const result = await getSellerOrders(user.uid)
      console.log("Seller orders result:", result)

      if (result.success) {
        setOrders(result.data || [])
      } else {
        setError("Failed to load orders: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      console.error("Error fetching seller orders:", err)
      setError("An unexpected error occurred: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.customerEmail?.toLowerCase().includes(query),
      )
    }

    setFilteredOrders(filtered)
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId)

      const result = await updateOrderStatus(orderId, newStatus)

      if (result.success) {
        // Update the order in the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
        );

        // Yahan check karein agar status delivered hai, toh sold value update karein
        if (newStatus === "delivered") {
          // Order object dhoondhein
          const order = orders.find((o) => o.id === orderId);
          if (order && Array.isArray(order.items)) {
            for (const item of order.items) {
              // Har product ke liye sold value update karein
              await markOrderAsDelivered(orderId, item.productId, item.quantity || 1);
            }
          }
        }
      } else {
        alert("Failed to update order status: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      console.error("Error updating order status:", err)
      alert("An unexpected error occurred while updating the order status")
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const createTestOrder = async () => {
    try {
      setCreatingTestOrder(true)
      setError(null)

      // Create a test order for this seller
      const result = await createTestOrderForSeller(user.uid, user.uid)

      if (result.success) {
        alert("Test order created successfully! Order ID: " + result.orderId)
        // Refresh orders to show the new test order
        fetchOrders()
      } else {
        setError("Failed to create test order: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      console.error("Error creating test order:", err)
      setError("An unexpected error occurred: " + err.message)
    } finally {
      setCreatingTestOrder(false)
    }
  }

  const checkForOrders = async () => {
    try {
      setCheckingOrders(true)
      setError(null)

      const ordersExist = await checkOrdersExist()

      if (ordersExist) {
        alert("Orders found in the database! Check console for details.")
      } else {
        alert("No orders found in the database.")
      }
    } catch (err) {
      console.error("Error checking orders:", err)
      setError("An unexpected error occurred: " + err.message)
    } finally {
      setCheckingOrders(false)
    }
  }

  const fixExistingOrders = async () => {
    try {
      setFixingOrders(true)
      setError(null)

      if (!user || !user.uid) {
        setError("User ID not available")
        return
      }

      const result = await fixOrderSellerIds(user.uid)

      if (result.success) {
        alert(result.message)
        // Refresh orders to show the fixed orders
        fetchOrders()
      } else {
        setError("Failed to fix orders: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      console.error("Error fixing orders:", err)
      setError("An unexpected error occurred: " + err.message)
    } finally {
      setFixingOrders(false)
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

  // Helper function to safely format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A"
    try {
      return new Date(timestamp).toLocaleDateString()
    } catch (err) {
      console.error("Error formatting date:", err)
      return "Invalid Date"
    }
  }

  // Helper function to safely get total amount
  const getOrderAmount = (order) => {
    if (!order) return 0
    if (typeof order.totalAmount === "number") return order.totalAmount

    // If totalAmount is not available, try to calculate from items
    if (Array.isArray(order.items)) {
      return order.items.reduce((total, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 1
        return total + price * quantity
      }, 0)
    }

    return 0
  }

  return (
    <div className="d-flex">
      <SellerSidebar />
      <div className="flex-grow-1 p-4">
        <Container fluid>
          <h2 className="mb-4">Manage Orders</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Debug section to show raw orders data */}
          {false && <Card className="shadow-sm mb-4 border-warning">
            <Card.Header className="bg-warning text-white">
              <h5 className="mb-0">Debug Information</h5>
            </Card.Header>
            <Card.Body>
              <p>
                Current seller ID: <code>{user?.uid}</code>
              </p>
              <p>
                Total orders in state: <code>{orders.length}</code>
              </p>
              <div>
                <h6>Raw Orders Data:</h6>
                <div style={{ maxHeight: "200px", overflow: "auto" }}>
                  <pre style={{ fontSize: "0.8rem" }}>{JSON.stringify(orders, null, 2)}</pre>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    console.log("Current orders state:", orders)
                    console.log("Current user:", user)
                  }}
                  className="me-2"
                >
                  Log Debug Info to Console
                </Button>
                <Button variant="danger" size="sm" onClick={fixExistingOrders} disabled={fixingOrders}>
                  {fixingOrders ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Fixing...
                    </>
                  ) : (
                    <>Fix Existing Orders</>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>}

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={3}>
                  <Form.Group>
                    <Form.Control
                      type="text"
                      placeholder="Search by order ID or customer"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="text-md-end mt-3 mt-md-0">
                  <Button variant="outline-info" onClick={checkForOrders} disabled={checkingOrders} className="me-2">
                    {checkingOrders ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-1" />
                        Checking...
                      </>
                    ) : (
                      <>Check Database</>
                    )}
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={createTestOrder}
                    disabled={creatingTestOrder}
                    className="me-2"
                  >
                    {creatingTestOrder ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-1" />
                        Creating...
                      </>
                    ) : (
                      <>Create Test Order</>
                    )}
                  </Button>
                  <Button variant="outline-secondary" onClick={fetchOrders} disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-1" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                      </>
                    )}
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
          ) : filteredOrders.length === 0 ? (
            <Card className="shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <h5 className="mt-3">No Orders Found</h5>
                <p className="text-muted">
                  {orders.length === 0 ? (
                    <>
                      You don't have any orders yet. Try creating a test order or wait for customers to place orders.
                      <br />
                      <small>
                        If you've created orders but they're not showing up, use the "Fix Existing Orders" button in the
                        debug section to update seller IDs.
                      </small>
                    </>
                  ) : (
                    "No orders match your current filters."
                  )}
                </p>
                {orders.length > 0 && statusFilter !== "all" && (
                  <Button variant="link" onClick={() => setStatusFilter("all")}>
                    Clear Filters
                  </Button>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <Card.Body>
                {/* Debug info to see what's being rendered */}


                {/* Force table to take full width */}
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <Table bordered hover style={{ minWidth: "800px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "20%" }}>Order ID</th>
                        <th style={{ width: "15%" }}>Date</th>
                        <th style={{ width: "20%" }}>Customer</th>
                        <th style={{ width: "10%" }}>Amount</th>
                        <th style={{ width: "15%" }}>Status</th>
                        <th style={{ width: "20%" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{formatDate(order.orderDate || order.createdAt)}</td>
                          <td>
                            <div>{order.customerName || "N/A"}</div>
                            <small className="text-muted">{order.customerEmail || "No email"}</small>
                          </td>
                          <td>Rs. {getOrderAmount(order).toLocaleString()}</td>
                          <td>{getStatusBadge(order.status || "pending")}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Form.Select
                                size="sm"
                                style={{ width: "130px" }}
                                value={order.status || "pending"}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                disabled={updatingOrderId === order.id}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </Form.Select>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/seller/orders/${order.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Add a simple non-Bootstrap table as fallback */}
                {filteredOrders.length > 0 && (
                  null
                )}
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>
    </div>
  )
}

export default SellerOrdersPage
