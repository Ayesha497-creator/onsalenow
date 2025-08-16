// "use client"
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  OverlayTrigger,
  Tooltip,
  Button,
  Spinner,
} from "react-bootstrap";
import {
  checkCategorySubscription,
  toggleCategorySubscription,
} from "../firebase/categorySubscriptions";

const CategorySection = () => {
  // const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(null);
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: "Men",
      path: "/category/men",
      imageUrl: "/men-fashion-duality.png",
      isSubscribed: false,
    },
    {
      id: 2,
      name: "Women",
      path: "/category/women",
      imageUrl: "/chic-essentials.png",
      isSubscribed: false,
    },
    // {
    //   id: 3,
    //   name: "Kids",
    //   path: "/category/kids",
    //   imageUrl: "/placeholder.svg?key=1jq22",
    //   isSubscribed: false,
    // },
    {
      id: 4,
      name: "Footwear",
      path: "/category/footwear",
      imageUrl: "/footwear-collection.png",
      isSubscribed: false,
    },
    {
      id: 5,
      name: "Accessories",
      path: "/category/accessories",
      imageUrl: "/curated-accessories.png",
      isSubscribed: false,
    },
    {
      id: 6,
      name: "Beauty",
      path: "/category/beauty",
      imageUrl: "/beauty-essentials.png",
      isSubscribed: false,
    },
  ]);

  const user = useMemo(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const handleSubscriptionToggle = async (category) => {
    console.log("clicked", category);
    if (!user) return;

    try {
      setSubscriptionLoading(category.id);

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      const token = "category-fcm-token"; // Replace with real FCM token if needed

      const result = await toggleCategorySubscription(
        user.uid,
        category.name,
        category.isSubscribed,
        token
      );

      if (result.success) {
        // Update the state
        setCategories((prevCategories) =>
          prevCategories.map((cat) =>
            cat.id === category.id
              ? { ...cat, isSubscribed: !cat.isSubscribed }
              : cat
          )
        );
      }
    } catch (err) {
      console.error("Error toggling subscription:", err);
    } finally {
      setSubscriptionLoading(null);
    }
  };

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      const updatedCategories = await Promise.all(
        categories.map(async (category) => {
          try {
            const result = await checkCategorySubscription(
              user.uid,
              category.name
            );
            const isSubscribed = result?.exists && result?.data?.active;
            return { ...category, isSubscribed };
          } catch (error) {
            console.log(`Error checking category subscription:- ${error}`);
            return { ...category, isSubscribed: false };
          }
        })
      );
      setCategories(updatedCategories);
    };

    checkSubscription();
  }, [user]);

  return (
    <Container fluid className="my-5 px-4 px-md-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold">SHOP BY CATEGORY</h2>
      </div>
      <Row className="justify-content-center">
        {categories.map((category) => (
          <Col
            key={category.id}
            xs={6}
            md={6}
            lg={2}
            className="mb-4"
            style={{ position: "relative" }}
          >
            <Card
              style={{ height: "260px" }}
              className="category-card position-relative"
            >
              {user && (
                <OverlayTrigger
                  // style={{ border: "2px red solid" }}
                  key={`tooltip-${category.id}`} // Unique key helps tooltips work
                  placement="top"
                  overlay={
                    <Tooltip id={`tooltip-${category.id}`}>
                      {category.isSubscribed
                        ? "Turn off notifications"
                        : "Get notified about new products"}
                    </Tooltip>
                  }
                >
                  <Button
                    variant="button"
                    className="p-0 text-decoration-none"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 2,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubscriptionToggle(category);
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Also prevents focus-triggered click on parent
                    disabled={subscriptionLoading == category.id}
                  >
                    {subscriptionLoading == category.id ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <i
                        className={`bi ${
                          category.isSubscribed
                            ? "bi-bell-fill text-warning"
                            : "bi-bell"
                        } fs-5`}
                      ></i>
                    )}
                  </Button>
                </OverlayTrigger>
              )}

              {/* Link ONLY wraps image + body now */}
              <Link
                style={{
                  position: "absolute",
                  bottom: "0px",
                  right: "0px",
                  zIndex: 1,
                  // border:"1px red solid",
                  width: "216px",
                }}
                to={category.path}
                className="text-decoration-none"
              >
                <Card.Img
                  variant="top"
                  src={category.imageUrl}
                  className="rounded-circle mx-auto d-block"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                  }}
                />
                <Card.Body className="text-center">
                  <Card.Title className="fs-6 text-dark">
                    {category.name}
                  </Card.Title>
                </Card.Body>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CategorySection;
