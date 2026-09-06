from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# ---- Admins ----
class AdminBase(BaseModel):
    username: str

class AdminCreate(AdminBase):
    password: str

class Admin(AdminBase):
    id: int
    model_config = {"from_attributes": True}

# ---- Product Images ----
class ProductImageBase(BaseModel):
    image_url: str
    color_name: Optional[str] = None

class ProductImageCreate(ProductImageBase):
    pass

class ProductImage(ProductImageBase):
    id: int
    product_id: int
    model_config = {"from_attributes": True}

# ---- Products ----
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    discount_rupees: Optional[float] = 0.0
    stock: Optional[int] = 0
    is_trending: Optional[bool] = False
    sizes: Optional[str] = None
    colors: Optional[str] = None

class ImageInput(BaseModel):
    url: str
    color: Optional[str] = None

class ProductCreate(ProductBase):
    image_data: Optional[List[ImageInput]] = []

class Product(ProductBase):
    id: int
    images: List[ProductImage] = []
    model_config = {"from_attributes": True}

# ---- Customers ----
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    password: str

class Customer(CustomerBase):
    id: int
    last_login_date: Optional[datetime] = None
    model_config = {"from_attributes": True}

# ---- Settings ----
class BusinessSettingsBase(BaseModel):
    business_name: str
    address: str
    phone: str
    email: str
    map_embed_url: Optional[str] = None
    ceo_name: Optional[str] = None
    partner_name: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    twitter_url: Optional[str] = None

class BusinessSettings(BusinessSettingsBase):
    id: int
    model_config = {"from_attributes": True}

# ---- Orders ----
class OrderBase(BaseModel):
    customer_name: str
    amount: float
    status: Optional[str] = "Pending"

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    model_config = {"from_attributes": True}
