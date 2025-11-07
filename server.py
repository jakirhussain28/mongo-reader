import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import uvicorn
from bson.objectid import ObjectId
from typing import Optional # <-- Import Optional

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
MONGO_URI = os.getenv("MONGO_URI")
# List of system databases to exclude from the UI
SYSTEM_DATABASES = ["admin", "local", "config"]

# --- FastAPI App Initialization ---
app = FastAPI()

# --- CORS Middleware ---
# Ensure your React app's port (e.g., 5173) is listed here
origins = [
    "https://mongoreader.vercel.app",
    "http://localhost:5000",
    "http://localhost:5001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MongoDB Client ---
# Initialize the client globally
try:
    client = MongoClient(MONGO_URI)
    # Test connection
    client.server_info()
    print(f"Successfully connected to MongoDB at {MONGO_URI}")
except Exception as e:
    print(f"Error: Could not connect to MongoDB. {e}")
    # In a real app, you might exit or handle this more gracefully
    client = None

# --- Helper Function ---
def serialize_document(doc):
    """
    Converts MongoDB documents (with ObjectId and datetime)
    into a JSON-serializable format.
    """
    serialized = {}
    for key, value in doc.items():
        # Check by TYPE, not by key name
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized

# --- API Endpoints ---

@app.get("/api/databases")
def get_databases_list():
    """
    Fetches the list of all non-system databases and their collections.
    This populates the sidebar in the frontend.
    """
    if client is None:
        raise HTTPException(status_code=500, detail="MongoDB connection not established")
        
    try:
        db_names = client.list_database_names()
        app_dbs = [db_name for db_name in db_names if db_name not in SYSTEM_DATABASES]
        
        response = []
        for db_name in app_dbs:
            db = client[db_name]
            collection_names = db.list_collection_names()
            # The frontend expects an array of objects with a 'name' key
            collections_list = [{"name": name} for name in collection_names]
            response.append({"name": db_name, "collections": collections_list})
            
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/databases/{db_name}/collections/{collection_name}")
def get_collection_documents(
    db_name: str, 
    collection_name: str,
    page: Optional[int] = 1,    # <-- NEW: Add page query parameter
    limit: Optional[int] = 50   # <-- NEW: Add limit query parameter
):
    """
    Fetches a paginated list of documents and the total count.
    """
    if client is None:
        raise HTTPException(status_code=500, detail="MongoDB connection not established")

    try:
        db = client[db_name]
        if collection_name not in db.list_collection_names():
            raise HTTPException(status_code=404, detail="Collection not found")
            
        collection = db[collection_name]
        
        # --- PAGINATION LOGIC ---
        # Get TOTAL count for all documents
        count = collection.count_documents({})
        
        # Calculate how many documents to skip
        skip = (page - 1) * limit
        
        # Find only the documents for the current page
        documents_cursor = collection.find({}).skip(skip).limit(limit)
        
        documents = [serialize_document(doc) for doc in documents_cursor]
        
        # Return total count + paged documents
        return {"count": count, "documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Run the server ---
if __name__ == "__main__":
    print("Starting FastAPI server on http://127.0.0.1:8008")
    uvicorn.run("server:app", host="127.0.0.1", port=8008, reload=True)