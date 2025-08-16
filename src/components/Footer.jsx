import { Container, Row, Col, ListGroup } from "react-bootstrap"
import { Link } from "react-router-dom"

const Footer = () => {
  const categories = [
    { name: "Men", path: "/category/men" },
    { name: "Women", path: "/category/women" },
    // { name: "Kids", path: "/category/kids" },
    { name: "Footwear", path: "/category/footwear" },
    { name: "Accessories", path: "/category/accessories" },
    { name: "Beauty", path: "/category/beauty" },
  ]

  return (
    <footer className="bg-danger text-white pt-5 pb-3 w-100">
      <Container fluid className="px-4 px-md-5">
        <Row>
          <Col md={12} className="mb-4 d-flex flex-column align-items-start">
            <div className="d-flex align-items-center mb-3">
              {/* <img src="/LOGO.png" alt="On Sale Now" height="100" className="me-2" /> */}
              <h5 className="mb-0 fw-bold">On Sale Now</h5>
            </div>
            <div className="d-flex flex-wrap gap-3">
              {categories.map((category, index) => (
                <Link key={index} to={category.path} className="text-white text-decoration-none">
                  {category.name}
                </Link>
              ))}
            </div>
          </Col>
        </Row>
        <Row>
          <Col className="text-center">
            <p className="text-white mb-0">OnSaleNow Best Opportunity to awail Sales on Time</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
