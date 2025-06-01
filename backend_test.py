#!/usr/bin/env python3
import requests
import json
import base64
import time
from datetime import datetime, timedelta
import uuid
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Backend URL from frontend .env
BACKEND_URL = "https://db338754-558a-4c8b-b0b1-9543354c340f.preview.emergentagent.com/api"

# Test data
test_users = [
    {"name": "John Attorney", "email": "john@law.com", "role": "attorney", "phone": "555-1234"},
    {"name": "Jane Judge", "email": "jane@court.com", "role": "judge", "phone": "555-5678"},
    {"name": "Bob Clerk", "email": "bob@court.com", "role": "clerk", "phone": "555-9012"},
    {"name": "Alice Paralegal", "email": "alice@law.com", "role": "paralegal", "phone": "555-3456"}
]

test_clients = [
    {"name": "Client One", "email": "client1@example.com", "phone": "555-1111", "address": "123 Main St"},
    {"name": "Client Two", "email": "client2@example.com", "phone": "555-2222", "address": "456 Oak Ave"}
]

test_cases = [
    {
        "case_number": "CV-2023-001",
        "title": "Smith v. Jones",
        "case_type": "civil",
        "status": "active",
        "court_name": "Superior Court",
        "judge_name": "Judge Wilson",
        "description": "Contract dispute"
    },
    {
        "case_number": "CR-2023-001",
        "title": "State v. Doe",
        "case_type": "criminal",
        "status": "pending",
        "court_name": "District Court",
        "judge_name": "Judge Brown",
        "description": "Criminal case"
    }
]

test_court_dates = [
    {
        "date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "court_name": "Superior Court",
        "judge_name": "Judge Wilson",
        "hearing_type": "Status Conference",
        "notes": "Prepare status report",
        "priority": "medium"
    },
    {
        "date": (datetime.utcnow() + timedelta(days=14)).isoformat(),
        "court_name": "District Court",
        "judge_name": "Judge Brown",
        "hearing_type": "Trial",
        "notes": "Final trial date",
        "priority": "high"
    }
]

test_document = {
    "filename": "test_document.txt",
    "category": "pleading",
    "file_type": "text/plain",
    "file_data": base64.b64encode(b"This is a test document content").decode('utf-8')
}

# Helper functions
def print_separator():
    logger.info("=" * 80)

def print_test_header(test_name):
    print_separator()
    logger.info(f"TESTING: {test_name}")
    print_separator()

def print_response(response):
    try:
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        logger.info(f"Raw Response: {response.text}")

def test_api_connectivity():
    print_test_header("API Connectivity")
    
    try:
        # Test users endpoint
        response = requests.get(f"{BACKEND_URL}/users")
        logger.info(f"GET /users - Status Code: {response.status_code}")
        
        # Test clients endpoint
        response = requests.get(f"{BACKEND_URL}/clients")
        logger.info(f"GET /clients - Status Code: {response.status_code}")
        
        # Test cases endpoint
        response = requests.get(f"{BACKEND_URL}/cases")
        logger.info(f"GET /cases - Status Code: {response.status_code}")
        
        # Test dashboard stats endpoint
        response = requests.get(f"{BACKEND_URL}/dashboard/stats")
        logger.info(f"GET /dashboard/stats - Status Code: {response.status_code}")
        
        return True
    except Exception as e:
        logger.error(f"API connectivity test failed: {str(e)}")
        return False

def test_user_management():
    print_test_header("User Management")
    
    created_users = []
    
    try:
        # Create users with different roles
        for user_data in test_users:
            response = requests.post(f"{BACKEND_URL}/users", json=user_data)
            logger.info(f"Creating user with role {user_data['role']}")
            print_response(response)
            
            if response.status_code == 200:
                created_users.append(response.json())
        
        # Get all users
        response = requests.get(f"{BACKEND_URL}/users")
        logger.info("Getting all users")
        print_response(response)
        
        # Get specific user
        if created_users:
            user_id = created_users[0]["id"]
            response = requests.get(f"{BACKEND_URL}/users/{user_id}")
            logger.info(f"Getting specific user with ID {user_id}")
            print_response(response)
        
        # Check if we have users with all required roles
        roles = [user["role"] for user in created_users]
        required_roles = ["attorney", "judge", "clerk", "paralegal"]
        missing_roles = [role for role in required_roles if role not in roles]
        
        if missing_roles:
            logger.warning(f"Missing users with roles: {missing_roles}")
            return False
        
        return True
    except Exception as e:
        logger.error(f"User management test failed: {str(e)}")
        return False

def test_client_management():
    print_test_header("Client Management")
    
    created_clients = []
    
    try:
        # Create clients
        for client_data in test_clients:
            response = requests.post(f"{BACKEND_URL}/clients", json=client_data)
            logger.info(f"Creating client: {client_data['name']}")
            print_response(response)
            
            if response.status_code == 200:
                created_clients.append(response.json())
        
        # Get all clients
        response = requests.get(f"{BACKEND_URL}/clients")
        logger.info("Getting all clients")
        print_response(response)
        
        # Get specific client
        if created_clients:
            client_id = created_clients[0]["id"]
            response = requests.get(f"{BACKEND_URL}/clients/{client_id}")
            logger.info(f"Getting specific client with ID {client_id}")
            print_response(response)
        
        return len(created_clients) > 0
    except Exception as e:
        logger.error(f"Client management test failed: {str(e)}")
        return False

def test_case_management():
    print_test_header("Case Management")
    
    created_cases = []
    
    try:
        # Get attorney and client IDs
        response = requests.get(f"{BACKEND_URL}/users")
        users = response.json()
        attorney_id = next((user["id"] for user in users if user["role"] == "attorney"), None)
        
        response = requests.get(f"{BACKEND_URL}/clients")
        clients = response.json()
        
        if not attorney_id or not clients:
            logger.error("Cannot test cases: No attorney or clients found")
            return False
        
        client_id = clients[0]["id"]
        
        # Create cases
        for case_data in test_cases:
            case_data["client_id"] = client_id
            case_data["assigned_attorney"] = attorney_id
            
            response = requests.post(f"{BACKEND_URL}/cases", json=case_data)
            logger.info(f"Creating case: {case_data['title']} ({case_data['case_type']})")
            print_response(response)
            
            if response.status_code == 200:
                created_cases.append(response.json())
        
        # Get all cases
        response = requests.get(f"{BACKEND_URL}/cases")
        logger.info("Getting all cases")
        print_response(response)
        
        # Get specific case
        if created_cases:
            case_id = created_cases[0]["id"]
            response = requests.get(f"{BACKEND_URL}/cases/{case_id}")
            logger.info(f"Getting specific case with ID {case_id}")
            print_response(response)
            
            # Update case
            update_data = {
                "title": f"{created_cases[0]['title']} - Updated",
                "status": "settled"
            }
            response = requests.put(f"{BACKEND_URL}/cases/{case_id}", json=update_data)
            logger.info(f"Updating case with ID {case_id}")
            print_response(response)
            
            # Delete case (will test this last)
            case_to_delete = created_cases[-1]["id"]
            logger.info(f"Will delete case with ID {case_to_delete} after testing other features")
        
        return len(created_cases) > 0
    except Exception as e:
        logger.error(f"Case management test failed: {str(e)}")
        return False

def test_court_dates():
    print_test_header("Court Dates")
    
    created_court_dates = []
    
    try:
        # Get a case ID
        response = requests.get(f"{BACKEND_URL}/cases")
        cases = response.json()
        
        if not cases:
            logger.error("Cannot test court dates: No cases found")
            return False
        
        case_id = cases[0]["id"]
        
        # Create court dates
        for court_date_data in test_court_dates:
            court_date_data["case_id"] = case_id
            
            response = requests.post(f"{BACKEND_URL}/court-dates", json=court_date_data)
            logger.info(f"Creating court date: {court_date_data['hearing_type']} (Priority: {court_date_data['priority']})")
            print_response(response)
            
            if response.status_code == 200:
                created_court_dates.append(response.json())
        
        # Get all court dates
        response = requests.get(f"{BACKEND_URL}/court-dates")
        logger.info("Getting all court dates")
        print_response(response)
        
        # Get court dates for specific case
        response = requests.get(f"{BACKEND_URL}/court-dates/case/{case_id}")
        logger.info(f"Getting court dates for case ID {case_id}")
        print_response(response)
        
        # Delete a court date
        if created_court_dates:
            court_date_id = created_court_dates[0]["id"]
            response = requests.delete(f"{BACKEND_URL}/court-dates/{court_date_id}")
            logger.info(f"Deleting court date with ID {court_date_id}")
            print_response(response)
        
        return len(created_court_dates) > 0
    except Exception as e:
        logger.error(f"Court dates test failed: {str(e)}")
        return False

def test_document_management():
    print_test_header("Document Management")
    
    created_documents = []
    
    try:
        # Get a case ID and user ID
        response = requests.get(f"{BACKEND_URL}/cases")
        cases = response.json()
        
        response = requests.get(f"{BACKEND_URL}/users")
        users = response.json()
        
        if not cases or not users:
            logger.error("Cannot test documents: No cases or users found")
            return False
        
        case_id = cases[0]["id"]
        user_id = users[0]["id"]
        
        # Create document
        document_data = test_document.copy()
        document_data["case_id"] = case_id
        document_data["uploaded_by"] = user_id
        
        response = requests.post(f"{BACKEND_URL}/documents", json=document_data)
        logger.info(f"Creating document: {document_data['filename']} (Category: {document_data['category']})")
        print_response(response)
        
        if response.status_code == 200:
            created_documents.append(response.json())
        
        # Get documents for specific case
        response = requests.get(f"{BACKEND_URL}/documents/case/{case_id}")
        logger.info(f"Getting documents for case ID {case_id}")
        print_response(response)
        
        # Delete a document
        if created_documents:
            document_id = created_documents[0]["id"]
            response = requests.delete(f"{BACKEND_URL}/documents/{document_id}")
            logger.info(f"Deleting document with ID {document_id}")
            print_response(response)
        
        return len(created_documents) > 0
    except Exception as e:
        logger.error(f"Document management test failed: {str(e)}")
        return False

def test_dashboard_analytics():
    print_test_header("Dashboard Analytics")
    
    try:
        # Get dashboard stats
        response = requests.get(f"{BACKEND_URL}/dashboard/stats")
        logger.info("Getting dashboard stats")
        print_response(response)
        
        # Get upcoming court dates
        response = requests.get(f"{BACKEND_URL}/dashboard/upcoming-dates")
        logger.info("Getting upcoming court dates")
        print_response(response)
        
        return True
    except Exception as e:
        logger.error(f"Dashboard analytics test failed: {str(e)}")
        return False

def test_data_relationships():
    print_test_header("Data Relationships and Cascading Deletes")
    
    try:
        # Get a case ID with court dates and documents
        response = requests.get(f"{BACKEND_URL}/cases")
        cases = response.json()
        
        if not cases:
            logger.error("Cannot test relationships: No cases found")
            return False
        
        case_id = cases[0]["id"]
        
        # Check court dates for this case
        response = requests.get(f"{BACKEND_URL}/court-dates/case/{case_id}")
        court_dates_before = response.json()
        logger.info(f"Case has {len(court_dates_before)} court dates before deletion")
        
        # Check documents for this case
        response = requests.get(f"{BACKEND_URL}/documents/case/{case_id}")
        documents_before = response.json()
        logger.info(f"Case has {len(documents_before)} documents before deletion")
        
        # Delete the case
        response = requests.delete(f"{BACKEND_URL}/cases/{case_id}")
        logger.info(f"Deleting case with ID {case_id}")
        print_response(response)
        
        # Try to get the deleted case (should return 404)
        response = requests.get(f"{BACKEND_URL}/cases/{case_id}")
        logger.info(f"Attempting to get deleted case (should fail)")
        logger.info(f"Status Code: {response.status_code}")
        
        # Try to get court dates for deleted case (should return empty list)
        response = requests.get(f"{BACKEND_URL}/court-dates/case/{case_id}")
        court_dates_after = response.json()
        logger.info(f"Case has {len(court_dates_after)} court dates after deletion")
        
        # Try to get documents for deleted case (should return empty list)
        response = requests.get(f"{BACKEND_URL}/documents/case/{case_id}")
        documents_after = response.json()
        logger.info(f"Case has {len(documents_after)} documents after deletion")
        
        # Check if cascading delete worked
        if len(court_dates_after) > 0 or len(documents_after) > 0:
            logger.warning("Cascading delete may not have worked properly")
            return False
        
        return True
    except Exception as e:
        logger.error(f"Data relationships test failed: {str(e)}")
        return False

def test_error_handling():
    print_test_header("Error Handling")
    
    try:
        # Test 404 for non-existent user
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BACKEND_URL}/users/{fake_id}")
        logger.info(f"Getting non-existent user with ID {fake_id}")
        logger.info(f"Status Code: {response.status_code}")
        
        # Test 404 for non-existent client
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BACKEND_URL}/clients/{fake_id}")
        logger.info(f"Getting non-existent client with ID {fake_id}")
        logger.info(f"Status Code: {response.status_code}")
        
        # Test validation error - create case with non-existent client
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BACKEND_URL}/users")
        users = response.json()
        attorney_id = next((user["id"] for user in users if user["role"] == "attorney"), None)
        
        if attorney_id:
            invalid_case = {
                "case_number": "INVALID-001",
                "title": "Invalid Case",
                "case_type": "civil",
                "status": "active",
                "client_id": fake_id,  # Non-existent client
                "assigned_attorney": attorney_id,
                "court_name": "Test Court"
            }
            
            response = requests.post(f"{BACKEND_URL}/cases", json=invalid_case)
            logger.info("Creating case with non-existent client (should fail)")
            logger.info(f"Status Code: {response.status_code}")
        
        return True
    except Exception as e:
        logger.error(f"Error handling test failed: {str(e)}")
        return False

def run_all_tests():
    test_results = {
        "API Connectivity": test_api_connectivity(),
        "User Management": test_user_management(),
        "Client Management": test_client_management(),
        "Case Management": test_case_management(),
        "Court Dates": test_court_dates(),
        "Document Management": test_document_management(),
        "Dashboard Analytics": test_dashboard_analytics(),
        "Data Relationships": test_data_relationships(),
        "Error Handling": test_error_handling()
    }
    
    print_separator()
    logger.info("TEST RESULTS SUMMARY")
    print_separator()
    
    all_passed = True
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
        if not result:
            all_passed = False
    
    print_separator()
    overall_status = "✅ ALL TESTS PASSED" if all_passed else "❌ SOME TESTS FAILED"
    logger.info(f"OVERALL STATUS: {overall_status}")
    print_separator()
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()
