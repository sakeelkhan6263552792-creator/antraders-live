from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255))

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50), nullable=True)
    hashed_password = Column(String(255))
    last_login_date = Column(DateTime, nullable=True)

class BusinessSettings(Base):
    __tablename__ = "business_settings"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String(255), default="AN Traders")
    address = Column(String(500), default="Ahmedabad, Gujarat")
    phone = Column(String(50), default="+91 98765 43210")
    email = Column(String(255), default="contact@antraders.com")
    map_embed_url = Column(Text, nullable=True)
    ceo_name = Column(String(255), nullable=True)
    partner_name = Column(String(255), nullable=True)
    facebook_url = Column(String(500), nullable=True)
    instagram_url = Column(String(500), nullable=True)
    youtube_url = Column(String(500), nullable=True)
    twitter_url = Column(String(500), nullable=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    price = Column(Float)
    discount_rupees = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    is_trending = Column(Boolean, default=False)
    sizes = Column(String(255), nullable=True)  # Comma separated e.g., "S, M, L"
    colors = Column(String(255), nullable=True) # Comma separated e.g., "Red, Blue"
    
    # Relationships
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    image_url = Column(String(500))
    color_name = Column(String(50), nullable=True)

    product = relationship("Product", back_populates="images")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(255))
    amount = Column(Float)
    status = Column(String(50), default="Pending")
