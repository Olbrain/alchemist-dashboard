"""
API Key Validation Middleware for Agent Template

This middleware validates API keys for deployed agents and tracks usage.
To be integrated into the agent-template FastAPI application.
"""

import asyncio
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import firestore as firestore_client
import logging

logger = logging.getLogger(__name__)

class APIKeyValidator:
    """
    Validates API keys against Firestore and tracks usage
    """
    
    def __init__(self, project_id: str, credentials_path: Optional[str] = None):
        """
        Initialize the API key validator
        
        Args:
            project_id: Firebase project ID
            credentials_path: Path to service account credentials (optional)
        """
        self.project_id = project_id
        self.db = None
        self.rate_limit_cache = {}  # Simple in-memory cache for rate limiting
        self._initialize_firestore(credentials_path)
    
    def _initialize_firestore(self, credentials_path: Optional[str] = None):
        """Initialize Firestore connection"""
        try:
            if credentials_path:
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': self.project_id
                })
            else:
                # Use default credentials (for Cloud Run deployment)
                firebase_admin.initialize_app()
            
            self.db = firestore.client()
            logger.info("✅ Firestore connection initialized for API key validation")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Firestore: {e}")
            raise
    
    async def validate_api_key(self, api_key: str, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Validate API key against Firestore using secure hash comparison
        
        Args:
            api_key: The full API key to validate (including ak_ prefix)
            agent_id: The agent ID to validate against
            
        Returns:
            API key document data if valid, None if invalid
        """
        try:
            import hashlib
            
            # Create hash of the incoming API key
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            
            # Query api_keys collection for this agent
            api_keys_ref = self.db.collection('api_keys')
            query = api_keys_ref.where('agent_id', '==', agent_id).where('status', '==', 'active').stream()
            
            for doc in query:
                doc_data = doc.to_dict()
                doc_data['id'] = doc.id
                
                # Secure constant-time hash comparison
                stored_hash = doc_data.get('key_hash')
                if stored_hash and self._secure_compare(key_hash, stored_hash):
                    # Check if key has expired (if expiration is set)
                    if doc_data.get('expires_at'):
                        from datetime import datetime, timezone
                        expires_at = doc_data['expires_at']
                        if isinstance(expires_at, str):
                            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                        elif hasattr(expires_at, 'timestamp'):
                            expires_at = expires_at.replace(tzinfo=timezone.utc)
                        
                        if datetime.now(timezone.utc) > expires_at:
                            logger.warning(f"❌ Expired API key for agent {agent_id}")
                            return None
                    
                    logger.info(f"✅ Valid API key authenticated for agent {agent_id}")
                    return doc_data
            
            logger.warning(f"❌ Invalid API key for agent {agent_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            return None
    
    def _secure_compare(self, a: str, b: str) -> bool:
        """
        Secure constant-time string comparison to prevent timing attacks
        
        Args:
            a: First string to compare
            b: Second string to compare
            
        Returns:
            True if strings are equal, False otherwise
        """
        if len(a) != len(b):
            return False
        
        result = 0
        for x, y in zip(a, b):
            result |= ord(x) ^ ord(y)
        return result == 0
    
    async def check_rate_limit(self, api_key_id: str, rate_limit: int) -> bool:
        """
        Check if API key has exceeded rate limit
        
        Args:
            api_key_id: The API key document ID
            rate_limit: Rate limit per minute
            
        Returns:
            True if within rate limit, False if exceeded
        """
        current_time = time.time()
        minute_window = int(current_time // 60)  # Current minute
        
        key = f"{api_key_id}:{minute_window}"
        
        if key not in self.rate_limit_cache:
            self.rate_limit_cache[key] = 0
        
        if self.rate_limit_cache[key] >= rate_limit:
            return False
        
        self.rate_limit_cache[key] += 1
        
        # Clean up old cache entries (older than 2 minutes)
        keys_to_remove = []
        for cache_key in self.rate_limit_cache:
            cache_minute = int(cache_key.split(':')[1])
            if cache_minute < minute_window - 1:
                keys_to_remove.append(cache_key)
        
        for key in keys_to_remove:
            del self.rate_limit_cache[key]
        
        return True
    
    async def track_usage(self, api_key_id: str, usage_data: Dict[str, Any]):
        """
        Track API key usage - update counters and log detailed usage
        
        Args:
            api_key_id: The API key document ID
            usage_data: Dictionary containing usage information
        """
        try:
            # Update API key usage counters
            api_key_ref = self.db.collection('api_keys').document(api_key_id)
            
            # Increment total_calls and update last_used
            api_key_ref.update({
                'total_calls': firestore.Increment(1),
                'last_used': firestore.SERVER_TIMESTAMP
            })
            
            # Log detailed usage for analytics
            usage_log = {
                'api_key_id': api_key_id,
                'agent_id': usage_data.get('agent_id'),
                'request_path': usage_data.get('request_path'),
                'method': usage_data.get('method', 'POST'),
                'timestamp': datetime.now(timezone.utc),
                'response_status': usage_data.get('response_status', 200),
                'tokens_used': usage_data.get('tokens_used', 0),
                'cost_usd': usage_data.get('cost_usd', 0.0),
                'user_id': usage_data.get('user_id'),
                'organization_id': usage_data.get('organization_id')
            }
            
            # Add to usage logs collection
            self.db.collection('api_key_usage_logs').add(usage_log)
            
            # Update agent usage summary if costs are provided
            if usage_data.get('cost_usd', 0) > 0:
                await self._update_agent_billing_summary(
                    usage_data.get('agent_id'),
                    usage_data.get('tokens_used', 0),
                    usage_data.get('cost_usd', 0)
                )
            
            logger.info(f"✅ Usage tracked for API key {api_key_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to track usage for API key {api_key_id}: {e}")
    
    async def _update_agent_billing_summary(self, agent_id: str, tokens: int, cost: float):
        """Update agent billing summary with API key usage"""
        try:
            summary_ref = self.db.collection('agent_usage_summary').document(agent_id)
            
            # Try to get existing document
            doc = summary_ref.get()
            
            if doc.exists:
                # Update existing summary
                summary_ref.update({
                    'totalMessages': firestore.Increment(1),
                    'totalTokens': firestore.Increment(tokens),
                    'totalCost': firestore.Increment(cost),
                    'apiKeyUsage': firestore.Increment(1),  # Track API key vs web usage
                    'lastActivity': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
            else:
                # Create new summary
                summary_ref.set({
                    'agentId': agent_id,
                    'totalMessages': 1,
                    'totalTokens': tokens,
                    'totalCost': cost,
                    'apiKeyUsage': 1,
                    'webUsage': 0,
                    'lastActivity': firestore.SERVER_TIMESTAMP,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
                
        except Exception as e:
            logger.error(f"Failed to update agent billing summary: {e}")


class APIKeyMiddleware:
    """
    FastAPI middleware for API key validation
    """
    
    def __init__(self, validator: APIKeyValidator, agent_id: str):
        self.validator = validator
        self.agent_id = agent_id
    
    async def __call__(self, request: Request, call_next):
        """
        Middleware function to validate API keys
        """
        start_time = time.time()
        
        # Get authorization header
        auth_header = request.headers.get("Authorization")
        
        if auth_header and auth_header.startswith("Bearer ak_"):
            api_key = auth_header[7:]  # Remove 'Bearer ' prefix
            
            try:
                # Validate API key
                key_doc = await self.validator.validate_api_key(api_key, self.agent_id)
                
                if not key_doc:
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Invalid or inactive API key"}
                    )
                
                # Check rate limiting
                rate_limit = key_doc.get('rate_limit', 100)  # Default 100 requests/minute
                if not await self.validator.check_rate_limit(key_doc['id'], rate_limit):
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Rate limit exceeded"}
                    )
                
                # Add API key info to request state
                request.state.api_key_id = key_doc['id']
                request.state.api_key_user_id = key_doc.get('created_by')
                request.state.organization_id = key_doc.get('organization_id')
                request.state.auth_method = 'api_key'
                
                # Process the request
                response = await call_next(request)
                
                # Track usage after successful request
                processing_time = time.time() - start_time
                
                usage_data = {
                    'agent_id': self.agent_id,
                    'request_path': str(request.url.path),
                    'method': request.method,
                    'response_status': response.status_code,
                    'processing_time_ms': round(processing_time * 1000, 2),
                    'user_id': key_doc.get('created_by'),
                    'organization_id': key_doc.get('organization_id')
                }
                
                # Extract token usage and cost from response if available
                if hasattr(response, 'headers'):
                    if 'X-Token-Count' in response.headers:
                        usage_data['tokens_used'] = int(response.headers['X-Token-Count'])
                    if 'X-Cost-USD' in response.headers:
                        usage_data['cost_usd'] = float(response.headers['X-Cost-USD'])
                
                # Track usage asynchronously to not delay response
                asyncio.create_task(self.validator.track_usage(key_doc['id'], usage_data))
                
                return response
                
            except Exception as e:
                logger.error(f"API key validation error: {e}")
                return JSONResponse(
                    status_code=500,
                    content={"detail": "API key validation failed"}
                )
        
        # If no API key, continue with normal flow (Firebase JWT validation)
        return await call_next(request)


def create_api_key_middleware(project_id: str, agent_id: str, credentials_path: Optional[str] = None):
    """
    Factory function to create API key middleware
    
    Args:
        project_id: Firebase project ID
        agent_id: The agent ID this middleware protects
        credentials_path: Path to service account credentials (optional)
        
    Returns:
        Configured APIKeyMiddleware instance
    """
    validator = APIKeyValidator(project_id, credentials_path)
    return APIKeyMiddleware(validator, agent_id)