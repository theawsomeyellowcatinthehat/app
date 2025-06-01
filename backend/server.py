from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
import base64
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class CaseType(str, Enum):
    CIVIL = "civil"
    CRIMINAL = "criminal"

class CaseStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    CLOSED = "closed"
    SETTLED = "settled"
    DISMISSED = "dismissed"

class UserRole(str, Enum):
    ATTORNEY = "attorney"
    JUDGE = "judge"
    CLERK = "clerk"
    PARALEGAL = "paralegal"

class DocumentCategory(str, Enum):
    PLEADING = "pleading"
    MOTION = "motion"
    ORDER = "order"
    EVIDENCE = "evidence"
    CORRESPONDENCE = "correspondence"
    CONTRACT = "contract"
    OTHER = "other"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: UserRole
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    role: UserRole
    phone: Optional[str] = None

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    category: DocumentCategory
    file_data: str  # base64 encoded
    file_type: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    case_id: str

class DocumentCreate(BaseModel):
    filename: str
    category: DocumentCategory
    file_data: str
    file_type: str
    uploaded_by: str
    case_id: str

class CourtDate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    date: datetime
    court_name: str
    judge_name: Optional[str] = None
    hearing_type: str
    notes: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CourtDateCreate(BaseModel):
    case_id: str
    date: datetime
    court_name: str
    judge_name: Optional[str] = None
    hearing_type: str
    notes: Optional[str] = None
    priority: Priority = Priority.MEDIUM

class Case(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_number: str
    title: str
    case_type: CaseType
    status: CaseStatus
    client_id: str
    assigned_attorney: str
    court_name: str
    judge_name: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CaseCreate(BaseModel):
    case_number: str
    title: str
    case_type: CaseType
    status: CaseStatus = CaseStatus.ACTIVE
    client_id: str
    assigned_attorney: str
    court_name: str
    judge_name: Optional[str] = None
    description: Optional[str] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[CaseStatus] = None
    assigned_attorney: Optional[str] = None
    court_name: Optional[str] = None
    judge_name: Optional[str] = None
    description: Optional[str] = None

# User routes
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# Client routes
@api_router.post("/clients", response_model=Client)
async def create_client(client: ClientCreate):
    client_dict = client.dict()
    client_obj = Client(**client_dict)
    await db.clients.insert_one(client_obj.dict())
    return client_obj

@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find().to_list(1000)
    return [Client(**client) for client in clients]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return Client(**client)

# Case routes
@api_router.post("/cases", response_model=Case)
async def create_case(case: CaseCreate):
    # Check if client exists
    client = await db.clients.find_one({"id": case.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check if attorney exists
    attorney = await db.users.find_one({"id": case.assigned_attorney})
    if not attorney:
        raise HTTPException(status_code=404, detail="Attorney not found")
    
    case_dict = case.dict()
    case_obj = Case(**case_dict)
    await db.cases.insert_one(case_obj.dict())
    return case_obj

@api_router.get("/cases", response_model=List[Case])
async def get_cases():
    cases = await db.cases.find().sort("created_at", -1).to_list(1000)
    return [Case(**case) for case in cases]

@api_router.get("/cases/{case_id}", response_model=Case)
async def get_case(case_id: str):
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return Case(**case)

@api_router.put("/cases/{case_id}", response_model=Case)
async def update_case(case_id: str, case_update: CaseUpdate):
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    update_data = {k: v for k, v in case_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.cases.update_one({"id": case_id}, {"$set": update_data})
    updated_case = await db.cases.find_one({"id": case_id})
    return Case(**updated_case)

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str):
    result = await db.cases.delete_one({"id": case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Also delete related court dates and documents
    await db.court_dates.delete_many({"case_id": case_id})
    await db.documents.delete_many({"case_id": case_id})
    
    return {"message": "Case deleted successfully"}

# Court date routes
@api_router.post("/court-dates", response_model=CourtDate)
async def create_court_date(court_date: CourtDateCreate):
    # Check if case exists
    case = await db.cases.find_one({"id": court_date.case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    court_date_dict = court_date.dict()
    court_date_obj = CourtDate(**court_date_dict)
    await db.court_dates.insert_one(court_date_obj.dict())
    return court_date_obj

@api_router.get("/court-dates", response_model=List[CourtDate])
async def get_court_dates():
    court_dates = await db.court_dates.find().sort("date", 1).to_list(1000)
    return [CourtDate(**court_date) for court_date in court_dates]

@api_router.get("/court-dates/case/{case_id}", response_model=List[CourtDate])
async def get_court_dates_by_case(case_id: str):
    court_dates = await db.court_dates.find({"case_id": case_id}).sort("date", 1).to_list(1000)
    return [CourtDate(**court_date) for court_date in court_dates]

@api_router.delete("/court-dates/{court_date_id}")
async def delete_court_date(court_date_id: str):
    result = await db.court_dates.delete_one({"id": court_date_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Court date not found")
    return {"message": "Court date deleted successfully"}

# Document routes
@api_router.post("/documents", response_model=Document)
async def create_document(document: DocumentCreate):
    # Check if case exists
    case = await db.cases.find_one({"id": document.case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    document_dict = document.dict()
    document_obj = Document(**document_dict)
    await db.documents.insert_one(document_obj.dict())
    return document_obj

@api_router.get("/documents/case/{case_id}", response_model=List[Document])
async def get_documents_by_case(case_id: str):
    documents = await db.documents.find({"case_id": case_id}).sort("uploaded_at", -1).to_list(1000)
    return [Document(**document) for document in documents]

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

# Dashboard/Analytics routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_cases = await db.cases.count_documents({})
    active_cases = await db.cases.count_documents({"status": "active"})
    upcoming_dates = await db.court_dates.count_documents({"date": {"$gte": datetime.utcnow()}})
    total_clients = await db.clients.count_documents({})
    
    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "upcoming_court_dates": upcoming_dates,
        "total_clients": total_clients
    }

@api_router.get("/dashboard/upcoming-dates")
async def get_upcoming_court_dates():
    # Get court dates for the next 30 days
    from datetime import timedelta
    end_date = datetime.utcnow() + timedelta(days=30)
    
    court_dates = await db.court_dates.find({
        "date": {"$gte": datetime.utcnow(), "$lte": end_date}
    }).sort("date", 1).to_list(50)
    
    # Populate with case information
    enriched_dates = []
    for court_date in court_dates:
        case = await db.cases.find_one({"id": court_date["case_id"]})
        if case:
            court_date["case_title"] = case["title"]
            court_date["case_number"] = case["case_number"]
        enriched_dates.append(court_date)
    
    return enriched_dates

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
