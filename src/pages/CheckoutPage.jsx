"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Row, Col, Form, Button, Card, ListGroup, Alert, Spinner, Modal } from "react-bootstrap"
import { useCart } from "../context/CartContext"
import { createOrder } from "../firebase/orders"
import { getProductById } from "../firebase/products"
import { updateSellerProduct } from "../firebase/sellerAuth"
import RatingModal from "../components/RatingModal.jsx"

const CheckoutPage = ({ user }) => {
  const navigate = useNavigate()
  const { cartItems, cartTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showRating, setShowRating] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    cardNumber: "4242424242424242",
    cardName: "a",
    cardExpiry: "06/2026",
    cardCvv: "23",
  })

  // Validation states
  const [validated, setValidated] = useState(false)
  const [cardError, setCardError] = useState("")

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (cartItems.length === 0) {
      navigate("/cart")
    }

    // Check if user is logged in
    if (!user) {
      setShowLoginModal(true)
    }
  }, [cartItems, navigate, user])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Format card number with spaces
    // if (name === "cardNumber") {
    //   const formattedValue = value
    //     .replace(/\s/g, "") // Remove existing spaces
    //     .replace(/\D/g, "") // Remove non-digits
    //     .slice(0, 16) // Limit to 16 digits
    //     .replace(/(\d{4})(?=\d)/g, "$1 ") // Add space after every 4 digits

    //   setFormData({ ...formData, [name]: formattedValue })
    //   return
    // }

    // Format expiry date
    // if (name === "cardExpiry") {
    //   const formattedValue = value
    //     .replace(/\s/g, "")
    //     .replace(/\D/g, "")
    //     .slice(0, 4)
    //     .replace(/(\d{2})(?=\d)/g, "$1/")

    //   setFormData({ ...formData, [name]: formattedValue })
    //   return
    // }

    // Format CVV
    // if (name === "cardCvv") {
    //   const formattedValue = value.replace(/\D/g, "").slice(0, 3)
    //   setFormData({ ...formData, [name]: formattedValue })
    //   return
    // }

    setFormData({ ...formData, [name]: value })
  }

  const validateCardNumber = (number) => {
    const cardNumber = number.replace(/\s/g, "")
    // Test card is 4242 4242 4242 4242
    if (cardNumber === "4242424242424242") {
      return true
    }
    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget

    setValidated(true)
    setCardError("")

    if (form.checkValidity() === false) {
      e.stopPropagation()
      return
    }

    // Validate card number
    // if (!validateCardNumber(formData.cardNumber)) {
    //   setCardError("Invalid card number. Use 4242 4242 4242 4242 for testing.")
    //   return
    // }

    try {
      setLoading(true)
      setPaymentProcessing(true)
      setError(null) // Clear any previous errors

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setPaymentProcessing(false)
      setPaymentSuccess(true)

      // Collect all unique seller IDs from the cart items
      const sellerIds = [...new Set(cartItems.map((item) => item.sellerId).filter(Boolean))]
      console.log("Seller IDs in order:", sellerIds)

      // Prepare order data
      const orderData = {
        userId: user.uid,
        items: cartItems.map((item) => ({
          ...item,
          productId: item.id,
          // Ensure sellerId is included for each item
          sellerId: item.sellerId || user.uid, // Use user.uid as fallback if sellerId is missing
        })),
        totalAmount: cartTotal,
        status: "pending",
        paymentMethod: "COD",
        shippingAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        billingAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        orderDate: Date.now(),
        sellerIds: sellerIds, // Add array of seller IDs for easier querying
      }

      console.log("Creating order with data:", orderData)

      // Create order in database
      const result = await createOrder(orderData)
      console.log("Order creation result:", result)

      if (result.success) {
        (async () => {
          cartItems.forEach(async (item) => {
            try {
              const product = await getProductById(item.id)
              console.log("boss", product)
              let soldQuantity = product?.data?.sold + item?.quantity
              const res = await updateSellerProduct(item.id, { sold: soldQuantity })
              console.log("Updated Sold Quantity:- ", res)
            } catch (error) {
              console.log(error)
            }
          })
        })()

        setShowRating(true)

        // Explicitly navigate to the order confirmation page
        // console.log("Redirecting to order confirmation page:", `/order-confirmation/${result.orderId}`)
        // navigate(`/order-confirmation/${result.orderId}`)
      } else {
        setError("Failed to create order: " + (result.error || "Unknown error"))
        setPaymentSuccess(false)
      }
    } catch (err) {
      console.error("Checkout error:", err)
      setError("An unexpected error occurred during checkout: " + err.message)
      setPaymentSuccess(false)
    } finally {
      setLoading(false)
    }
  }
  console.log("b", cartItems)
  const handleLoginRedirect = () => {
    // Save current cart to localStorage or context
    // Then redirect to login page with return URL
    navigate("/login?redirect=checkout")
  }

  if (!user) {
    return (
      <Modal show={showLoginModal} onHide={() => navigate("/cart")} centered>
        <Modal.Header closeButton>
          <Modal.Title>Login Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You need to be logged in to proceed with checkout.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => navigate("/cart")}>
            Return to Cart
          </Button>
          <Button variant="primary" onClick={handleLoginRedirect}>
            Login
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4">Checkout</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Row>
          {/* Shipping Information */}
          <Col lg={8}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Shipping Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">Please provide your full name.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">Please provide a valid email.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  <Form.Control.Feedback type="invalid">Please provide your phone number.</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please provide your address.</Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">Please provide your city.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">Please provide your state.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pincode</Form.Label>
                      <Form.Control
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        required
                      />
                      <Form.Control.Feedback type="invalid">Please provide your pincode.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <div>Payment Method: Cash on delivery (COD)</div>
                </Row>
              </Card.Body>
            </Card>

            {/* Payment Information */}
            {/* <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Payment Information</h5>
              </Card.Header>
              <Card.Body>
                {cardError && <Alert variant="danger">{cardError}</Alert>}

                <div className="mb-3 d-flex align-items-center">
                  <span className="me-3">Accepted Cards:</span>
                  <div className="d-flex gap-2">
                    <img src="/contactless-payment.png" alt="Visa" height="30" />
                    <img src="/global-payments-network.png" alt="Mastercard" height="30" />
                    <img src="/iconic-amex-card.png" alt="Amex" height="30" />
                  </div>
                  <div className="ms-auto">
                    <small className="text-muted">For testing, use card number: 4242 4242 4242 4242</small>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Card Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="XXXX XXXX XXXX XXXX"
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please provide a valid card number.</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Name on Card</Form.Label>
                  <Form.Control
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please provide the name on your card.</Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Expiry Date</Form.Label>
                      <Form.Control
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        required
                      />
                      <Form.Control.Feedback type="invalid">Please provide the expiry date.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>CVV</Form.Label>
                      <Form.Control
                        type="text"
                        name="cardCvv"
                        value={formData.cardCvv}
                        onChange={handleInputChange}
                        placeholder="XXX"
                        required
                      />
                      <Form.Control.Feedback type="invalid">Please provide the CVV.</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card> */}
          </Col>

          {/* Order Summary */}
          <Col lg={4}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <ListGroup variant="flush">
                {cartItems.map((item, index) => (
                  <ListGroup.Item key={`${item.id}-${item.size}-${item.color}-${index}`} className="py-3">
                    <div className="d-flex">
                      <img
                        src={item.image || "/placeholder.svg?height=60&width=60&query=product"}
                        alt={item.name}
                        className="me-3"
                        style={{ width: "60px", height: "60px", objectFit: "cover" }}
                      />
                      <div>
                        <h6 className="mb-0">{item.name}</h6>
                        <small className="text-muted">
                          {item.size && `Size: ${item.size}`}
                          {item.color && `, Color: ${item.color}`}
                          {`, Qty: ${item.quantity}`}
                        </small>
                        <p className="mb-0 fw-bold">Rs. {item.price * item.quantity}</p>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>Rs. {cartTotal.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total</strong>
                  <strong>Rs. {cartTotal.toLocaleString()}</strong>
                </div>

                <Button variant="danger" type="submit" className="w-100 py-2" disabled={loading}>
                  {loading ? (
                    <>
                      {paymentProcessing ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Processing Order...
                        </>
                      ) : paymentSuccess ? (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Order Placed!
                        </>
                      ) : (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Processing...
                        </>
                      )}
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
      <RatingModal
        show={showRating}
        onClose={() => { setShowRating(false), clearCart() }}
        onSubmit={(rating) => console.log("User rated:", rating)}
      // product={"df"}
      />
    </Container>
  )
}

export default CheckoutPage
