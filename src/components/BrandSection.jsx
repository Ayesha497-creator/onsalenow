"use client"

import { Link } from "react-router-dom"
import { Container, Row, Col, Card } from "react-bootstrap"

// Export the brands array so it can be imported elsewhere
export const brands = [
  {
    id: 1,
    name: "Junaid Jamshed",
    path: "/brand/junaid-jamshed",
    imageUrl: "/brands/junaid-jamshed.png",
    websiteValue: "junaid-jamshed", // The value stored in the website property
  },
  {
    id: 2,
    name: "Outfitters",
    path: "/brand/outfitters",
    imageUrl: "/brands/outfitters.png",
    websiteValue: "outfitters",
  },
  {
    id: 3,
    name: "Khaadi",
    path: "/brand/khaadi",
    imageUrl: "/brands/khaadi.png",
    websiteValue: "khaadi",
  },
  {
    id: 4,
    name: "Gul Ahmed",
    path: "/brand/gul-ahmed",
    imageUrl: "/brands/gul-ahmad.png",
    websiteValue: "gul-ahmed",
  },
  {
    id: 5,
    name: "Sana Safinaz",
    path: "/brand/sana-safinaz",
    imageUrl: "/brands/sana-safinaz.png",
    websiteValue: "sana-safinaz",
  },
  {
    id: 6,
    name: "Alkaram",
    path: "/brand/alkaram",
    imageUrl: "/brands/alkaram.png",
    websiteValue: "alkaram",
  },
]

const BrandSection = () => {
  return (
    <Container fluid className="my-5 px-4 px-md-5">
      <h2 className="text-center mb-4 fw-bold">SHOP BY BRANDS</h2>
      <Row>
        {brands.map((brand) => (
          <Col key={brand.id} xs={6} md={4} lg={2} className="mb-4">
            <Link to={brand.path} className="text-decoration-none">
              <Card className="border-0 brand-card">
                <div className="brand-image-container text-center">
                  <Card.Img
                    variant="top"
                    src={brand.imageUrl}
                    className="rounded-circle mx-auto d-block brand-image"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  />
                </div>
                <Card.Body className="text-center">
                  <Card.Title className="fs-6 text-dark">{brand.name}</Card.Title>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  )
}

export default BrandSection
