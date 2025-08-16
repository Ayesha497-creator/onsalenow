"use client"

import { useState } from "react"
import { Modal, Form, Button, Alert } from "react-bootstrap"
import { loginSeller } from "../../firebase/sellerAuth"

const SellerLoginModal = ({ show, onHide, onLoginSuccess, onSignupClick }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await loginSeller(email, password)
      if (result.success) {
        onLoginSuccess(result.seller)
      } else {
        setError(result.error || "Login failed. Please check your credentials.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Seller Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button variant="danger" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login as Seller"}
            </Button>
          </div>
        </Form>
        <div className="text-center mt-3">
          <p>
            Don't have a seller account?{" "}
            <Button variant="link" className="p-0" onClick={onSignupClick}>
              Register as Seller
            </Button>
          </p>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default SellerLoginModal
