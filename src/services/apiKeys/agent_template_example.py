"""
Example FastAPI Agent Template with Secure API Key Authentication

This example shows how to integrate the secure API key middleware
into a deployed agent template.
"""

import os
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Import the secure API key middleware
from api_key_middleware import create_api_key_middleware, APIKeyValidator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Secure Agent API",
    description="Agent with secure API key authentication",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')
AGENT_ID = os.getenv('AGENT_ID', 'default-agent')
CREDENTIALS_PATH = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', None)

# Initialize API key middleware
try:
    api_key_middleware = create_api_key_middleware(
        project_id=PROJECT_ID,
        agent_id=AGENT_ID,
        credentials_path=CREDENTIALS_PATH
    )
    
    # Add middleware to app
    app.middleware("http")(api_key_middleware)
    logger.info(f"✅ API key middleware initialized for agent: {AGENT_ID}")
    
except Exception as e:
    logger.error(f"❌ Failed to initialize API key middleware: {e}")
    raise

# Request/Response models
class ConversationCreateRequest(BaseModel):
    user_id: Optional[str] = "anonymous"
    context: Optional[Dict[str, Any]] = None

class ConversationResponse(BaseModel):
    conversation_id: str
    status: str
    created_at: str

class MessageRequest(BaseModel):
    conversation_id: str
    message: str
    user_id: Optional[str] = "anonymous"

class MessageResponse(BaseModel):
    response: str
    tokens_used: int
    cost_usd: float
    timestamp: str

# Health check endpoint (no authentication required)
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent_id": AGENT_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
    }

# Authentication info endpoint
@app.get("/auth/info")
async def auth_info(request: Request):
    """Get authentication information for the current request"""
    auth_info = {
        "authenticated": False,
        "auth_method": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if request was authenticated with API key
    if hasattr(request.state, 'auth_method'):
        auth_info.update({
            "authenticated": True,
            "auth_method": request.state.auth_method,
        })
        
        if request.state.auth_method == 'api_key':
            auth_info.update({
                "api_key_id": getattr(request.state, 'api_key_id', None),
                "user_id": getattr(request.state, 'api_key_user_id', None),
                "organization_id": getattr(request.state, 'organization_id', None)
            })
    
    return auth_info

# Protected endpoints (require API key authentication)
@app.post("/api/conversation/create", response_model=ConversationResponse)
async def create_conversation(
    request: Request,
    data: ConversationCreateRequest
):
    """
    Create a new conversation
    Requires API key authentication
    """
    try:
        # Generate conversation ID
        import uuid
        conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
        
        # Log authenticated request
        auth_method = getattr(request.state, 'auth_method', 'unknown')
        user_id = getattr(request.state, 'api_key_user_id', data.user_id)
        
        logger.info(f"Creating conversation {conversation_id} - Auth: {auth_method}, User: {user_id}")
        
        response = ConversationResponse(
            conversation_id=conversation_id,
            status="created",
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")

@app.post("/api/conversation/message", response_model=MessageResponse)
async def send_message(
    request: Request,
    data: MessageRequest
):
    """
    Send a message to the agent
    Requires API key authentication
    """
    try:
        # Simulate processing the message
        import time
        import random
        
        start_time = time.time()
        
        # Simulate AI processing
        time.sleep(random.uniform(0.1, 0.5))
        
        # Mock response
        responses = [
            f"I understand you said: '{data.message}'. How can I help you further?",
            f"Thanks for your message about '{data.message}'. Let me think about that...",
            f"Regarding '{data.message}', I can provide more information if you'd like.",
        ]
        
        response_text = random.choice(responses)
        tokens_used = random.randint(50, 200)
        cost_usd = tokens_used * 0.00002  # $0.00002 per token (mock pricing)
        
        processing_time = time.time() - start_time
        
        # Log the request
        auth_method = getattr(request.state, 'auth_method', 'unknown')
        api_key_id = getattr(request.state, 'api_key_id', None)
        
        logger.info(f"Message processed - Auth: {auth_method}, Key: {api_key_id}, "
                   f"Tokens: {tokens_used}, Cost: ${cost_usd:.6f}, Time: {processing_time:.2f}s")
        
        response = MessageResponse(
            response=response_text,
            tokens_used=tokens_used,
            cost_usd=cost_usd,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        # Add usage info to response headers for middleware tracking
        response_json = JSONResponse(content=response.dict())
        response_json.headers["X-Token-Count"] = str(tokens_used)
        response_json.headers["X-Cost-USD"] = str(cost_usd)
        
        return response_json
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        raise HTTPException(status_code=500, detail="Failed to process message")

@app.get("/api/usage/stats")
async def get_usage_stats(request: Request):
    """
    Get usage statistics for the authenticated API key
    """
    api_key_id = getattr(request.state, 'api_key_id', None)
    
    if not api_key_id:
        raise HTTPException(status_code=401, detail="API key authentication required")
    
    # Mock usage stats (in real implementation, fetch from Firestore)
    return {
        "api_key_id": api_key_id,
        "total_calls": random.randint(100, 1000),
        "total_tokens": random.randint(10000, 100000),
        "total_cost_usd": round(random.uniform(1.0, 50.0), 2),
        "last_used": datetime.now(timezone.utc).isoformat(),
        "rate_limit": 100
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "path": str(request.url)
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    print(f"""
    🚀 Starting Secure Agent Template
    
    Agent ID: {AGENT_ID}
    Project ID: {PROJECT_ID}
    
    Endpoints:
    - GET  /health - Health check (public)
    - GET  /auth/info - Authentication info
    - POST /api/conversation/create - Create conversation (requires API key)
    - POST /api/conversation/message - Send message (requires API key)
    - GET  /api/usage/stats - Usage statistics (requires API key)
    
    API Key Usage:
    curl -H "Authorization: Bearer ak_your_api_key_here" \\
         -H "Content-Type: application/json" \\
         -d '{\"user_id\": \"test_user\"}' \\
         http://localhost:8000/api/conversation/create
    """)
    
    uvicorn.run(
        "agent_template_example:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )