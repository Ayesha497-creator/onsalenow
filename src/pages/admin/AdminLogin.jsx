"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap"
import { loginAdmin, seedAdminUser } from "../../firebase/adminAuth"

const AdminLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [seedingAdmin, setSeedingAdmin] = useState(false)
  const navigate = useNavigate()

  // Seed admin user if it doesn't exist
  useEffect(() => {
    const checkAndSeedAdmin = async () => {
      try {
        setSeedingAdmin(true)
        console.log("Starting admin seeding process...")
        await seedAdminUser()
        console.log("Admin seeding completed successfully")
      } catch (err) {
        console.error("Error seeding admin user:", err)
        setError(`Error initializing admin system: ${err.message}`)
      } finally {
        setSeedingAdmin(false)
      }
    }

    checkAndSeedAdmin()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("Attempting login with:", email)
      const result = await loginAdmin(email, password)

      if (result.success) {
        console.log("Login successful:", result.user)
        // Store admin info in localStorage
        localStorage.setItem("adminUser", JSON.stringify(result.user))
        navigate("/admin/dashboard")
      } else {
        console.error("Login failed:", result.error)
        setError(result.error || "Login failed. Please check your credentials.")
      }
    } catch (err) {
      console.error("Unexpected error during login:", err)
      setError(`An unexpected error occurred: ${err.message}`)
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
      {seedingAdmin ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Initializing admin system...</p>
        </div>
      ) : (
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6} xl={5}>
            <Card className="shadow-lg border-0 rounded-lg">
              <Card.Header className="bg-primary text-white text-center py-4">
                <h2 className="fw-light mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Admin Portal
                </h2>
              </Card.Header>
              <Card.Body className="p-5">
                {error && <Alert variant="danger">{error}</Alert>}
                <div className="text-center mb-4">
                  <h4>Welcome Back</h4>
                  <p className="text-muted">Please sign in to continue to the admin dashboard</p>
                </div>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label>Email Address</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-key"></i>
                      </span>
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Check type="checkbox" label="Remember me" id="rememberMe" />
                  </Form.Group>

                  <div className="d-grid">
                    <Button variant="primary" type="submit" className="py-2" disabled={loading}>
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
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
              <Card.Footer className="py-3 bg-light text-center">
                <div className="d-flex justify-content-between align-items-center">
                  <small>
                    <Link to="/admin/signup" className="text-decoration-none">
                      <i className="bi bi-person-plus me-1"></i> Create Admin Account
                    </Link>
                  </small>
                  <small className="text-muted">On Sale Now Admin Panel &copy; {new Date().getFullYear()}</small>
                </div>
              </Card.Footer>
            </Card>
            <div className="text-center mt-3 text-white">
              <small>
                <a href="/" className="text-white text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i> Back to Store
                </a>
              </small>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default AdminLogin
