import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { updateUserProfile } from "../../firebase/auth";
import { updateSellerProfile } from "../../firebase/sellerAuth";
import { toggleSellerBlockStatus } from "../../firebase/sellerAuth";
import { useNavigate } from "react-router-dom"
import AdminSidebar from "../../components/admin/AdminSidebar"
import AdminHeader from "../../components/admin/AdminHeader"
import { Container } from "react-bootstrap";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [updatingUserUid, setUpdatingUserUid] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const buyerSnap = await get(ref(database, "Buyer"));
                const sellerSnap = await get(ref(database, "Seller"));

                const buyerData = buyerSnap.exists()
                    ? Object.entries(buyerSnap.val()).map(([uid, data]) => ({
                        ...data,
                        uid,
                        type: "Buyer",
                        name: `${data.firstName ?? ""} ${data.lastName ?? ""}`,
                        email: data.email,
                        status: data.status || "pending",
                    }))
                    : [];

                const sellerData = sellerSnap.exists()
                    ? Object.entries(sellerSnap.val()).map(([uid, data]) => ({
                        ...data,
                        uid,
                        type: "Seller",
                        name: `${data.firstName} ${data.lastName}`,
                        email: data.email,
                        status: data.status || "pending",
                    }))
                    : [];

                setUsers([...buyerData, ...sellerData]);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            }
        };

        fetchUsers();
    }, []);

    const handleStatusChange = async (user, newStatus) => {
        try {
            setUpdatingUserUid(user.uid);
            const updateFn =
                user.type === "Buyer" ? updateUserProfile : toggleSellerBlockStatus;
            const result = await updateFn(user.uid, { status: newStatus });

            if (result.success) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.uid === user.uid && u.type === user.type
                            ? { ...u, status: newStatus }
                            : u
                    )
                );
            } else {
                alert("Failed to update status: " + result.error);
            }
        } catch (err) {
            console.error("Error updating user status:", err);
        } finally {
            setUpdatingUserUid(null);
        }
    };

    const renderActions = (user) => {
        const status = user.status;

        return (
            <>
                {status !== "approved" && (
                    <button
                        className="btn btn-success btn-sm me-1"
                        onClick={() => handleStatusChange(user, "approved")}
                    >
                        Approve
                    </button>
                )}
                {status !== "blocked" && (
                    <button
                        className="btn btn-danger btn-sm me-1"
                        onClick={() => handleStatusChange(user, "blocked")}
                    >
                        Block
                    </button>
                )}
                {status === "blocked" && (
                    <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleStatusChange(user, "unblocked")}
                    >
                        Unblock
                    </button>
                )}
            </>
        );
    };

    return (
        <div className="admin-dashboard d-flex" style={{ width: "100%", overflow: "hidden" }}>
            <AdminSidebar />
            <div className="flex-grow-1" style={{ overflow: "auto", height: "100vh" }}>
                <AdminHeader />
                <Container fluid className="py-4 px-4">
                    <div className="container mt-5">
                        <h2>User Management</h2>
                        <table className="table table-bordered table-hover mt-3">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={`${user.type}-${user.uid}`}>
                                            <td>{user?.name}</td>
                                            {/* <td>{user?.uid}</td> */}
                                            <td>{user?.email}</td>
                                            <td>{user?.type}</td>
                                            <td>{user?.status}</td>
                                            <td>
                                                {renderActions(user)}
                                                {user.uid == updatingUserUid ?
                                                    <div className="spinner-border spinner-border-sm text-primary ms-2" role="status" /> : ""}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            Loading users...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Container>
            </div>
        </div>
    );
};

export default AdminUsers;
