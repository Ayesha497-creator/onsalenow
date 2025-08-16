"use client"

import { useState } from "react"
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap"
import { updateUserProfile } from "../../firebase/auth"

const ProfileModal = ({ show, onHide, user, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    address: user?.address || "",
    phoneNumber: user?.phoneNumber || "",
    username: user?.username || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
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
    setError(null)
    setSuccess(null)
    if (!validateForm()) return;
    setLoading(true)

    try {
      const result = await updateUserProfile(user.uid, formData)
      if (result.success) {
        setSuccess("Profile updated successfully!")
        onProfileUpdate(formData)
      } else {
        setError(result.error || "Failed to update profile. Please try again.")
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
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
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
                  isInvalid={!!validationErrors.firstName}
                  isValid={!validationErrors.firstName && formData.firstName.trim()}
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
                  isInvalid={!!validationErrors.lastName}
                  isValid={!validationErrors.lastName && formData.lastName.trim()}
                />
                {validationErrors.lastName && <Form.Control.Feedback type="invalid">{validationErrors.lastName}</Form.Control.Feedback>}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              isInvalid={!!validationErrors.username}
              isValid={!validationErrors.username && formData.username.trim()}
            />
            {validationErrors.username && <Form.Control.Feedback type="invalid">{validationErrors.username}</Form.Control.Feedback>}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              name="phoneNumber"
              placeholder="03xxxxxxxxx"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength={11}
              isInvalid={!!validationErrors.phoneNumber}
              isValid={!validationErrors.phoneNumber && formData.phoneNumber.trim()}
            />
            {validationErrors.phoneNumber && <Form.Control.Feedback type="invalid">{validationErrors.phoneNumber}</Form.Control.Feedback>}
            <Form.Text className="text-muted">Enter your Pakistani phone number (e.g., 03xxxxxxxxx)</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              name="address"
              rows={3}
              placeholder="Your address"
              value={formData.address}
              onChange={handleChange}
              isInvalid={!!validationErrors.address}
              isValid={!validationErrors.address && formData.address.trim()}
            />
            {validationErrors.address && <Form.Control.Feedback type="invalid">{validationErrors.address}</Form.Control.Feedback>}
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default ProfileModal
