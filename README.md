# OnSaleNow - E-commerce Platform with AI Recommendations

OnSaleNow is a comprehensive e-commerce platform that helps buyers discover ongoing sales and discounts across different brands and product categories. It also enables sellers to promote their sales and reach more customers effectively.

## Features

🔑 **Authentication** – Secure login & registration using Firebase Authentication  
🛒 **Buyer Module** – Browse and search for sales by brand, category, or price range  
🏬 **Seller Module** – Post sales details with product information and offers  
📊 **Admin Panel** – Manage users, sellers, and notifications (built with Tailwind CSS)  
🔔 **Smart Notifications** – Configurable thresholds for sales updates with logs  
📍 **Local Brand Profiling** – Support for small/local sellers  
🤖 **AI-Powered Recommendations** – Machine learning-based product suggestions using FastAPI

## Tech Stack

**Frontend:** React.js (Buyer & Seller modules) + Tailwind CSS (Admin Panel)  
**Backend:** FastAPI (Python) + Node.js + MongoDB  
**Authentication:** Firebase Authentication  
**AI/ML:** Scikit-learn, TF-IDF, K-Means clustering, Cosine similarity

## Project Structure

- `src/` - React frontend components and pages
- `app.py` - FastAPI backend with ML recommendation system
- `functions/` - Firebase Cloud Functions
- `public/` - Static assets and images

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. Set up Firebase configuration
3. Run the development server:
   ```bash
   npm run dev
   ```

4. Run the FastAPI backend:
   ```bash
   python app.py
   ```

## API Endpoints

- `POST /recommendations/for-you-subscribed` - Get personalized recommendations
- `GET /recommend/{product_id}` - Get similar products
- `GET /recommendations/home` - Get home page recommendations
- `GET /recommendations/category` - Get category-based recommendations
