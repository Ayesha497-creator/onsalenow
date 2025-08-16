import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from pydantic import BaseModel

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load and preprocess data
CSV_PATH = 'on-sale-now-dd434-default-rtdb-products-export (1) (19).csv'
df = pd.read_csv(CSV_PATH)
df['description'] = df['description'].fillna('') + ' ' + df['name'].fillna('')
df['id'] = df['id'].fillna(-1).astype(str)

# TF-IDF Vectorization
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df['description'])

# Clustering
n_clusters = 10
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(tfidf_matrix)

class ForYouSubscribedRequest(BaseModel):
    brand_names: list = []
    category_names: list = []
    top_n: int = 10

@app.post("/recommendations/for-you-subscribed")
def recommend_for_you_subscribed(req: ForYouSubscribedRequest):
    brand_names = [b.lower().strip() for b in (req.brand_names or [])]
    category_names = [c.lower().strip() for c in (req.category_names or [])]
    top_n = req.top_n or 10

    # Lowercase columns for matching
    df['brand_lower'] = df['brand'].str.lower().str.strip()
    df['category_lower'] = df['category'].str.lower().str.strip()

    filtered_df = df[
        (df['brand_lower'].isin(brand_names)) |
        (df['category_lower'].isin(category_names))
    ]

    if filtered_df.empty:
        return []

    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(filtered_df['description'])

    recommendations = filtered_df.sample(n=min(top_n, len(filtered_df)))[['id', 'name', 'description', 'image', 'price', 'brand', 'category']].to_dict(orient='records')
    return recommendations

@app.get("/recommend/{product_id}")
def recommend(product_id: str, top_n: int = 5):
    if product_id not in df['id'].values:
        raise HTTPException(status_code=404, detail="Product not found")
    idx = df.index[df['id'] == product_id][0]
    cosine_sim = cosine_similarity(tfidf_matrix[idx], tfidf_matrix).flatten()
    # Exclude the product itself
    similar_indices = cosine_sim.argsort()[-top_n-1:-1][::-1]
    recommendations = df.iloc[similar_indices][['id', 'name', 'description', 'image', 'price']].to_dict(orient='records')
    return recommendations

@app.get("/recommendations/home")
def home_recommendations(top_n: int = 10):
    # Return random or top products (e.g., by stock or sold)
    top_products = df.sample(n=top_n)[['id', 'name', 'description', 'image', 'price']].to_dict(orient='records')
    return top_products 

@app.get("/recommendations/category")
def recommend_by_category(category: str, top_n: int = 8):
    filtered = df[df['category'].str.lower().str.contains(category.lower())]
    if filtered.empty:
        return []
    return filtered.sample(n=min(top_n, len(filtered)))[['id', 'name', 'description', 'image', 'price', 'brand', 'category']].to_dict(orient='records') 