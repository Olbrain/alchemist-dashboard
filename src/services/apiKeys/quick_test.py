#!/usr/bin/env python3
"""
Quick API Key Test Script

A simplified version for quick testing of API key functionality.
Run this to verify your API key is working correctly.

Usage:
    python quick_test.py https://your-agent.run.app ak_your_api_key_here
"""

import sys
import requests
import time
from datetime import datetime

def test_api_key(agent_url: str, api_key: str):
    """Quick test of API key functionality"""
    
    print("🔐 Quick API Key Test")
    print("=" * 30)
    print(f"Agent URL: {agent_url}")
    print(f"API Key: {api_key[:12]}..." if len(api_key) > 12 else api_key)
    print()
    
    session = requests.Session()
    session.timeout = 10
    
    # Test 1: Health check (no auth needed)
    print("1️⃣ Testing health endpoint...")
    try:
        response = session.get(f"{agent_url}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed - {data.get('status', 'unknown')}")
        else:
            print(f"   ❌ Health check failed - {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error - {e}")
        return False
    
    # Test 2: Auth info with API key
    print("2️⃣ Testing API key authentication...")
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = session.get(f"{agent_url}/auth/info", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('authenticated') and data.get('auth_method') == 'api_key':
                print(f"   ✅ API key authentication successful")
                print(f"   👤 User ID: {data.get('user_id', 'unknown')}")
                print(f"   🏢 Organization: {data.get('organization_id', 'unknown')}")
            else:
                print(f"   ❌ API key not authenticated properly")
                return False
        else:
            print(f"   ❌ Auth failed - {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Auth error - {e}")
        return False
    
    # Test 3: Create conversation
    print("3️⃣ Testing conversation creation...")
    try:
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"user_id": "test_user"}
        response = session.post(f"{agent_url}/api/conversation/create", 
                              headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            conversation_id = data.get('conversation_id')
            print(f"   ✅ Conversation created: {conversation_id}")
            
            # Test 4: Send message
            print("4️⃣ Testing message sending...")
            message_payload = {
                "conversation_id": conversation_id,
                "message": "Hello, testing API key!"
            }
            
            response = session.post(f"{agent_url}/api/conversation/message",
                                  headers=headers, json=message_payload)
            
            if response.status_code == 200:
                data = response.json()
                tokens = data.get('tokens_used', 0)
                cost = data.get('cost_usd', 0.0)
                print(f"   ✅ Message sent successfully")
                print(f"   📊 Tokens used: {tokens}")
                print(f"   💰 Cost: ${cost:.6f}")
                
                # Check usage tracking headers
                token_header = response.headers.get('X-Token-Count')
                cost_header = response.headers.get('X-Cost-USD')
                if token_header or cost_header:
                    print(f"   📈 Usage tracking: Headers present")
                
            else:
                print(f"   ❌ Message failed - {response.status_code}")
                return False
                
        else:
            print(f"   ❌ Conversation creation failed - {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Conversation error - {e}")
        return False
    
    # Test 5: Usage stats
    print("5️⃣ Testing usage statistics...")
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        response = session.get(f"{agent_url}/api/usage/stats", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Usage stats retrieved")
            print(f"   📈 Total calls: {data.get('total_calls', 0)}")
            print(f"   🎯 Total tokens: {data.get('total_tokens', 0)}")
            print(f"   💵 Total cost: ${data.get('total_cost_usd', 0.0):.4f}")
        else:
            print(f"   ⚠️ Usage stats unavailable - {response.status_code}")
            # Don't fail on this as it might not be implemented
    except Exception as e:
        print(f"   ⚠️ Usage stats error - {e}")
    
    print()
    print("🎉 All core API key functionality is working!")
    print("✨ Your API key authentication system is ready for use.")
    return True

def main():
    """Main function with command line argument handling"""
    
    if len(sys.argv) < 3:
        print("Usage: python quick_test.py <agent_url> <api_key>")
        print()
        print("Examples:")
        print("  python quick_test.py https://your-agent.run.app ak_your_api_key")
        print("  python quick_test.py http://localhost:8000 ak_test_key")
        sys.exit(1)
    
    agent_url = sys.argv[1].rstrip('/')
    api_key = sys.argv[2]
    
    # Validate inputs
    if not agent_url.startswith(('http://', 'https://')):
        print("❌ Agent URL must start with http:// or https://")
        sys.exit(1)
    
    if not api_key.startswith('ak_'):
        print("❌ API key must start with 'ak_'")
        sys.exit(1)
    
    if len(api_key) < 10:
        print("❌ API key appears to be too short")
        sys.exit(1)
    
    # Run tests
    start_time = time.time()
    success = test_api_key(agent_url, api_key)
    duration = time.time() - start_time
    
    print()
    print(f"⏱️  Test completed in {duration:.2f} seconds")
    print(f"📅 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if success:
        print("🌟 SUCCESS: API key system is working correctly!")
        sys.exit(0)
    else:
        print("💥 FAILURE: API key system has issues that need to be fixed.")
        sys.exit(1)

if __name__ == "__main__":
    main()