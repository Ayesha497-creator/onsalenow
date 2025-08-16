// SearchModal.js
import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

const priceOptions = [
  { label: "Below 2000", value: "<2000" },
  { label: "2000 - 4000", value: "2000-4000" },
  { label: "4000 - 6000", value: "4000-6000" },
  { label: "6000 - 10000", value: "6000-10000" },
  { label: "Above 10000", value: ">10000" },
];

const sizeOptions = ["S", "M", "L", "XL"];
const categoryOptions = ["Men", "Women", "Kids", "Footwear", "Accessories", "Beauty"];

const SearchModal = ({ show, onClose, onApply }) => {
  const [query, setQuery] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleSizeChange = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleApply = () => {
    onApply({ query, priceRange, selectedSizes, selectedCategories });
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Search & Filters</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Search</Form.Label>
            <Form.Control
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands, etc."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Price</Form.Label>
            <Row>
              {priceOptions.map((option) => (
                <Col xs={6} md={4} key={option.value} className="mb-2">
                  <Form.Check
                    type="radio"
                    label={option.label}
                    name="price"
                    value={option.value}
                    checked={priceRange === option.value}
                    onChange={(e) => setPriceRange(e.target.value)}
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sizes</Form.Label>
            <Row>
              {sizeOptions.map((size) => (
                <Col xs={3} key={size}>
                  <Form.Check
                    type="checkbox"
                    label={size}
                    checked={selectedSizes.includes(size)}
                    onChange={() => handleSizeChange(size)}
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Categories</Form.Label>
            <Row>
              {categoryOptions.map((cat) => (
                <Col xs={6} md={4} key={cat} className="mb-2">
                  <Form.Check
                    type="checkbox"
                    label={cat}
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApply}>
          Apply Filters
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SearchModal;
