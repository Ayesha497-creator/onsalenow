"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap"
import { registerAdmin } from "../../firebase/adminAuth"

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (!formData.inviteCode) {
      setError("Invite code is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const result = await registerAdmin(formData.email, formData.password, formData.name, formData.inviteCode)

      if (result.success) {
        setSuccess(true)
        // Clear form
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          inviteCode: "",
        })
        // Redirect to login after a delay
        setTimeout(() => {
          navigate("/admin")
        }, 3000)
      } else {
        setError(result.error || "Registration failed. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container
      fluid
      className="admin-login-container vh-100 d-flex align-items-center justify-content-center"
      style={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}
    >
      <Row className="justify-content-center w-100">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow-lg border-0 rounded-lg">
            <Card.Header className="bg-primary text-white text-center py-4">
              <h2 className="fw-light mb-0">
                <i className="bi bi-person-plus me-2"></i>
                Create Admin Account
              </h2>
            </Card.Header>
            <Card.Body className="p-5">
              {error && <Alert variant="danger">{error}</Alert>}
              {success && (
                <Alert variant="success">
                  <i className="bi bi-check-circle me-2"></i>
                  Admin account created successfully! Redirecting to login...
                </Alert>
              )}

              <div className="text-center mb-4">
                <h4>New Administrator</h4>
                <p className="text-muted">Please fill in the details to create a new admin account</p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-person"></i>
                    </span>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-key"></i>
                    </span>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Form.Text className="text-muted">Password must be at least 6 characters long</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-key-fill"></i>
                    </span>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Invite Code</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-shield-lock"></i>
                    </span>
                    <Form.Control
                      type="text"
                      name="inviteCode"
                      placeholder="Enter admin invite code"
                      value={formData.inviteCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Form.Text className="text-muted">
                    You need an invite code from an existing admin to register
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" className="py-2" disabled={loading || success}>
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="py-3 bg-light text-center">
              <div className="d-flex justify-content-between align-items-center">
                <small>
                  <Link to="/admin" className="text-decoration-none">
                    <i className="bi bi-arrow-left me-1"></i> Back to Login
                  </Link>
                </small>
                <small className="text-muted">On Sale Now Admin Panel &copy; {new Date().getFullYear()}</small>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminSignup
