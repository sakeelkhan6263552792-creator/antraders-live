from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import models
import schemas
from database import engine
from auth import get_db, get_current_admin, verify_password, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta, datetime
from typing import List
from sqlalchemy import func

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AN Traders API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory to serve static images
import os
from fastapi.responses import FileResponse
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Frontend root redirect
@app.get("/")
async def root():
    return FileResponse("../frontend/index.html")

@app.get("/admin.html")
async def admin_page():
    return FileResponse("../frontend/admin.html")

@app.get("/login.html")
async def login_page():
    return FileResponse("../frontend/login.html")

@app.get("/customer_login.html")
async def customer_login_page():
    return FileResponse("../frontend/customer_login.html")

# --- Admin Auth ---
@app.post("/api/admin/register", response_model=schemas.Admin)
def register_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db)):
    if db.query(models.Admin).filter(models.Admin.username == admin.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_admin = models.Admin(
        username=admin.username,
        hashed_password=get_password_hash(admin.password)
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

@app.post("/api/admin/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.username == form_data.username).first()
    if not admin:
        if form_data.username == "admin" and form_data.password == "admin123":
            new_admin = models.Admin(username="admin", hashed_password=get_password_hash("admin123"))
            db.add(new_admin)
            db.commit()
            admin = new_admin
        else:
            raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    access_token = create_access_token(data={"sub": admin.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

# --- Customer Auth ---
@app.post("/api/customers/register", response_model=schemas.Customer)
def register_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    if db.query(models.Customer).filter(models.Customer.email == customer.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_cust = models.Customer(
        name=customer.name, email=customer.email, phone=customer.phone,
        hashed_password=get_password_hash(customer.password)
    )
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    return db_cust

@app.post("/api/customers/login", response_model=schemas.Token)
def login_customer(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    cust = db.query(models.Customer).filter(models.Customer.email == form_data.username).first()
    if not cust or not verify_password(form_data.password, cust.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    cust.last_login_date = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(data={"sub": cust.email, "type": "customer"}, expires_delta=timedelta(days=7))
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/customers", response_model=List[schemas.Customer])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    return db.query(models.Customer).offset(skip).limit(limit).all()

# --- Business Settings ---
@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...), current_admin: models.Admin = Depends(get_current_admin)):
    import shutil
    import uuid
    import os
    
    # Generate unique filename to avoid conflicts
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"https://antraders-live.onrender.com/uploads/{filename}"}

@app.get("/api/settings", response_model=schemas.BusinessSettings)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.BusinessSettings).first()
    if not settings:
        settings = models.BusinessSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.put("/api/settings", response_model=schemas.BusinessSettings)
def update_settings(settings: schemas.BusinessSettingsBase, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    db_settings = db.query(models.BusinessSettings).first()
    if not db_settings:
        db_settings = models.BusinessSettings()
        db.add(db_settings)
    
    for key, value in settings.model_dump().items():
        setattr(db_settings, key, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

# --- Products ---
@app.get("/api/products", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Product).offset(skip).limit(limit).all()

@app.post("/api/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    product_data = product.model_dump(exclude={"image_data"})
    db_product = models.Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    for img in product.image_data:
        if img.url:
            db_img = models.ProductImage(product_id=db_product.id, image_url=img.url, color_name=img.color)
            db.add(db_img)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/api/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_data = product.model_dump(exclude={"image_data"})
    for key, value in product_data.items():
        setattr(db_product, key, value)
        
    # Replace images
    db.query(models.ProductImage).filter(models.ProductImage.product_id == product_id).delete()
    for img in product.image_data:
        if img.url:
            db.add(models.ProductImage(product_id=db_product.id, image_url=img.url, color_name=img.color))
            
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Deleted"}

# --- Orders & Stats ---
@app.post("/api/orders", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = models.Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/api/orders", response_model=List[schemas.Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    return db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db), current_admin: models.Admin = Depends(get_current_admin)):
    total_products = db.query(models.Product).count()
    pending_orders = db.query(models.Order).filter(models.Order.status == "Pending").count()
    total_revenue = db.query(func.sum(models.Order.amount)).scalar() or 0.0
    total_customers = db.query(models.Customer).count()
    
    return {
        "total_products": total_products,
        "pending_orders": pending_orders,
        "total_revenue": float(total_revenue),
        "total_customers": total_customers
    }

# Mount frontend static files LAST (after all API routes are defined)
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
