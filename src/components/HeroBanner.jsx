import { Carousel, Container } from "react-bootstrap"

const HeroBanner = () => {
  const banners = [
    {
      id: 1,
      imageUrl: "https://i.pinimg.com/1200x/fc/45/3e/fc453e2020416cee8cbf22b8d1087e98.jpg",
      alt: "Summer Collection Sale",
    },
    {
      id: 2,
      imageUrl: "https://i.pinimg.com/1200x/f5/1f/8e/f51f8eebd248d7693dece23070145661.jpg",
      alt: "New Arrivals",
    },
    {
      id: 3,
      imageUrl: "https://i.pinimg.com/1200x/d3/ca/57/d3ca5777ffc40855d995b83d4f948fea.jpg",
      alt: "Exclusive Brands",
    },
  ]

  return (
    <Container fluid className="p-0 mb-4">
      <Carousel fade className="hero-banner">
        {banners.map((banner) => (
          <Carousel.Item key={banner.id}>
            <div className="banner-container" style={{ height: "60vh" }}>
              <img
                className="d-block w-100 h-100"
                src={banner.imageUrl || "/placeholder.svg"}
                alt={banner.alt}
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </Container>
  )
}

export default HeroBanner
