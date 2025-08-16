"use client"

import { useState, useEffect } from "react"
import { Navbar, Container, Nav, Dropdown, Form, InputGroup } from "react-bootstrap"
import { Link } from "react-router-dom"

const AdminHeader = () => {
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminUser")
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin))
      } catch (error) {
        console.error("Error parsing admin user:", error)
      }
    }
  }, [])

  return (
    <Navbar bg="white" expand="lg" className="border-bottom shadow-sm py-2 admin-header">
      <Container fluid className="px-4">
        <Form className="d-none d-lg-flex me-auto" style={{ width: "30%" }}>
          <InputGroup>
            <InputGroup.Text className="bg-light border-end-0">
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control type="search" placeholder="Search..." className="border-start-0 bg-light" />
          </InputGroup>
        </Form>

        <Nav className="ms-auto d-flex align-items-center">
          {/* <Nav.Link href="#" className="me-3 position-relative">
            <i className="bi bi-bell fs-5"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              3<span className="visually-hidden">unread notifications</span>
            </span>
          </Nav.Link>

          <Nav.Link href="#" className="me-3">
            <i className="bi bi-envelope fs-5"></i>
          </Nav.Link> */}

          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="d-flex align-items-center" style={{ cursor: "pointer" }}>
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                style={{ width: "40px", height: "40px" }}
              >
                {adminUser?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="d-none d-lg-block">
                <div className="fw-bold">{adminUser?.email?.split("@")[0] || "Admin"}</div>
                <div className="small text-muted">Administrator</div>
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow-sm border-0">
              <Dropdown.Item as={Link} to="/admin/profile">
                <i className="bi bi-person me-2"></i> Profile
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/admin/settings">
                <i className="bi bi-gear me-2"></i> Settings
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as={Link} to="/admin/logout">
                <i className="bi bi-box-arrow-right me-2"></i> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  )
}

export default AdminHeader
