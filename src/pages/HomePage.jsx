"use client"

import HeroBanner from "../components/HeroBanner"
import BrandSection from "../components/BrandSection"
import CategorySection from "../components/CategorySection"
import DealsSection from "../components/DealsSection"
import FeaturedProducts from "../components/FeaturedProducts"
import RecommendedProducts from "../components/RecommendedProducts"

const HomePage = () => {
  return (
    <>
      <HeroBanner />
      <BrandSection />
      <CategorySection />
      <DealsSection />
      <RecommendedProducts />
      <FeaturedProducts />
    
    </>
  )
}

export default HomePage
