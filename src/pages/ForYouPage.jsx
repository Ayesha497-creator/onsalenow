import React, { useEffect, useState } from "react";
import { getUserBrandSubscriptions } from "../firebase/brandSubscriptions";
import { getUserCategorySubscriptions } from "../firebase/categorySubscriptions";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

// Get userId from auth context or localStorage
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userId = user?.uid;

const parsePrice = (priceValue) => {
  if (!priceValue) return 0;
  const priceStr = String(priceValue);
  const cleanPrice = priceStr.replace(/[^0-9.]/g, "");
  return Number.parseFloat(cleanPrice) || 0;
};
const calculateDiscount = (originalPrice, price) => {
  const original = parsePrice(originalPrice);
  const current = parsePrice(price);
  if (original > 0 && current > 0 && original > current) {
    return Math.round(((original - current) / original) * 100);
  }
  return 0;
};
const hasDiscount = (product) => {
  if (product.discountPercent && !isNaN(Number(product.discountPercent)) && Number(product.discountPercent) > 0) {
    return true;
  }
  const original = parsePrice(product.originalPrice);
  const current = parsePrice(product.price);
  return original > 0 && current > 0 && original > current;
};
const displayPrice = (priceValue) => {
  const numericPrice = parsePrice(priceValue);
  return numericPrice.toLocaleString();
};

const ForYouPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch user subscriptions
        console.log("Fetching subscriptions for user ID:", userId);
        const brandRes = await getUserBrandSubscriptions(userId);
        const categoryRes = await getUserCategorySubscriptions(userId);
        const brands = (brandRes.success ? brandRes.data : []).filter(s => s.active).map(s => s.brandName);
        const categories = (categoryRes.success ? categoryRes.data : []).filter(s => s.active).map(s => s.categoryName);

        // 2. Fetch recommendations from backend
        const response = await fetch("http://localhost:8000/recommendations/for-you-subscribed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_names: brands, category_names: categories, top_n: 12 })
        });
        if (!response.ok) throw new Error("Failed to fetch recommendations");
        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        setError(err.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchRecommendations();
    } else {
      setLoading(false);
      setError("User not logged in");
    }
  }, [userId]);

  return (
    <Container className="my-5">
      <h2 className="mb-4 fw-bold text-center">For You</h2>
      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && recommendations.length === 0 && (
        <Alert variant="info">No recommendations found. Subscribe to brands or categories to get personalized suggestions!</Alert>
      )}
      <Row>
        {recommendations.map(product => {
          const discountPercent = product.discountPercent && !isNaN(Number(product.discountPercent))
            ? Number(product.discountPercent)
            : calculateDiscount(product.originalPrice, product.price);
          return (
            <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card className="h-100 position-relative" style={{ cursor: "pointer" }} onClick={() => navigate(`/product/${product.id}`)}>
                {/* Discount badge */}
                {hasDiscount(product) && discountPercent > 0 && (
                  <span className="badge bg-danger position-absolute" style={{ top: 10, right: 10, zIndex: 2 }}>{discountPercent}% OFF</span>
                )}
                <Card.Img variant="top" src={product.image || "/placeholder.svg"} style={{ height: "220px", objectFit: "cover" }} />
                <Card.Body>
                  <Card.Title className="fs-6 fw-bold text-truncate">{product.name}</Card.Title>
                  <div className="fw-bold">
                    Rs. {displayPrice(product.price)}
                    {hasDiscount(product) && (
                      <>
                        <span className="text-muted text-decoration-line-through ms-2">
                          Rs. {displayPrice(product.originalPrice)}
                        </span>
                        {discountPercent > 0 && (
                          <span className="text-danger ms-2 small">({discountPercent}% OFF)</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="small text-secondary">{product.brand} | {product.category}</div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default ForYouPage; 