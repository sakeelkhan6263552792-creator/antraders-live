import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Set up database URL. Default to SQLite if none provided.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", os.getenv("MYSQL_URL", "sqlite:///./antraders.db"))

# SQLAlchemy 1.4+ requires postgresql:// instead of postgres://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

# If using SQLite, we need connect_args={"check_same_thread": False}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # For pg8000, we need to strip sslmode and pass ssl_context
    connect_args = {}
    if SQLALCHEMY_DATABASE_URL.startswith("postgresql+pg8000://"):
        if "?" in SQLALCHEMY_DATABASE_URL:
            SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.split("?")[0]
        import ssl
        connect_args={"ssl_context": ssl.create_default_context()}
        
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
