"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from "react-bootstrap"
import { Link } from "react-router-dom"
import { getUserBrandSubscriptions, toggleBrandSubscription } from "../firebase/brandSubscriptions"
import OneSignal from 'react-onesignal';
import { getOneSignalUserId } from '../OneSignalInit';
// import OneSignal from "react-onesignal";

const BrandNotificationsPage = ({ user }) => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
   const [oneSignalId, setOneSignalId] = useState(null);
   
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) {
        setError("You must be logged in to view your brand subscriptions")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Use user.uid or user._id depending on what's available
        const userId = user.uid || user._id || user.id

        if (!userId) {
          console.error("No user ID found in user object:", user)
          setError("Unable to retrieve your user information. Please try logging in again.")
          setLoading(false)
          return
        }

        const result = await getUserBrandSubscriptions(userId)

        if (result.success) {
          // Sort subscriptions by active status and then by brand name
          const sortedSubscriptions = result.data.sort((a, b) => {
            if (a.active === b.active) {
              return a.brandName.localeCompare(b.brandName)
            }
            return a.active ? -1 : 1
          })

          setSubscriptions(sortedSubscriptions)
          setError(null) // Clear any previous errors
        } else {
          setError(result.error || "Failed to load brand subscriptions")
        }
      } catch (err) {
        console.error("Error fetching brand subscriptions:", err)
        setError("An error occurred while loading your brand subscriptions")
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
  }, [user])

  const handleToggleSubscription = async (brandName, currentStatus, subscriptionId) => {
    if (!user) return

    try {
      setUpdatingId(subscriptionId)
      const userId = user.uid || user._id || user.id
      const result = await toggleBrandSubscription(userId, brandName, currentStatus)

      if (result.success) {
        // Update the local state
        
        setSubscriptions((prevSubscriptions) =>
          prevSubscriptions.map((sub) => (sub.id === subscriptionId ? { ...sub, active: !currentStatus } : sub)),
        )
        //  const tagKey = `brand_${brandName.replace(/\s+/g, "_").toLowerCase()}`;
      // if (!isSubscribed) {
      //   await OneSignal.sendTags({ [tagKey]: "true" });
      // } else {
      //   await OneSignal.deleteTag(tagKey);
      // }
      } else {
        setError(`Failed to update subscription for ${brandName}`)
      }
    } catch (err) {
      console.error("Error toggling subscription:", err)
      setError(`An error occurred while updating your subscription for ${brandName}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // If we're still in the initial loading state, show a loading spinner
  if (loading) {
    return (
      <Container className="my-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your brand subscriptions...</p>
        </div>
      </Container>
    )
  }

  // If there's no user after loading is complete, show the login message
  if (!user) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          You must be logged in to view your brand subscriptions.
          <div className="mt-3">
            <Link to="/" className="btn btn-outline-primary">
              Go to Home
            </Link>
          </div>
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4">Brand Notifications</h2>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading subscriptions...</span>
          </Spinner>
          <p className="mt-3 text-muted">Loading your brand subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          You haven't subscribed to any brands yet.
          <div className="mt-3">
            <Link to="/" className="btn btn-outline-primary">
              Explore Brands
            </Link>
          </div>
        </Alert>
      ) : (
        <>
          <p className="text-muted mb-4">
            Manage notifications for your favorite brands. Toggle the switch to receive or stop notifications about new
            products and offers.
          </p>

          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <Row className="fw-bold">
                <Col xs={6}>Brand</Col>
                <Col xs={3} className="text-center">
                  Status
                </Col>
                <Col xs={3} className="text-center">
                  Notifications
                </Col>
              </Row>
            </Card.Header>
            <Card.Body className="p-0">
              {subscriptions.map((subscription) => (
                <Row key={subscription.id} className="border-bottom py-3 px-3 m-0 align-items-center">
                  <Col xs={6}>
                    <Link
                      to={`/brand/${subscription.brandName.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-decoration-none"
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <i className="bi bi-shop"></i>
                        </div>
                        <div>
                          <div className="fw-bold">{subscription.brandName}</div>
                          <div className="text-muted small">
                            Subscribed on {new Date(subscription.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Col>
                  <Col xs={3} className="text-center">
                    <Badge bg={subscription.active ? "success" : "secondary"} className="px-3 py-2">
                      {subscription.active ? "Active" : "Inactive"}
                    </Badge>
                  </Col>
                  <Col xs={3} className="text-center">
                    {updatingId === subscription.id ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Form.Check
                        type="switch"
                        id={`subscription-switch-${subscription.id}`}
                        checked={subscription.active}
                        onChange={() =>
                          handleToggleSubscription(subscription.brandName, subscription.active, subscription.id)
                        }
                        className="d-inline-block"
                      />
                    )}
                  </Col>
                </Row>
              ))}
            </Card.Body>
          </Card>

          <div className="mt-4 text-end">
            <Button variant="outline-secondary" as={Link} to="/">
              Back to Shopping
            </Button>
          </div>
        </>
      )}
    </Container>
  )
}

export default BrandNotificationsPage
