"use client"

import { useState } from "react"
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap"
import { registerUser } from "../../firebase/auth"

const SignupModal = ({ show, onHide, onSignupSuccess, onLoginClick }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    address: "",
    phoneNumber: "",
    username: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  }

  const validateForm = () => {
    const errors = {};

    // First Name validation: required and no numbers allowed
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      errors.firstName = "First name can only contain letters and spaces";
    }

    // Last Name validation: required and no numbers allowed
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      errors.lastName = "Last name can only contain letters and spaces";
    }

    // Pakistani Phone Number validation: required and must be Pakistani format
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else {
      const phoneRegex = /^03\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        errors.phoneNumber = "Please enter a valid Pakistani phone number (e.g., 03xxxxxxxxx)";
      }
    }

    // Password validation: at least 6 chars, uppercase, lowercase, and numeric
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Email validation: must be a valid email format
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Username validation
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    // Address validation
    if (!formData.address.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.trim().length < 10) {
      errors.address = "Address must be at least 10 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        username: formData.username,
        status: "unblocked", // Default status for new users
      }

      const result = await registerUser(formData.email, formData.password, userData)
      if (result.success) {
        onSignupSuccess(result.user)
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
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  isInvalid={validationErrors.email}
                />
                {validationErrors.email && <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  isInvalid={validationErrors.username}
                />
                {validationErrors.username && <Form.Control.Feedback type="invalid">{validationErrors.username}</Form.Control.Feedback>}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  isInvalid={validationErrors.firstName}
                />
                {validationErrors.firstName && <Form.Control.Feedback type="invalid">{validationErrors.firstName}</Form.Control.Feedback>}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  isInvalid={validationErrors.lastName}
                />
                {validationErrors.lastName && <Form.Control.Feedback type="invalid">{validationErrors.lastName}</Form.Control.Feedback>}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              name="phoneNumber"
              placeholder="03xxxxxxxxx"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength={11}
              isInvalid={validationErrors.phoneNumber}
            />
            {validationErrors.phoneNumber && <Form.Control.Feedback type="invalid">{validationErrors.phoneNumber}</Form.Control.Feedback>}
            <Form.Text className="text-muted">Enter your Pakistani phone number (e.g., 03xxxxxxxxx)</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              name="address"
              rows={2}
              placeholder="Your address"
              value={formData.address}
              onChange={handleChange}
              isInvalid={validationErrors.address}
            />
            {validationErrors.address && <Form.Control.Feedback type="invalid">{validationErrors.address}</Form.Control.Feedback>}
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={validationErrors.password}
                />
                {validationErrors.password && <Form.Control.Feedback type="invalid">{validationErrors.password}</Form.Control.Feedback>}
                <Form.Text className="text-muted">Password must be at least 6 characters with uppercase, lowercase, and numeric characters.</Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  isInvalid={validationErrors.confirmPassword}
                />
                {validationErrors.confirmPassword && <Form.Control.Feedback type="invalid">{validationErrors.confirmPassword}</Form.Control.Feedback>}
              </Form.Group>
            </Col>
          </Row>

          <div className="d-grid gap-2">
            <Button variant="danger" type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </div>
        </Form>
        <div className="text-center mt-3">
          <p>
            Already have an account?{" "}
            <Button variant="link" className="p-0" onClick={onLoginClick}>
              Login
            </Button>
          </p>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default SignupModal
