# Secure API Key Implementation

## Overview

This implementation provides enterprise-grade security for API keys by using cryptographic hashing and secure storage practices. **API keys are never stored in plaintext** - only their SHA-256 hashes are stored in Firestore.

## Security Features

✅ **Hash-Based Storage**: Only SHA-256 hashes stored in database  
✅ **One-Time Display**: Keys shown only during creation/regeneration  
✅ **Constant-Time Comparison**: Prevents timing attacks  
✅ **Expiration Support**: Optional key expiration  
✅ **Rotation Tracking**: Unique rotation IDs for key management  
✅ **Breach Protection**: Leaked database reveals no usable keys  

## Architecture

### Frontend (JavaScript)
- **File**: `apiKeyService.js`
- **Functions**: Create, regenerate, manage API keys
- **Security**: Client-side hashing using Web Crypto API

### Backend (Python - Agent Template)
- **File**: `api_key_middleware.py`
- **Functions**: Validate API keys, track usage
- **Security**: Server-side hash comparison with timing attack protection

## Database Schema

```javascript
// Firestore: api_keys/{keyId}
{
  "name": "My API Key",
  "agent_id": "agent_123",
  "organization_id": "org_456",
  "created_by": "user_789",
  "status": "active",
  "key_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // SHA-256
  "key_prefix": "ak_12345678", // Safe prefix for identification
  "rotation_id": "uuid-v4",
  "created_at": "2024-01-01T00:00:00Z",
  "last_used": "2024-01-01T12:00:00Z",
  "total_calls": 42,
  "rate_limit": 100,
  "expires_at": null
}
```

## Usage Examples

### 1. Frontend - Create API Key

```javascript
import apiKeyService from './services/apiKeys/apiKeyService';

// Create new API key
const result = await apiKeyService.createApiKey({
  name: 'Production API Key',
  agentId: 'agent_123',
  organizationId: 'org_456',
  userId: 'user_789'
});

if (result.success) {
  // ⚠️ IMPORTANT: Display key to user immediately
  // This is the ONLY time the actual key is available
  console.log('API Key (save this!):', result.apiKey);
  console.log('Key ID:', result.keyId);
  
  // Key hash is now stored securely in Firestore
  // Original key is NOT stored anywhere
}
```

### 2. Agent Template - Validate API Key

```python
from api_key_middleware import create_api_key_middleware

# Initialize middleware
middleware = create_api_key_middleware(
    project_id="your-firebase-project",
    agent_id="agent_123"
)

# Add to FastAPI app
app.add_middleware(middleware)

# Example request with API key:
# curl -H "Authorization: Bearer ak_1234567890abcdef..." 
#      https://your-agent-url.com/api/conversation/create
```

### 3. Validate API Key Manually

```python
from api_key_middleware import APIKeyValidator

validator = APIKeyValidator("your-firebase-project")

# Validate key
api_key = "ak_1234567890abcdef..."
key_data = await validator.validate_api_key(api_key, "agent_123")

if key_data:
    print("✅ Valid API key")
    print(f"Created by: {key_data['created_by']}")
    print(f"Rate limit: {key_data['rate_limit']}")
else:
    print("❌ Invalid API key")
```

## Integration with Agent Template

### Step 1: Install Dependencies

```bash
pip install firebase-admin google-cloud-firestore
```

### Step 2: Add to Agent Template

```python
# main.py or app.py
from fastapi import FastAPI
from api_key_middleware import create_api_key_middleware
import os

app = FastAPI()

# Get configuration from environment
PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')
AGENT_ID = os.getenv('AGENT_ID')  # Set during deployment

# Add API key middleware
api_key_middleware = create_api_key_middleware(PROJECT_ID, AGENT_ID)
app.middleware("http")(api_key_middleware)

@app.post("/api/conversation/create")
async def create_conversation(request: Request):
    # API key validation happens automatically in middleware
    # Access validated key info if needed:
    if hasattr(request.state, 'api_key_id'):
        print(f"Request authenticated with API key: {request.state.api_key_id}")
    
    # Your conversation logic here
    return {"conversation_id": "conv_123"}
```

### Step 3: Environment Variables

```bash
# In your agent deployment
FIREBASE_PROJECT_ID=your-firebase-project-id
AGENT_ID=agent_123
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Security Best Practices

### ✅ Do's
- Store only SHA-256 hashes in database
- Use constant-time comparison for hash validation
- Display keys only once during creation
- Log security events (without actual keys)
- Implement rate limiting per key
- Support key expiration and rotation
- Use HTTPS for all API communications

### ❌ Don'ts
- Never store plaintext API keys anywhere
- Never log actual API keys in application logs
- Never return keys in API responses (except creation)
- Never use simple string comparison for validation
- Never ignore timing attack vectors
- Never allow unlimited rate limits

## Monitoring & Analytics

The system automatically tracks:
- API key usage counts
- Last used timestamps
- Request patterns and failures
- Rate limit violations
- Cost attribution per key

Access logs via:
```javascript
// Get usage statistics
const stats = await apiKeyService.getOrganizationKeyStats(organizationId);
console.log(`Total API calls: ${stats.totalCalls}`);
```

## Migration from Plaintext Keys

If you have existing plaintext keys (which you shouldn't!), migration process:

1. **Immediate Action**: Revoke all existing keys
2. **User Communication**: Notify users to regenerate keys
3. **New Creation**: All new keys use secure hash storage
4. **Database Cleanup**: Remove any plaintext key fields

## Testing

```javascript
// Test secure key creation
const testKey = await apiKeyService.createApiKey({
  name: 'Test Key',
  agentId: 'test_agent',
  organizationId: 'test_org',
  userId: 'test_user'
});

console.log('Created key:', testKey.apiKey); // Only shown once
console.log('Key stored securely with hash');
```

## Support

For issues or questions about the secure API key implementation:
1. Check Firestore rules allow API key queries
2. Verify service account permissions
3. Test hash generation/comparison manually
4. Check agent deployment environment variables

Remember: **Security is only as strong as its weakest link**. Always use HTTPS, secure environment variables, and follow least-privilege principles.