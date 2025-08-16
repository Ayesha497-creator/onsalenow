"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Spinner, Container } from "react-bootstrap"
import { logoutAdmin } from "../../firebase/adminAuth"

const AdminLogout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const performLogout = async () => {
      await logoutAdmin()
      navigate("/admin")
    }

    performLogout()
  }, [navigate])

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Logging out...</p>
      </div>
    </Container>
  )
}

export default AdminLogout
