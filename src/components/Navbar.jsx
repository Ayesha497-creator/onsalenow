"use client"

import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Navbar as BootstrapNavbar, Nav, Container, Form, FormControl, Dropdown, Button, Badge } from "react-bootstrap"
import LoginModal from "./auth/LoginModal"
import SignupModal from "./auth/SignupModal"
import ProfileModal from "./auth/ProfileModal"
import SellerRegistrationModal from "./auth/SellerRegistrationModal"
import { logoutUser } from "../firebase/auth"
import { useCart } from "../context/CartContext"
import SellerLoginModal from "./auth/SellerLoginModal"
import SearchModal from "./SearchModal"

const Navbar = ({ user, onUserChange }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false);
  const cartIconRef = useRef(null)
  const [filters, setFilters] = useState({});
  const navigate = useNavigate()
  const { cartCount } = useCart()

  // Add a new state for the seller login modal
  const [showSellerLoginModal, setShowSellerLoginModal] = useState(false)

  const categories = [
    { name: "Men", path: "/category/men" },
    { name: "Women", path: "/category/women" },
    // { name: "Kids", path: "/category/kids" },
    { name: "Footwear", path: "/category/footwear" },
    { name: "Accessories", path: "/category/accessories" },
    { name: "Beauty", path: "/category/beauty" },
  ]

  const handleLoginClick = () => {
    setShowLoginModal(true)
  }

  const handleSignupClick = () => {
    setShowSignupModal(true)
  }

  const handleSellerClick = () => {
    // Show seller registration modal directly - no need to check login status
    setShowSellerModal(true)
  }

  // Add a new handler for seller login click
  const handleSellerLoginClick = () => {
    setShowSellerLoginModal(true)
  }

  const handleLoginSuccess = (userData) => {
    onUserChange(userData)
    setShowLoginModal(false)
  }

  const handleSignupSuccess = (userData) => {
    onUserChange(userData)
    setShowSignupModal(false)
  }

  const handleSellerRegistrationSuccess = (sellerData) => {
    // If user was already logged in, update their info
    if (user) {
      const updatedUser = { ...user, ...sellerData, isSeller: true }
      onUserChange(updatedUser)
    } else {
      // If this was a direct seller registration, log them in
      const newUser = {
        ...sellerData,
        isSeller: true,
        uid: sellerData.sellerId,
      }
      onUserChange(newUser)
    }

    setShowSellerModal(false)

    // Redirect to seller dashboard
    navigate("/seller")
  }

  // Add a handler for seller login success
  const handleSellerLoginSuccess = (sellerData) => {
    // Update user with seller data
    const updatedUser = {
      ...sellerData,
      isSeller: true,
    }
    onUserChange(updatedUser)
    setShowSellerLoginModal(false)

    // Redirect to seller dashboard
    navigate("/seller")
  }

  const handleProfileUpdate = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData }
    onUserChange(updatedUser)
    setShowProfileModal(false)
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      onUserChange(null)
      navigate("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    return
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <SearchModal
        show={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onApply={(appliedFilters) => {
          const { query, priceRange, selectedSizes, selectedCategories } = appliedFilters;

          const params = new URLSearchParams();
          if (query?.trim()) params.set("q", query.trim());
          if (priceRange) params.set("price", priceRange);
          if (selectedSizes?.length) params.set("sizes", selectedSizes.join(","));
          if (selectedCategories?.length) params.set("categories", selectedCategories.join(","));

          navigate(`/search?${params.toString()}`);
        }}
      />

      <BootstrapNavbar bg="white" expand="lg" className="py-2 shadow-sm sticky-top w-100">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <img src="/LOGO.png" alt="On Sale Now" height="100" className="me-2" />
            <span className="fw-bold fs-4 text-danger">On Sale Now</span>
          </BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {categories.map((category, index) => (
                <Nav.Link key={index} as={Link} to={category.path} className="mx-2 fw-semibold">
                  {category.name}
                </Nav.Link>
              ))}
            </Nav>
            <Form className="d-flex mx-2" style={{ width: "30%" }} onSubmit={handleSearch}>
              <FormControl
                type="search"
                placeholder="Search..."
                className="me-2 rounded-pill"
                aria-label="Search"
                onClick={() => setShowSearchModal(true)}
              // value={searchQuery}
              // onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-danger" type="submit" className="rounded-pill">
                <i className="bi bi-search"></i>
              </Button>
            </Form>
            <Nav className="ms-auto">
              {user ? (
                <Dropdown align="end">
                  <Dropdown.Toggle
                    as={Nav.Link}
                    id="profile-dropdown"
                    className="d-flex flex-column align-items-center text-dark"
                  >
                    <i className="bi bi-person-circle"></i>
                    <span className="small">Hi, {user.firstName}</span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="shadow-sm border-0">
                    <Dropdown.Item onClick={() => setShowProfileModal(true)}>
                      <i className="bi bi-person me-2"></i> My Profile
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/orders">
                      <i className="bi bi-box me-2"></i> My Orders
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/wishlist">
                      <i className="bi bi-heart me-2"></i> Wishlist
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/brand-notifications">
                      <i className="bi bi-bell me-2"></i> Brand Notifications
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/category-notifications">
                      <i className="bi bi-bell me-2"></i> Category Notifications
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/for-you">
                      <i className="bi bi-stars me-2"></i> For You
                    </Dropdown.Item>
                    {user.isSeller ? (
                      <Dropdown.Item as={Link} to="/seller">
                        <i className="bi bi-shop me-2"></i> Seller Dashboard
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item onClick={handleSellerClick}>
                        <i className="bi bi-shop me-2"></i> Become a Seller
                      </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i> Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <>
                  <Nav.Link className="d-flex flex-column align-items-center" onClick={handleLoginClick}>
                    <i className="bi bi-person"></i>
                    <span className="small">Profile</span>
                  </Nav.Link>
                  <Dropdown align="end">
                    <Dropdown.Toggle as={Nav.Link} className="d-flex flex-column align-items-center text-dark">
                      <i className="bi bi-shop"></i>
                      <span className="small">Seller</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow-sm border-0">
                      <Dropdown.Item onClick={handleSellerLoginClick}>
                        <i className="bi bi-box-arrow-in-right me-2"></i> Seller Login
                      </Dropdown.Item>
                      <Dropdown.Item onClick={handleSellerClick}>
                        <i className="bi bi-person-plus me-2"></i> Register as Seller
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              )}
              <Nav.Link as={Link} to="/wishlist" className="d-flex flex-column align-items-center mx-2">
                <i className="bi bi-heart"></i>
                <span className="small">Wishlist</span>
              </Nav.Link>
              <Nav.Link as={Link} to="/cart" className="d-flex flex-column align-items-center position-relative">
                <i className="bi bi-bag" ref={cartIconRef}></i>
                <span className="small">Bag</span>
                {cartCount > 0 && (
                  <Badge
                    pill
                    bg="danger"
                    className="position-absolute"
                    style={{ top: "-5px", right: "-5px", fontSize: "0.6rem" }}
                  >
                    {cartCount}
                  </Badge>
                )}
              </Nav.Link>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      <LoginModal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignupClick={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
      />

      <SignupModal
        show={showSignupModal}
        onHide={() => setShowSignupModal(false)}
        onSignupSuccess={handleSignupSuccess}
        onLoginClick={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
      />

      <SellerRegistrationModal
        show={showSellerModal}
        onHide={() => setShowSellerModal(false)}
        user={user}
        onSellerRegistrationSuccess={handleSellerRegistrationSuccess}
      />

      <SellerLoginModal
        show={showSellerLoginModal}
        onHide={() => setShowSellerLoginModal(false)}
        onLoginSuccess={handleSellerLoginSuccess}
        onSignupClick={() => {
          setShowSellerLoginModal(false)
          setShowSellerModal(true)
        }}
      />

      {user && (
        <ProfileModal
          show={showProfileModal}
          onHide={() => setShowProfileModal(false)}
          user={user}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </>
  )
}

export default Navbar
