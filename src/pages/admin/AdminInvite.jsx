"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Alert, Spinner, Table } from "react-bootstrap"
import { generateInviteCode } from "../../firebase/adminAuth"
import AdminSidebar from "../../components/admin/AdminSidebar"
import AdminHeader from "../../components/admin/AdminHeader"

const AdminInvite = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    // Get admin user from localStorage
    const storedAdmin = localStorage.getItem("adminUser")
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin))
      } catch (error) {
        console.error("Error parsing admin user:", error)
      }
    }
  }, [])

  const handleGenerateInvite = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!adminUser || !adminUser.uid) {
        throw new Error("Admin user not found")
      }

      const result = await generateInviteCode(adminUser.uid)
      if (result.success) {
        setInviteCode(result.inviteCode)
        setSuccess(true)
      } else {
        setError(result.error || "Failed to generate invite code")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(inviteCode)
      .then(() => {
        alert("Invite code copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  return (
    <div className="admin-dashboard d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <AdminHeader />
        <Container fluid className="py-4 px-4">
          <h2 className="mb-4">Admin Invitations</h2>

          <Row>
            <Col lg={6} className="mb-4">
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Generate Invite Code</h5>
                </Card.Header>
                <Card.Body>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && (
                    <Alert variant="success">
                      <i className="bi bi-check-circle me-2"></i>
                      Invite code generated successfully!
                    </Alert>
                  )}

                  <p>
                    Generate an invite code to allow new administrators to register. Share this code only with trusted
                    individuals.
                  </p>

                  <div className="d-flex align-items-center mb-3">
                    <Button variant="primary" onClick={handleGenerateInvite} disabled={loading} className="me-3">
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-key me-2"></i>
                          Generate Invite Code
                        </>
                      )}
                    </Button>
                  </div>

                  {inviteCode && (
                    <div className="mt-4">
                      <h6>Your Invite Code:</h6>
                      <div className="d-flex align-items-center">
                        <code className="bg-light p-2 flex-grow-1 me-2">{inviteCode}</code>
                        <Button variant="outline-secondary" size="sm" onClick={copyToClipboard}>
                          <i className="bi bi-clipboard"></i>
                        </Button>
                      </div>
                      <small className="text-muted mt-2 d-block">
                        This code can be used to register a new admin account.
                      </small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Recent Invitations</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Generated By</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <code>ONSALENOW-ADMIN-2023</code>
                        </td>
                        <td>admin@example.com</td>
                        <td>{new Date().toLocaleDateString()}</td>
                        <td>
                          <Badge bg="success">Active</Badge>
                        </td>
                      </tr>
                      {/* In a real app, you would map through invitation records from the database */}
                      <tr>
                        <td>
                          <code>ONSALENOW-ADMIN-2022</code>
                        </td>
                        <td>admin@example.com</td>
                        <td>{new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                        <td>
                          <Badge bg="secondary">Expired</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Admin Registration Instructions</h5>
                </Card.Header>
                <Card.Body>
                  <ol>
                    <li>Generate a new invite code using the button above.</li>
                    <li>Share the invite code with the person you want to make an administrator.</li>
                    <li>
                      Ask them to visit <code>{window.location.origin}/admin/signup</code> to create their account.
                    </li>
                    <li>They will need to enter the invite code during registration.</li>
                    <li>Once registered, they will have full admin access to the system.</li>
                  </ol>
                  <Alert variant="warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Only share invite codes with trusted individuals. Administrators have full access to the system.
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  )
}

export default AdminInvite
