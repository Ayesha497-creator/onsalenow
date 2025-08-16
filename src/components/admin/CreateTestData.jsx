import React, { useState } from 'react';
import { Button, Alert, Card, Form, Row, Col } from 'react-bootstrap';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

const CreateTestData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    brandName: "",
    percentage: "",
    stockPerProduct: "",
    password: ""
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Find existing seller by email
  const findSellerByEmail = async (email) => {
    try {
      const sellersRef = ref(database, "Seller");
      const snapshot = await get(sellersRef);
      
      if (snapshot.exists()) {
        const sellers = snapshot.val();
        
        // Find seller by email
        for (const [sellerId, sellerData] of Object.entries(sellers)) {
          if (sellerData.email === email) {
            return { sellerId, sellerData };
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error finding seller:", error);
      return null;
    }
  };

  // Update existing seller's products sold quantities
  const updateSellerProductsSold = async (sellerId, newPercentage, stockPerProduct) => {
    try {
      const productsRef = ref(database, "products");
      const snapshot = await get(productsRef);
      
      if (snapshot.exists()) {
        const products = snapshot.val();
        const soldPerProduct = Math.round((stockPerProduct * newPercentage) / 100);
        
        // Find products for this seller
        const sellerProducts = [];
        for (const [productId, productData] of Object.entries(products)) {
          if (productData.sellerId === sellerId) {
            sellerProducts.push({ productId, productData });
          }
        }
        
        if (sellerProducts.length === 0) {
          return 0;
        }
        
        // Update each product's sold quantity
        const updatePromises = sellerProducts.map(({ productId }) => {
          const productRef = ref(database, `products/${productId}`);
          return set(productRef, {
            ...products[productId],
            sold: soldPerProduct
          });
        });
        
        await Promise.all(updatePromises);
        return sellerProducts.length;
      }
      return 0;
    } catch (error) {
      console.error("Error updating products:", error);
      throw error;
    }
  };

  // Delete seller and all their products
  const deleteSellerAndProducts = async (email) => {
    try {
      // Find seller by email
      const existingSeller = await findSellerByEmail(email);
      
      if (!existingSeller) {
        throw new Error('No seller found with this email address');
      }

      // Delete all products for this seller
      const productsRef = ref(database, "products");
      const snapshot = await get(productsRef);
      
      let productsDeleted = 0;
      if (snapshot.exists()) {
        const products = snapshot.val();
        
        // Find products for this seller
        const sellerProducts = [];
        for (const [productId, productData] of Object.entries(products)) {
          if (productData.sellerId === existingSeller.sellerId) {
            sellerProducts.push({ productId, productData });
          }
        }
        
        if (sellerProducts.length > 0) {
          // Delete each product
          const deletePromises = sellerProducts.map(({ productId }) => {
            const productRef = ref(database, `products/${productId}`);
            return set(productRef, null); // Delete product
          });
          
          await Promise.all(deletePromises);
          productsDeleted = sellerProducts.length;
        }
      }

      // Delete seller
      const sellerRef = ref(database, `Seller/${existingSeller.sellerId}`);
      await set(sellerRef, null);

      return {
        success: true,
        sellerId: existingSeller.sellerId,
        productsDeleted
      };
    } catch (error) {
      console.error("Error deleting seller:", error);
      throw error;
    }
  };

  const handleDeleteSeller = async () => {
    if (!formData.email) {
      setResult({
        success: false,
        message: 'Please enter an email address to delete'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const deleteResult = await deleteSellerAndProducts(formData.email);
      
      setResult({
        success: true,
        message: `Seller and products deleted successfully!`,
        details: {
          email: formData.email,
          sellerId: deleteResult.sellerId,
          productsDeleted: deleteResult.productsDeleted,
          action: 'deleted'
        }
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error deleting seller: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestSeller = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Validate inputs
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.brandName || !formData.percentage || !formData.stockPerProduct || !formData.password) {
        setResult({
          success: false,
          message: 'All fields are required'
        });
        return;
      }

      if (formData.percentage < 0 || formData.percentage > 100) {
        setResult({
          success: false,
          message: 'Percentage must be between 0 and 100'
        });
        return;
      }

      if (formData.stockPerProduct < 1) {
        setResult({
          success: false,
          message: 'Stock per product must be at least 1'
        });
        return;
      }

      if (formData.password.length < 6) {
        setResult({
          success: false,
          message: 'Password must be at least 6 characters'
        });
        return;
      }

      // Check if seller with this email already exists
      const existingSeller = await findSellerByEmail(formData.email);
      
      if (existingSeller) {
        // Update existing seller's products
        const productsUpdated = await updateSellerProductsSold(
          existingSeller.sellerId, 
          formData.percentage, 
          formData.stockPerProduct
        );

        // Update seller's email tracking attributes based on new percentage
        const sellerRef = ref(database, `Seller/${existingSeller.sellerId}`);
        const updatedSellerData = {
          ...existingSeller.sellerData,
          percentage: formData.percentage, // Update the percentage
          dateUpdated: new Date().toISOString()
          // Don't automatically set email flags - let the automatic email system handle them
        };
        await set(sellerRef, updatedSellerData);

        // Calculate new stats
        const totalStock = productsUpdated * formData.stockPerProduct;
        const totalSold = productsUpdated * Math.round((formData.stockPerProduct * formData.percentage) / 100);
        const percentSold = ((totalSold / totalStock) * 100).toFixed(1);

        setResult({
          success: true,
          message: `Existing seller updated successfully!`,
          details: {
            email: formData.email,
            totalStock,
            totalSold,
            percentSold,
            productsUpdated,
            sellerId: existingSeller.sellerId,
            action: 'updated',
            previousPercentage: existingSeller.sellerData.percentage || 0,
            newPercentage: formData.percentage
          }
        });
        return;
      }

      // Create new seller data
      const sellerId = `test_seller_${Date.now()}`;
      
      // Register seller in Firebase Authentication first
      let firebaseUid;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        firebaseUid = userCredential.user.uid;
        console.log('Seller registered in Firebase Auth:', formData.email, 'UID:', firebaseUid);
      } catch (error) {
        console.error('Error registering seller in Firebase Auth:', error);
        if (error.code === 'auth/email-already-in-use') {
          setResult({
            success: false,
            message: 'A seller with this email already exists. Please use a different email or update the existing seller.'
          });
          return;
        } else {
          setResult({
            success: false,
            message: `Error creating Firebase Auth account: ${error.message}`
          });
          return;
        }
      }

      const sellerData = {
        uid: firebaseUid, // Use Firebase Auth UID
        id: firebaseUid, // Use Firebase Auth UID for consistency
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        brandName: formData.brandName,
        password: formData.password, // Add password
        percentage: formData.percentage, // Track current percentage
        isFiftyPercentEmail: false, // Start as false, will be set to true after email is sent
        isSeventyPercentEmail: false, // Start as false, will be set to true after email is sent
        status: "approved",
        dateCreated: new Date().toISOString(),
        isTestUser: true
      }

      // Calculate sold quantity based on percentage
      const soldPerProduct = Math.round((formData.stockPerProduct * formData.percentage) / 100);

      // Create products with custom sales percentage
      const products = [
        {
          id: `product_1_${firebaseUid}`,
          name: "Premium Cotton T-Shirt",
          brand: formData.brandName,
          price: 1500,
          originalPrice: 2000,
          description: "High-quality cotton t-shirt with modern design",
          category: "men",
          stock: parseInt(formData.stockPerProduct),
          sold: soldPerProduct,
          sellerId: firebaseUid,
          image: "https://via.placeholder.com/300x400/3498db/ffffff?text=T-Shirt",
          keywords: ["men", "cotton", "t-shirt", "casual"],
          discountPercent: 25,
          onSale: true,
          createdAt: new Date().toISOString(),
          isSellerBlocked: false
        },
        {
          id: `product_2_${firebaseUid}`,
          name: "Denim Jeans",
          brand: formData.brandName,
          price: 2500,
          originalPrice: 3000,
          description: "Comfortable denim jeans for everyday wear",
          category: "men",
          stock: parseInt(formData.stockPerProduct),
          sold: soldPerProduct,
          sellerId: firebaseUid,
          image: "https://via.placeholder.com/300x400/2ecc71/ffffff?text=Jeans",
          keywords: ["men", "denim", "jeans", "casual"],
          discountPercent: 17,
          onSale: true,
          createdAt: new Date().toISOString(),
          isSellerBlocked: false
        },
        {
          id: `product_3_${firebaseUid}`,
          name: "Leather Jacket",
          brand: formData.brandName,
          price: 5000,
          originalPrice: 6000,
          description: "Stylish leather jacket for men",
          category: "men",
          stock: parseInt(formData.stockPerProduct),
          sold: soldPerProduct,
          sellerId: firebaseUid,
          image: "https://via.placeholder.com/300x400/e74c3c/ffffff?text=Jacket",
          keywords: ["men", "leather", "jacket", "formal"],
          discountPercent: 17,
          onSale: true,
          createdAt: new Date().toISOString(),
          isSellerBlocked: false
        }
      ];

      // Add seller to database using Firebase Auth UID
      await set(ref(database, `Seller/${firebaseUid}`), sellerData);
      console.log('Seller created in database:', firebaseUid, sellerData);

      // Add products to database
      for (const product of products) {
        await set(ref(database, `products/${product.id}`), product);
        console.log('Product created:', product.id, product);
      }

      // Small delay to ensure data is written to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate total stats
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const totalSold = products.reduce((sum, p) => sum + p.sold, 0);
      const percentSold = ((totalSold / totalStock) * 100).toFixed(1);

      console.log('Final stats:', { totalStock, totalSold, percentSold, productsCreated: products.length });

      setResult({
        success: true,
        message: `Test seller created successfully! ${formData.percentage >= 50 ? 'Automatic email notifications will be sent for threshold alerts.' : ''}`,
        details: {
          email: sellerData.email,
          totalStock,
          totalSold,
          percentSold,
          productsCreated: products.length,
          sellerId: firebaseUid,
          action: 'created'
        }
      });

    } catch (error) {
      console.error("Error creating test seller:", error);
      setResult({
        success: false,
        message: `Error creating test data: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Create Test Data</h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Create a test seller with custom email and sales percentage to test the email notification system.
        </p>
        
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter seller email"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Brand Name</Form.Label>
                <Form.Control
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleInputChange}
                  placeholder="Enter brand name"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>First Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sales Percentage (%) *</Form.Label>
                <Form.Control
                  type="number"
                  name="percentage"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  placeholder="Enter percentage (0-100)"
                  required
                />
                <Form.Text className="text-muted">
                  This will set the sold quantity for each product. (e.g., 70% = 70 sold out of 100 stock)
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Stock per Product</Form.Label>
                <Form.Control
                  type="number"
                  name="stockPerProduct"
                  value={formData.stockPerProduct}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password for demo user"
                />
                <Form.Text className="text-muted">Password for the demo user account</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <div className="mt-3">
            <Button 
              variant="primary" 
              onClick={createTestSeller}
              disabled={loading}
              className="me-2"
            >
              {loading ? 'Creating...' : 'Create/Update Test Seller'}
            </Button>
            
            <Button 
              variant="danger" 
              onClick={handleDeleteSeller}
              disabled={loading || !formData.email}
            >
              {loading ? 'Deleting...' : 'Delete Seller'}
            </Button>
          </div>
        </Form>

        {result && (
          <Alert variant={result.success ? 'success' : 'danger'} className="mt-3">
            <h6>{result.message}</h6>
            {result.success && result.details && (
              <div className="mt-2">
                <p><strong>Email:</strong> {result.details.email}</p>
                <p><strong>Seller ID:</strong> {result.details.sellerId}</p>
                <p><strong>Action:</strong> {
                  result.details.action === 'created' ? '🆕 Created new seller' : 
                  result.details.action === 'updated' ? '🔄 Updated existing seller' : 
                  result.details.action === 'deleted' ? '🗑️ Deleted seller and products' : 
                  'Unknown action'
                }</p>
                {result.details.action !== 'deleted' && (
                  <>
                    <p><strong>Total Stock:</strong> {result.details.totalStock}</p>
                    <p><strong>Total Sold:</strong> {result.details.totalSold}</p>
                    <p><strong>Percent Sold:</strong> {result.details.percentSold}%</p>
                    <p><strong>{result.details.action === 'created' ? 'Products Created' : 'Products Updated'}:</strong> {result.details.action === 'created' ? result.details.productsCreated : result.details.productsUpdated}</p>
                    {result.details.action === 'updated' && (
                      <>
                        <p><strong>Previous Percentage:</strong> {result.details.previousPercentage}%</p>
                        <p><strong>New Percentage:</strong> {result.details.newPercentage}%</p>
                      </>
                    )}
                    <p className="text-warning">
                      <strong>Status:</strong> {result.details.percentSold >= 70 ? '🔴 PAYMENT REQUIRED (70%+)' : result.details.percentSold >= 50 ? '🟡 WARNING (50%+)' : '🟢 OK'}
                    </p>
                  </>
                )}
                {result.details.action === 'deleted' && (
                  <p><strong>Products Deleted:</strong> {result.details.productsDeleted}</p>
                )}
              </div>
            )}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default CreateTestData; 