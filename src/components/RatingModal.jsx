import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { BsStar, BsStarFill } from "react-icons/bs";

const RatingModal = ({ show, onClose, onSubmit, product = {} }) => {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(null);
    const [loading, setLoading] = useState(false)

    const handleSubmit = () => {
        setLoading(true)
        onSubmit(rating);
        setTimeout(() => {
            setLoading(false)
            setRating(0);
            onClose();
        }, 1500)

    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Your Order has done</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <div className="mb-3">
                    {/* {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            style={{ fontSize: "2rem", cursor: "pointer", color: "#ffc107" }}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {rating >= star || hovered >= star ? <BsStarFill /> : <BsStar />}
                        </span>
                    ))} */}
                    <h3>Thank you for your order</h3>
                </div>
               
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Ok
                </Button>
                {/* <Button variant="primary" onClick={handleSubmit} disabled={rating === 0}>
                    {loading ? "Submitting..." : "Submit Rating"}
                </Button> */}
            </Modal.Footer>
        </Modal>
    );
};

export default RatingModal;
