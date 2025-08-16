"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Button, Image, Form, Alert, ListGroup, Badge } from "react-bootstrap"
import { useCart } from "../context/CartContext"

const CartPage = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart()
  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const navigate = useNavigate()

  // Function to format website name for display
  const formatWebsiteName = (website) => {
    if (!website) return ""

    // Convert hyphenated names to capitalized words
    return website
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Handle quantity change
  const handleQuantityChange = (itemId, size, color, newQuantity) => {
    if (newQuantity < 1) return
    updateQuantity(itemId, size, color, newQuantity)
  }

  // Handle remove item
  const handleRemoveItem = (itemId, size, color) => {
    if (window.confirm("Are you sure you want to remove this item from your bag?")) {
      removeFromCart(itemId, size, color)
    }
  }

  // Handle apply coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault()
    if (couponCode.toUpperCase() === "ONSALENOW20") {
      const discountAmount = cartTotal * 0.2 // 20% discount
      setDiscount(discountAmount)
      setCouponApplied(true)
    } else {
      alert("Invalid coupon code")
    }
  }

  // Handle proceed to checkout
  const handleCheckout = () => {
    // Navigate to the checkout page
    navigate("/checkout")
  }

  return (
    <Container fluid className="my-4 px-4 px-md-5">
      <h2 className="mb-4">Shopping Bag</h2>

      {cartItems.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-bag-x" style={{ fontSize: "4rem" }}></i>
          <h3 className="mt-3">Your bag is empty</h3>
          <p className="text-muted">Looks like you haven't added anything to your bag yet.</p>
          <Button as={Link} to="/" variant="danger" className="mt-3">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <Row>
          {/* Cart Items */}
          <Col lg={8} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Items ({cartItems.length})</h5>
                  <Button variant="link" className="text-danger p-0" onClick={clearCart}>
                    Clear All
                  </Button>
                </div>
              </Card.Header>
              <ListGroup variant="flush">
                {cartItems.map((item, index) => (
                  <ListGroup.Item key={`${item.id}-${item.size}-${item.color}-${index}`} className="py-3">
                    <Row>
                      <Col xs={3} md={2}>
                        <Link to={`/product/${item.id}`}>
                          <Image
                            src={item.image || "/placeholder.svg?height=120&width=100&query=product"}
                            alt={item.name}
                            fluid
                            className="cart-item-image"
                            style={{ maxHeight: "120px", objectFit: "contain" }}
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = "/stylish-streetwear-collection.png"
                            }}
                          />
                        </Link>
                      </Col>
                      <Col xs={9} md={10}>
                        <div className="d-flex justify-content-between">
                          <div>
                            {item.brand && <p className="text-muted mb-1">{item.brand}</p>}
                            <h5 className="mb-1">
                              <Link to={`/product/${item.id}`} className="text-decoration-none text-dark">
                                {item.name}
                              </Link>
                            </h5>
                            {item.website && (
                              <Badge bg="secondary" className="mb-2">
                                {formatWebsiteName(item.website)}
                              </Badge>
                            )}
                            <div className="d-flex flex-wrap mt-2">
                              {item.size && (
                                <span className="me-3">
                                  <strong>Size:</strong> {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="me-3 d-flex align-items-center">
                                  <strong>Color:</strong>
                                  <span
                                    className="color-dot ms-1"
                                    style={{
                                      backgroundColor: item.color,
                                      width: "15px",
                                      height: "15px",
                                      borderRadius: "50%",
                                      display: "inline-block",
                                      marginLeft: "5px",
                                    }}
                                  ></span>
                                </span>
                              )}
                              <span>
                                <strong>Qty:</strong>
                                <Button
                                  variant="link"
                                  className="p-0 px-2"
                                  onClick={() =>
                                    handleQuantityChange(item.id, item.size, item.color, item.quantity - 1)
                                  }
                                >
                                  <i className="bi bi-dash-circle"></i>
                                </Button>
                                {item.quantity}
                                <Button
                                  variant="link"
                                  className="p-0 px-2"
                                  onClick={() =>
                                    handleQuantityChange(item.id, item.size, item.color, item.quantity + 1)
                                  }
                                >
                                  <i className="bi bi-plus-circle"></i>
                                </Button>
                              </span>
                            </div>
                          </div>
                          <div className="text-end">
                            <h5 className="mb-1">Rs. {(item.price * item.quantity).toLocaleString()}</h5>
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() => handleRemoveItem(item.id, item.size, item.color)}
                            >
                              <i className="bi bi-trash"></i> Remove
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>

          {/* Order Summary */}
          <Col lg={4}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>Rs. {cartTotal.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                {couponApplied && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Discount (20%)</span>
                    <span>-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total</strong>
                  <strong>Rs. {(cartTotal - discount).toLocaleString()}</strong>
                </div>

                {/* Coupon Code */}
                <Form onSubmit={handleApplyCoupon} className="mb-3">
                  <Form.Group className="mb-2">
                    <Form.Label>Apply Coupon</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied}
                      />
                      <Button
                        type="submit"
                        variant="outline-dark"
                        className="ms-2"
                        disabled={couponApplied || !couponCode}
                      >
                        Apply
                      </Button>
                    </div>
                  </Form.Group>
                  {couponApplied && (
                    <Alert variant="success" className="py-2 mb-0">
                      <small>
                        <i className="bi bi-check-circle me-1"></i>
                        Coupon ONSALENOW20 applied successfully!
                      </small>
                    </Alert>
                  )}
                </Form>

                <Button variant="danger" className="w-100 py-2" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>

                <div className="text-center mt-3">
                  <Link to="/" className="text-decoration-none">
                    <i className="bi bi-arrow-left me-1"></i>
                    Continue Shopping
                  </Link>
                </div>
              </Card.Body>
            </Card>

            {/* Accepted Payment Methods */}
            <Card className="mt-3 shadow-sm">
              <Card.Body>
                <h6 className="mb-3">We Accept</h6>
                <div className="d-flex flex-wrap gap-2">
                  {/* <img src="/contactless-payment.png" alt="Visa" height="30" />
                  <img src="/global-payments-network.png" alt="Mastercard" height="30" />
                  <img src="/iconic-amex-card.png" alt="Amex" height="30" />
                  <img src="/digital-wallet-transfer.png" alt="PayPal" height="30" />
                  <img src="/digital-payments-interface.png" alt="UPI" height="30" /> */}
                  <img src="../../public/COD.png" alt="COD" height="30" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default CartPage
