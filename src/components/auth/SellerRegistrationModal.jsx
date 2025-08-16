"use client"

import { useState, useEffect } from "react"
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap"
import { registerSeller } from "../../firebase/sellerAuth"
import { Link } from "react-router-dom"

const SellerRegistrationModal = ({ show, onHide, user, onSellerRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    brandName: "",
    businessDescription: "",
    website: "",
    storeCategory: "",
    taxId: "123",
    password: "",
    confirmPassword: "",
    agreedToPolicy: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [sellerData, setSellerData] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // Pre-fill form with user data if available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        brandName: "",
        businessDescription: "",
        website: "",
        storeCategory: "",
        taxId: "",
        password: "",
        confirmPassword: "",
      })
    }
  }, [user, show])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Restrict numeric input for names
    if ((name === 'firstName' || name === 'lastName') && /\d/.test(value)) {
      return; // Don't update if numeric characters are entered
    }
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      errors.firstName = "First name can only contain letters and spaces";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      errors.lastName = "Last name can only contain letters and spaces";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    // Pakistani Phone Number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else {
      const phoneRegex = /^03\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.trim())) {
        errors.phoneNumber = "Please enter a valid Pakistani phone number (e.g., 03xxxxxxxxx)";
      }
    }

    // Address validation
    if (!formData.address.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.trim().length < 10) {
      errors.address = "Address must be at least 10 characters";
    }

    // Password validation (only for new users)
    if (!user) {
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
    }

    // Brand Name validation
    if (!formData.brandName.trim()) {
      errors.brandName = "Brand name is required";
    } else if (formData.brandName.trim().length < 2) {
      errors.brandName = "Brand name must be at least 2 characters";
    }

    // Store Category validation
    if (!formData.storeCategory) {
      errors.storeCategory = "Please select a store category";
    }

    // Business Description validation
    if (!formData.businessDescription.trim()) {
      errors.businessDescription = "Business description is required";
    } else if (formData.businessDescription.trim().length < 20) {
      errors.businessDescription = "Business description must be at least 20 characters";
    }

    // Website validation (optional but if provided, must be valid)
    if (formData.website.trim() && !/^https?:\/\/.+/.test(formData.website.trim())) {
      errors.website = "Please enter a valid website URL (starting with http:// or https://)";
    }

    // Policy agreement validation
    if (!formData.agreedToPolicy) {
      errors.agreedToPolicy = "You must agree to the platform policy";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendOtpEmail = async (email) => {
    try {
      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
      
      // Store OTP in localStorage
      localStorage.setItem('sellerOtp', otp);
      localStorage.setItem('sellerEmail', email);
      
      const response = await fetch('http://13.48.16.129:5173/api/email/send-gmail-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: "Seller Registration OTP - OnSaleNow",
          message: `Your OTP for seller registration is: ${otp}. Please enter this code to verify your email address.`,
          email: email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP email');
      }

      return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Register as a seller (either with existing user ID or as new seller)
      const result = await registerSeller(user ? user.uid : null, {
        ...formData,
        registeredAt: new Date().toISOString(),
        status: "pending" // Set initial status as pending
      })

      if (result.success) {
        // Send OTP email
        await sendOtpEmail(formData.email);
        
        setSellerData({
          ...formData,
          sellerId: result.sellerId,
        });
        
        setSuccess(true)
        setShowOtpModal(true)
        setLoading(false)
      } else {
        setError(result.error || "Failed to register as a seller. Please try again.")
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.")
      console.error("Seller registration error:", err)
      setLoading(false)
    }
  }

  const storeCategories = [
    "Men",
    "Women",
    "Footwear",
    "Accessories",
    "Beauty"
  ]

  return (
    <>
      <Modal show={show && !showOtpModal} onHide={onHide} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Become a Seller</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              Registration successful! Please check your email for OTP verification. After verification, your account will be reviewed by our admin team.
            </Alert>
          )}

          <div className="text-center mb-4">
            <h4>Register Your Brand</h4>
            <p className="text-muted">Join our marketplace and start selling your products</p>
          </div>

          <Form onSubmit={handleSubmit}>
            <h5 className="mb-3 border-bottom pb-2">Personal Information</h5>
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
                  />
                  {validationErrors.firstName && <Form.Text className="text-danger">{validationErrors.firstName}</Form.Text>}
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
                  />
                  {validationErrors.lastName && <Form.Text className="text-danger">{validationErrors.lastName}</Form.Text>}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                disabled={user && user.email}
              />
              {user && user.email && (
                <Form.Text className="text-muted">Email cannot be changed as you're already logged in.</Form.Text>
              )}
              {validationErrors.email && <Form.Text className="text-danger">{validationErrors.email}</Form.Text>}
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
              />
              <Form.Text className="text-muted">Enter your Pakistani phone number (e.g., 03xxxxxxxxx)</Form.Text>
              {validationErrors.phoneNumber && <Form.Text className="text-danger">{validationErrors.phoneNumber}</Form.Text>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                rows={2}
                placeholder="Your business address"
                value={formData.address}
                onChange={handleChange}
              />
              {validationErrors.address && <Form.Text className="text-danger">{validationErrors.address}</Form.Text>}
            </Form.Group>

            {!user && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <Form.Text className="text-muted">Password must be at least 6 characters long</Form.Text>
                      {validationErrors.password && <Form.Text className="text-danger">{validationErrors.password}</Form.Text>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      {validationErrors.confirmPassword && <Form.Text className="text-danger">{validationErrors.confirmPassword}</Form.Text>}
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            <h5 className="mt-4 mb-3 border-bottom pb-2">Brand Information</h5>

            <Form.Group className="mb-3">
              <Form.Label>Brand Name</Form.Label>
              <Form.Control
                type="text"
                name="brandName"
                placeholder="Your brand name"
                value={formData.brandName}
                onChange={handleChange}
              />
              {validationErrors.brandName && <Form.Text className="text-danger">{validationErrors.brandName}</Form.Text>}
              <Form.Text className="text-muted">
                This will be displayed to customers when they view your products.
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Store Category</Form.Label>
                  <Form.Select name="storeCategory" value={formData.storeCategory} onChange={handleChange}>
                    <option value="">Select a category</option>
                    {storeCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                  {validationErrors.storeCategory && <Form.Text className="text-danger">{validationErrors.storeCategory}</Form.Text>}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Business Description</Form.Label>
              <Form.Control
                as="textarea"
                name="businessDescription"
                rows={3}
                placeholder="Tell us about your business and products"
                value={formData.businessDescription}
                onChange={handleChange}
              />
              {validationErrors.businessDescription && <Form.Text className="text-danger">{validationErrors.businessDescription}</Form.Text>}
              <Form.Text className="text-muted">
                Describe your brand, products, and what makes your store unique.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Website (Optional)</Form.Label>
              <Form.Control
                type="url"
                name="website"
                placeholder="https://yourbrand.com"
                value={formData.website}
                onChange={handleChange}
              />
              {validationErrors.website && <Form.Text className="text-danger">{validationErrors.website}</Form.Text>}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                id="agreedToPolicy"
                name="agreedToPolicy"
                checked={formData.agreedToPolicy}
                onChange={handleChange}
                label={
                  <>
                    I agree to the{" "}
                    <Link to="/policy-agreement" target="_blank" rel="noopener noreferrer">
                      Platform Policy
                    </Link>
                  </>
                }
              />
              {validationErrors.agreedToPolicy && <Form.Text className="text-danger">{validationErrors.agreedToPolicy}</Form.Text>}
            </Form.Group>

            <div className="d-grid gap-2 mt-4">
              <Button variant="danger" type="submit" disabled={loading || success}>
                {loading ? "Registering..." : "Register as Seller"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* OTP Verification Modal */}
      <OtpVerificationModal 
        show={showOtpModal}
        onHide={() => {
          setShowOtpModal(false)
          onHide()
        }}
        sellerData={sellerData}
        onVerificationSuccess={onSellerRegistrationSuccess}
      />
    </>
  )
}

// OTP Verification Modal Component
const OtpVerificationModal = ({ show, onHide, sellerData, onVerificationSuccess }) => {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resendLoading, setResendLoading] = useState(false)

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const storedOtp = localStorage.getItem('sellerOtp')
      const storedEmail = localStorage.getItem('sellerEmail')

      if (!storedOtp || !storedEmail) {
        throw new Error('OTP session expired. Please register again.')
      }

      if (otp !== storedOtp) {
        throw new Error('Invalid OTP. Please check and try again.')
      }

      // OTP verification successful - seller remains pending until admin approval
      // Clear OTP from localStorage
      localStorage.removeItem('sellerOtp')
      localStorage.removeItem('sellerEmail')
      
      // Call success callback with pending status
      onVerificationSuccess({
        ...sellerData,
        status: 'pending'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResendLoading(true)
    try {
      const response = await fetch('http://13.48.16.129:5173/api/email/send-gmail-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: "Seller Registration OTP - OnSaleNow",
          message: `Your new OTP for seller registration is: ${localStorage.getItem('sellerOtp')}. Please enter this code to verify your email address.`,
          email: sellerData.email
        })
      })

      if (!response.ok) {
        throw new Error('Failed to resend OTP')
      }

      alert('OTP has been resent to your email!')
    } catch (error) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Email Verification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="text-center mb-4">
          <i className="bi bi-envelope-check fs-1 text-primary"></i>
          <h4 className="mt-3">Verify Your Email</h4>
          <p className="text-muted">
            We've sent a 4-digit OTP to <strong>{sellerData?.email}</strong>
          </p>
          <p className="text-muted small">
            After verification, your account will be reviewed by our admin team for approval.
          </p>
        </div>

        <Form onSubmit={handleOtpSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Enter OTP</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={4}
              pattern="[0-9]{4}"
              required
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button variant="danger" type="submit" disabled={loading || otp.length !== 4}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button 
              variant="outline-secondary" 
              type="button" 
              onClick={handleResendOtp}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Resend OTP"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default SellerRegistrationModal
