"use client"

import { useState } from "react"
import { Nav } from "react-bootstrap"
import { Link, useLocation } from "react-router-dom"

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const menuItems = [
    { icon: "bi-speedometer2", label: "Dashboard", path: "/admin/dashboard" },
    { icon: "bi-box-seam", label: "Products", path: "/admin/products" },
    { icon: "bi-people", label: "Users", path: "/admin/users" },
    // { icon: "bi-bag", label: "Orders", path: "/admin/orders" },
    // { icon: "bi-cloud-download", label: "Scraping", path: "/admin/scraping" },
    // { icon: "bi-tag", label: "Categories", path: "/admin/categories" },
    { icon: "bi-graph-up", label: "Analytics", path: "/admin/analytics" },
    // { icon: "bi-gear", label: "Settings", path: "/admin/settings" },
  ]

  return (
    <div
      className={`admin-sidebar bg-dark text-white ${collapsed ? "collapsed" : ""}`}
      style={{
        width: collapsed ? "70px" : "250px",
        minHeight: "100vh",
        transition: "width 0.3s ease",
      }}
    >
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
        {!collapsed && (
          <h5 className="mb-0">
            <i className="bi bi-shop me-2"></i>
            <span className="text-danger">On Sale Now</span> Admin
          </h5>
        )}
        {collapsed && (
          <div className="mx-auto">
            <i className="bi bi-shop fs-4 text-danger"></i>
          </div>
        )}
        <button className="btn btn-sm text-white" onClick={() => setCollapsed(!collapsed)}>
          <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`}></i>
        </button>
      </div>

      <Nav className="flex-column mt-3">
        {menuItems.map((item, index) => (
          <Nav.Item key={index}>
            <Nav.Link
              as={Link}
              to={item.path}
              className={`d-flex align-items-center py-3 px-3 text-white ${
                location.pathname === item.path ? "active bg-primary" : ""
              }`}
            >
              <i className={`bi ${item.icon} ${collapsed ? "fs-5" : "me-3"}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="mt-auto p-3 border-top border-secondary">
        <Nav.Link as={Link} to="/admin/logout" className="d-flex align-items-center text-white">
          <i className={`bi bi-box-arrow-left ${collapsed ? "fs-5" : "me-3"}`}></i>
          {!collapsed && <span>Logout</span>}
        </Nav.Link>
      </div>
    </div>
  )
}

export default AdminSidebar
