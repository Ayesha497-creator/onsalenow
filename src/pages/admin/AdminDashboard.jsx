"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import AdminSidebar from "../../components/admin/AdminSidebar"
import AdminHeader from "../../components/admin/AdminHeader"
import { getProductsData } from "../../firebase/database"

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    menProducts: 0,
    womenProducts: 0,
    kidsProducts: 0,
    scrappedProducts: 0,
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Check if admin is logged in
    const adminUser = localStorage.getItem("adminUser")
    if (!adminUser) {
      navigate("/admin")
      return
    }

    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const result = await getProductsData()

        if (result.success && result.data) {
          const products = Object.values(result.data)

          // Calculate statistics
          const menProducts = products.filter(
            (p) =>
              p.category?.toLowerCase() === "men" || (p.keywords && p.keywords.some((k) => k.toLowerCase() === "men")),
          ).length

          const womenProducts = products.filter(
            (p) =>
              p.category?.toLowerCase() === "women" ||
              (p.keywords && p.keywords.some((k) => k.toLowerCase() === "women")),
          ).length

          const kidsProducts = products.filter(
            (p) =>
              p.category?.toLowerCase() === "kids" ||
              (p.keywords && p.keywords.some((k) => k.toLowerCase() === "kids")),
          ).length

          const scrappedProducts = products.filter((p) => p.website).length

          // Total Products = Scrapped Products + Men's Products + Women's Products
          const totalProducts = scrappedProducts + menProducts + womenProducts

          setStats({
            totalProducts,
            menProducts,
            womenProducts,
            kidsProducts,
            scrappedProducts,
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <div className="admin-dashboard d-flex" style={{ width: "100%", overflow: "hidden" }}>
      <AdminSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto", height: "100vh" }}>
        <AdminHeader />
        <Container fluid className="py-4 px-4">
          <h2 className="mb-4">Dashboard</h2>

          <Row>
            <Col md={3} className="mb-4">
              <Card className="shadow-sm h-100 border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                      <i className="bi bi-box text-primary fs-4"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Total Products</h6>
                      <h3 className="mb-0">{stats.totalProducts}</h3>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button variant="outline-primary" size="sm" className="w-100" as={Link} to="/admin/products">
                      View All Products
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-4">
              <Card className="shadow-sm h-100 border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                      <i className="bi bi-cloud-download text-success fs-4"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Scrapped Products</h6>
                      <h3 className="mb-0">{stats.scrappedProducts}</h3>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="w-100"
                      as={Link}
                      to="/admin/products?filter=scrapped"
                    >
                      View Scrapped Products
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-4">
              <Card className="shadow-sm h-100 border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                      <i className="bi bi-gender-male text-info fs-4"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Men's Products</h6>
                      <h3 className="mb-0">{stats.menProducts}</h3>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="w-100"
                      as={Link}
                      to="/admin/products?category=men"
                    >
                      View Men's Products
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3} className="mb-4">
              <Card className="shadow-sm h-100 border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                      <i className="bi bi-gender-female text-danger fs-4"></i>
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Women's Products</h6>
                      <h3 className="mb-0">{stats.womenProducts}</h3>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="w-100"
                      as={Link}
                      to="/admin/products?category=women"
                    >
                      View Women's Products
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col lg={8} className="mb-4">
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Recent Activities</h5>
                </Card.Header>
                <Card.Body>
                  <div className="activity-timeline">
                    <div className="activity-item d-flex mb-3">
                      <div className="activity-icon bg-primary text-white rounded-circle p-2 me-3">
                        <i className="bi bi-cloud-download"></i>
                      </div>
                      <div>
                        <p className="mb-1 fw-bold">Products Scrapped</p>
                        <p className="text-muted small mb-0">25 products were scrapped from Outfitters</p>
                        <small className="text-muted">2 hours ago</small>
                      </div>
                    </div>

                    <div className="activity-item d-flex mb-3">
                      <div className="activity-icon bg-success text-white rounded-circle p-2 me-3">
                        <i className="bi bi-person-plus"></i>
                      </div>
                      <div>
                        <p className="mb-1 fw-bold">New Admin Added</p>
                        <p className="text-muted small mb-0">A new admin user was added to the system</p>
                        <small className="text-muted">Yesterday</small>
                      </div>
                    </div>

                    <div className="activity-item d-flex mb-3">
                      <div className="activity-icon bg-warning text-white rounded-circle p-2 me-3">
                        <i className="bi bi-tag"></i>
                      </div>
                      <div>
                        <p className="mb-1 fw-bold">Price Updates</p>
                        <p className="text-muted small mb-0">15 products had their prices updated</p>
                        <small className="text-muted">3 days ago</small>
                      </div>
                    </div>

                    <div className="activity-item d-flex">
                      <div className="activity-icon bg-info text-white rounded-circle p-2 me-3">
                        <i className="bi bi-box-seam"></i>
                      </div>
                      <div>
                        <p className="mb-1 fw-bold">New Category Added</p>
                        <p className="text-muted small mb-0">A new product category was created</p>
                        <small className="text-muted">5 days ago</small>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4} className="mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      className="d-flex align-items-center justify-content-between"
                      as={Link}
                      to="/admin/products"
                    >
                      <span>
                        <i className="bi bi-box me-2"></i> Manage Products
                      </span>
                      <i className="bi bi-chevron-right"></i>
                    </Button>

                   

                    <Button
                      variant="info"
                      className="d-flex align-items-center justify-content-between"
                      as={Link}
                      to="/admin/users"
                    >
                      <span>
                        <i className="bi bi-people me-2"></i> Manage Users
                      </span>
                      <i className="bi bi-chevron-right"></i>
                    </Button>

                   
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  )
}

export default AdminDashboard
