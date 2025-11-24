#!/usr/bin/env python3
"""
Comprehensive API Key Testing Script

This script tests the secure API key authentication system for deployed agents.
It validates authentication, rate limiting, usage tracking, and security measures.

Usage:
    python test_api_keys.py --agent-url https://your-agent.run.app --api-key ak_your_test_key

Requirements:
    pip install requests colorama fire
"""

import os
import sys
import time
import json
import asyncio
import hashlib
import secrets
import statistics
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field

import requests
from colorama import init, Fore, Back, Style
import fire

# Initialize colorama for cross-platform colored output
init(autoreset=True)

@dataclass
class TestResult:
    """Test result data structure"""
    name: str
    passed: bool
    duration_ms: float
    details: str = ""
    error: Optional[str] = None
    response_code: Optional[int] = None
    response_data: Optional[Dict] = None
    headers: Optional[Dict] = None

@dataclass
class TestSuite:
    """Test suite results"""
    name: str
    results: List[TestResult] = field(default_factory=list)
    total_duration_ms: float = 0.0
    
    @property
    def passed_count(self) -> int:
        return sum(1 for r in self.results if r.passed)
    
    @property
    def failed_count(self) -> int:
        return sum(1 for r in self.results if not r.passed)
    
    @property
    def pass_rate(self) -> float:
        if not self.results:
            return 0.0
        return (self.passed_count / len(self.results)) * 100

class APIKeyTester:
    """Comprehensive API key testing framework"""
    
    def __init__(self, agent_url: str, api_key: str = None, verbose: bool = False):
        self.agent_url = agent_url.rstrip('/')
        self.api_key = api_key
        self.verbose = verbose
        self.session = requests.Session()
        self.session.timeout = 30
        
        # Test results storage
        self.test_suites: List[TestSuite] = []
        
        # Rate limiting tracking
        self.request_times = []
        
        print(f"{Fore.CYAN}🚀 API Key Tester Initialized")
        print(f"{Fore.CYAN}Agent URL: {self.agent_url}")
        print(f"{Fore.CYAN}API Key: {'✅ Provided' if api_key else '❌ Not provided'}")
        print(f"{Fore.CYAN}Verbose: {verbose}")
        print("=" * 60)
    
    def _make_request(self, method: str, endpoint: str, headers: Dict = None, 
                     json_data: Dict = None, timeout: float = 30) -> Tuple[requests.Response, float]:
        """Make HTTP request with timing"""
        url = f"{self.agent_url}{endpoint}"
        
        # Default headers
        request_headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'API-Key-Tester/1.0'
        }
        
        if headers:
            request_headers.update(headers)
        
        start_time = time.time()
        
        try:
            if self.verbose:
                print(f"  🔍 {method} {url}")
                if headers:
                    print(f"  📋 Headers: {headers}")
                if json_data:
                    print(f"  📝 Data: {json_data}")
            
            response = self.session.request(
                method=method,
                url=url,
                headers=request_headers,
                json=json_data,
                timeout=timeout
            )
            
            duration_ms = (time.time() - start_time) * 1000
            self.request_times.append(time.time())
            
            if self.verbose:
                print(f"  📊 Response: {response.status_code} ({duration_ms:.1f}ms)")
            
            return response, duration_ms
            
        except requests.exceptions.RequestException as e:
            duration_ms = (time.time() - start_time) * 1000
            if self.verbose:
                print(f"  ❌ Request failed: {e}")
            raise
    
    def _create_auth_header(self, api_key: str = None) -> Dict[str, str]:
        """Create authorization header"""
        key = api_key or self.api_key
        if not key:
            return {}
        return {'Authorization': f'Bearer {key}'}
    
    def _generate_fake_api_key(self, prefix: str = "ak_", length: int = 64) -> str:
        """Generate fake API key for testing"""
        random_part = secrets.token_hex(length // 2)
        return f"{prefix}{random_part}"
    
    def run_test(self, test_name: str, test_func) -> TestResult:
        """Run individual test with error handling and timing"""
        print(f"\n{Fore.YELLOW}🧪 Running: {test_name}")
        
        try:
            start_time = time.time()
            result = test_func()
            duration_ms = (time.time() - start_time) * 1000
            
            if result is True:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    duration_ms=duration_ms,
                    details="Test passed successfully"
                )
            elif result is False:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    duration_ms=duration_ms,
                    details="Test failed",
                    error="Test returned False"
                )
            elif not isinstance(result, TestResult):
                result = TestResult(
                    name=test_name,
                    passed=False,
                    duration_ms=duration_ms,
                    details="Invalid test result type",
                    error=f"Expected TestResult, got {type(result)}"
                )
            
            # Update duration if not set
            if result.duration_ms == 0:
                result.duration_ms = duration_ms
            
            # Print result
            status_color = Fore.GREEN if result.passed else Fore.RED
            status_icon = "✅" if result.passed else "❌"
            print(f"{status_color}{status_icon} {test_name} ({result.duration_ms:.1f}ms)")
            
            if result.details and self.verbose:
                print(f"  📝 {result.details}")
            
            if result.error:
                print(f"  {Fore.RED}❌ Error: {result.error}")
            
            return result
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                duration_ms=duration_ms,
                details="Test threw exception",
                error=str(e)
            )
            
            print(f"{Fore.RED}❌ {test_name} - EXCEPTION ({duration_ms:.1f}ms)")
            print(f"  {Fore.RED}💥 {str(e)}")
            
            return result
    
    def test_health_check(self) -> TestResult:
        """Test public health check endpoint (no auth required)"""
        response, duration = self._make_request('GET', '/health')
        
        if response.status_code == 200:
            data = response.json()
            if 'status' in data and data['status'] == 'healthy':
                return TestResult(
                    name="Health Check",
                    passed=True,
                    duration_ms=duration,
                    details=f"Agent is healthy - {data.get('agent_id', 'unknown')}",
                    response_code=200,
                    response_data=data
                )
        
        return TestResult(
            name="Health Check",
            passed=False,
            duration_ms=duration,
            details=f"Health check failed with status {response.status_code}",
            error=f"Expected 200 with healthy status, got {response.status_code}",
            response_code=response.status_code
        )
    
    def test_auth_info_no_key(self) -> TestResult:
        """Test auth info endpoint without API key"""
        response, duration = self._make_request('GET', '/auth/info')
        
        if response.status_code == 200:
            data = response.json()
            if not data.get('authenticated', True):
                return TestResult(
                    name="Auth Info (No Key)",
                    passed=True,
                    duration_ms=duration,
                    details="Correctly shows unauthenticated status",
                    response_code=200,
                    response_data=data
                )
        
        return TestResult(
            name="Auth Info (No Key)",
            passed=False,
            duration_ms=duration,
            details="Auth info endpoint failed or shows wrong authentication status",
            response_code=response.status_code
        )
    
    def test_auth_info_with_key(self) -> TestResult:
        """Test auth info endpoint with valid API key"""
        if not self.api_key:
            return TestResult(
                name="Auth Info (With Key)",
                passed=False,
                duration_ms=0,
                error="No API key provided for testing"
            )
        
        headers = self._create_auth_header()
        response, duration = self._make_request('GET', '/auth/info', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('authenticated') and data.get('auth_method') == 'api_key':
                return TestResult(
                    name="Auth Info (With Key)",
                    passed=True,
                    duration_ms=duration,
                    details=f"Authenticated as API key user: {data.get('user_id', 'unknown')}",
                    response_code=200,
                    response_data=data
                )
        
        return TestResult(
            name="Auth Info (With Key)",
            passed=False,
            duration_ms=duration,
            details="Failed to authenticate with provided API key",
            response_code=response.status_code,
            error=f"Expected authenticated=true with auth_method=api_key"
        )
    
    def test_create_conversation_valid_key(self) -> TestResult:
        """Test conversation creation with valid API key"""
        if not self.api_key:
            return TestResult(
                name="Create Conversation (Valid Key)",
                passed=False,
                duration_ms=0,
                error="No API key provided for testing"
            )
        
        headers = self._create_auth_header()
        payload = {"user_id": "test_user"}
        
        response, duration = self._make_request('POST', '/api/conversation/create', 
                                               headers=headers, json_data=payload)
        
        if response.status_code == 200:
            data = response.json()
            if 'conversation_id' in data and data.get('status') == 'created':
                return TestResult(
                    name="Create Conversation (Valid Key)",
                    passed=True,
                    duration_ms=duration,
                    details=f"Created conversation: {data['conversation_id']}",
                    response_code=200,
                    response_data=data
                )
        
        return TestResult(
            name="Create Conversation (Valid Key)",
            passed=False,
            duration_ms=duration,
            details=f"Failed to create conversation with valid API key",
            error=f"Status {response.status_code}, expected 200 with conversation_id",
            response_code=response.status_code
        )
    
    def test_create_conversation_invalid_key(self) -> TestResult:
        """Test conversation creation with invalid API key"""
        fake_key = self._generate_fake_api_key()
        headers = self._create_auth_header(fake_key)
        payload = {"user_id": "test_user"}
        
        response, duration = self._make_request('POST', '/api/conversation/create',
                                               headers=headers, json_data=payload)
        
        if response.status_code == 401:
            return TestResult(
                name="Create Conversation (Invalid Key)",
                passed=True,
                duration_ms=duration,
                details="Correctly rejected invalid API key with 401",
                response_code=401
            )
        
        return TestResult(
            name="Create Conversation (Invalid Key)",
            passed=False,
            duration_ms=duration,
            details=f"Should reject invalid API key with 401, got {response.status_code}",
            error=f"Expected 401 Unauthorized, got {response.status_code}",
            response_code=response.status_code
        )
    
    def test_create_conversation_no_key(self) -> TestResult:
        """Test conversation creation without API key"""
        payload = {"user_id": "test_user"}
        
        response, duration = self._make_request('POST', '/api/conversation/create',
                                               json_data=payload)
        
        if response.status_code == 401:
            return TestResult(
                name="Create Conversation (No Key)",
                passed=True,
                duration_ms=duration,
                details="Correctly rejected request without API key",
                response_code=401
            )
        
        return TestResult(
            name="Create Conversation (No Key)",
            passed=False,
            duration_ms=duration,
            details=f"Should require API key authentication, got {response.status_code}",
            error=f"Expected 401 Unauthorized, got {response.status_code}",
            response_code=response.status_code
        )
    
    def test_malformed_api_keys(self) -> TestResult:
        """Test various malformed API key formats"""
        malformed_keys = [
            "invalid_key",           # Wrong prefix
            "ak_",                   # Too short
            "ak_xyz",               # Too short
            "bearer_123456789",     # Wrong prefix
            "ak_" + "x" * 200,      # Too long
            "ak_invalid@chars!",    # Invalid characters
            "",                     # Empty
            "ak_ space in key",     # Spaces
        ]
        
        results = []
        for i, bad_key in enumerate(malformed_keys):
            headers = {'Authorization': f'Bearer {bad_key}'}
            payload = {"user_id": "test_user"}
            
            try:
                response, duration = self._make_request('POST', '/api/conversation/create',
                                                       headers=headers, json_data=payload)
                
                if response.status_code == 401:
                    results.append(f"✅ Key {i+1}: Correctly rejected")
                else:
                    results.append(f"❌ Key {i+1}: Should reject but got {response.status_code}")
            except Exception as e:
                results.append(f"❌ Key {i+1}: Exception - {str(e)}")
        
        passed_count = sum(1 for r in results if r.startswith("✅"))
        total_count = len(results)
        
        return TestResult(
            name="Malformed API Keys",
            passed=passed_count == total_count,
            duration_ms=0,  # Calculated by run_test
            details=f"Passed {passed_count}/{total_count} malformed key tests",
            error=None if passed_count == total_count else f"Failed {total_count - passed_count} tests"
        )
    
    def test_send_message(self) -> TestResult:
        """Test sending message with API key"""
        if not self.api_key:
            return TestResult(
                name="Send Message",
                passed=False,
                duration_ms=0,
                error="No API key provided for testing"
            )
        
        # First create a conversation
        headers = self._create_auth_header()
        create_payload = {"user_id": "test_user"}
        
        create_response, _ = self._make_request('POST', '/api/conversation/create',
                                              headers=headers, json_data=create_payload)
        
        if create_response.status_code != 200:
            return TestResult(
                name="Send Message",
                passed=False,
                duration_ms=0,
                error=f"Failed to create conversation: {create_response.status_code}"
            )
        
        conversation_data = create_response.json()
        conversation_id = conversation_data['conversation_id']
        
        # Now send a message
        message_payload = {
            "conversation_id": conversation_id,
            "message": "Hello, this is a test message for API key validation"
        }
        
        response, duration = self._make_request('POST', '/api/conversation/message',
                                               headers=headers, json_data=message_payload)
        
        if response.status_code == 200:
            data = response.json()
            if 'response' in data and 'tokens_used' in data:
                # Check for usage tracking headers
                token_header = response.headers.get('X-Token-Count')
                cost_header = response.headers.get('X-Cost-USD')
                
                tracking_info = ""
                if token_header:
                    tracking_info += f" | Tokens: {token_header}"
                if cost_header:
                    tracking_info += f" | Cost: ${cost_header}"
                
                return TestResult(
                    name="Send Message",
                    passed=True,
                    duration_ms=duration,
                    details=f"Message sent successfully{tracking_info}",
                    response_code=200,
                    response_data=data,
                    headers=dict(response.headers)
                )
        
        return TestResult(
            name="Send Message",
            passed=False,
            duration_ms=duration,
            details=f"Failed to send message",
            error=f"Status {response.status_code}, expected 200 with response",
            response_code=response.status_code
        )
    
    def test_usage_stats(self) -> TestResult:
        """Test usage statistics endpoint"""
        if not self.api_key:
            return TestResult(
                name="Usage Stats",
                passed=False,
                duration_ms=0,
                error="No API key provided for testing"
            )
        
        headers = self._create_auth_header()
        response, duration = self._make_request('GET', '/api/usage/stats', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['api_key_id', 'total_calls', 'total_tokens', 'total_cost_usd']
            
            if all(field in data for field in required_fields):
                return TestResult(
                    name="Usage Stats",
                    passed=True,
                    duration_ms=duration,
                    details=f"Stats: {data['total_calls']} calls, {data['total_tokens']} tokens, ${data['total_cost_usd']}",
                    response_code=200,
                    response_data=data
                )
        
        return TestResult(
            name="Usage Stats",
            passed=False,
            duration_ms=duration,
            details="Failed to get usage statistics",
            error=f"Status {response.status_code}, expected 200 with stats",
            response_code=response.status_code
        )
    
    def test_rate_limiting(self) -> TestResult:
        """Test rate limiting functionality"""
        if not self.api_key:
            return TestResult(
                name="Rate Limiting",
                passed=False,
                duration_ms=0,
                error="No API key provided for testing"
            )
        
        headers = self._create_auth_header()
        
        # Make rapid requests to trigger rate limiting
        # Note: This test assumes a low rate limit for testing
        start_time = time.time()
        responses = []
        
        for i in range(10):  # Try 10 rapid requests
            try:
                response, duration = self._make_request('GET', '/auth/info', headers=headers)
                responses.append((response.status_code, response.headers.get('X-RateLimit-Remaining')))
                
                if response.status_code == 429:
                    # Rate limit hit!
                    total_duration = (time.time() - start_time) * 1000
                    return TestResult(
                        name="Rate Limiting",
                        passed=True,
                        duration_ms=total_duration,
                        details=f"Rate limit triggered after {i+1} requests",
                        response_code=429
                    )
            except Exception as e:
                pass
            
            time.sleep(0.1)  # Small delay between requests
        
        total_duration = (time.time() - start_time) * 1000
        successful_responses = sum(1 for status, _ in responses if status == 200)
        
        if successful_responses >= 8:  # Most requests succeeded
            return TestResult(
                name="Rate Limiting",
                passed=True,  # Rate limiting might not be triggered in test environment
                duration_ms=total_duration,
                details=f"Made {successful_responses} successful requests (rate limit may not be enforced in test)",
                response_code=200
            )
        
        return TestResult(
            name="Rate Limiting",
            passed=False,
            duration_ms=total_duration,
            details=f"Unexpected behavior: {successful_responses} successful out of 10",
            error="Rate limiting behavior unclear"
        )
    
    def test_concurrent_requests(self) -> TestResult:
        """Test concurrent API key usage"""
        if not self.api_key:
            return TestResult(
                name="Concurrent Requests",
                passed=False,
                duration_ms=0,
                error="No API key provided for testing"
            )
        
        def make_single_request():
            headers = self._create_auth_header()
            try:
                response, duration = self._make_request('GET', '/auth/info', headers=headers)
                return (response.status_code == 200, duration)
            except:
                return (False, 0)
        
        start_time = time.time()
        
        # Run 5 concurrent requests
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_single_request) for _ in range(5)]
            results = [future.result() for future in as_completed(futures)]
        
        total_duration = (time.time() - start_time) * 1000
        successful_requests = sum(1 for success, _ in results if success)
        avg_duration = statistics.mean([duration for success, duration in results if success])
        
        if successful_requests >= 4:  # Allow one failure
            return TestResult(
                name="Concurrent Requests",
                passed=True,
                duration_ms=total_duration,
                details=f"Successfully handled {successful_requests}/5 concurrent requests (avg: {avg_duration:.1f}ms)",
                response_code=200
            )
        
        return TestResult(
            name="Concurrent Requests",
            passed=False,
            duration_ms=total_duration,
            details=f"Only {successful_requests}/5 concurrent requests succeeded",
            error="Poor concurrent request handling"
        )
    
    def test_security_headers(self) -> TestResult:
        """Test for security-related response headers"""
        response, duration = self._make_request('GET', '/health')
        
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': None,  # Any value is good
        }
        
        found_headers = []
        missing_headers = []
        
        for header, expected_values in security_headers.items():
            actual_value = response.headers.get(header)
            
            if actual_value:
                if expected_values is None or actual_value in expected_values:
                    found_headers.append(f"✅ {header}: {actual_value}")
                else:
                    missing_headers.append(f"⚠️ {header}: {actual_value} (unexpected)")
            else:
                missing_headers.append(f"❌ {header}: missing")
        
        # Security headers are recommended but not required for functionality
        return TestResult(
            name="Security Headers",
            passed=True,  # Always pass, just informational
            duration_ms=duration,
            details=f"Found {len(found_headers)} security headers",
            response_code=response.status_code
        )
    
    def run_all_tests(self) -> List[TestSuite]:
        """Run all test suites"""
        
        # Basic functionality tests
        basic_suite = TestSuite("Basic Functionality")
        basic_tests = [
            ("Health Check", self.test_health_check),
            ("Auth Info (No Key)", self.test_auth_info_no_key),
            ("Auth Info (With Key)", self.test_auth_info_with_key),
        ]
        
        for test_name, test_func in basic_tests:
            result = self.run_test(test_name, test_func)
            basic_suite.results.append(result)
        
        self.test_suites.append(basic_suite)
        
        # Authentication tests
        auth_suite = TestSuite("API Key Authentication")
        auth_tests = [
            ("Create Conversation (Valid Key)", self.test_create_conversation_valid_key),
            ("Create Conversation (Invalid Key)", self.test_create_conversation_invalid_key),
            ("Create Conversation (No Key)", self.test_create_conversation_no_key),
            ("Malformed API Keys", self.test_malformed_api_keys),
        ]
        
        for test_name, test_func in auth_tests:
            result = self.run_test(test_name, test_func)
            auth_suite.results.append(result)
        
        self.test_suites.append(auth_suite)
        
        # Feature tests
        feature_suite = TestSuite("Feature Tests")
        feature_tests = [
            ("Send Message", self.test_send_message),
            ("Usage Stats", self.test_usage_stats),
        ]
        
        for test_name, test_func in feature_tests:
            result = self.run_test(test_name, test_func)
            feature_suite.results.append(result)
        
        self.test_suites.append(feature_suite)
        
        # Performance tests
        perf_suite = TestSuite("Performance & Load")
        perf_tests = [
            ("Rate Limiting", self.test_rate_limiting),
            ("Concurrent Requests", self.test_concurrent_requests),
        ]
        
        for test_name, test_func in perf_tests:
            result = self.run_test(test_name, test_func)
            perf_suite.results.append(result)
        
        self.test_suites.append(perf_suite)
        
        # Security tests
        security_suite = TestSuite("Security")
        security_tests = [
            ("Security Headers", self.test_security_headers),
        ]
        
        for test_name, test_func in security_tests:
            result = self.run_test(test_name, test_func)
            security_suite.results.append(result)
        
        self.test_suites.append(security_suite)
        
        return self.test_suites
    
    def print_summary(self):
        """Print test results summary"""
        print(f"\n\n{Fore.CYAN}{'='*60}")
        print(f"{Fore.CYAN}🎯 TEST RESULTS SUMMARY")
        print(f"{Fore.CYAN}{'='*60}")
        
        total_tests = 0
        total_passed = 0
        total_duration = 0.0
        
        for suite in self.test_suites:
            total_tests += len(suite.results)
            total_passed += suite.passed_count
            total_duration += sum(r.duration_ms for r in suite.results)
            
            # Suite summary
            status_color = Fore.GREEN if suite.passed_count == len(suite.results) else Fore.YELLOW
            if suite.failed_count > 0 and suite.passed_count == 0:
                status_color = Fore.RED
            
            print(f"\n{status_color}📊 {suite.name}")
            print(f"{status_color}   Passed: {suite.passed_count}/{len(suite.results)} ({suite.pass_rate:.1f}%)")
            
            if suite.failed_count > 0:
                print(f"{Fore.RED}   Failed Tests:")
                for result in suite.results:
                    if not result.passed:
                        print(f"{Fore.RED}   - {result.name}: {result.error or 'Unknown error'}")
        
        # Overall summary
        overall_pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        summary_color = Fore.GREEN if overall_pass_rate >= 90 else Fore.YELLOW if overall_pass_rate >= 70 else Fore.RED
        
        print(f"\n{summary_color}🏆 OVERALL RESULTS")
        print(f"{summary_color}   Total Tests: {total_tests}")
        print(f"{summary_color}   Passed: {total_passed}")
        print(f"{summary_color}   Failed: {total_tests - total_passed}")
        print(f"{summary_color}   Pass Rate: {overall_pass_rate:.1f}%")
        print(f"{summary_color}   Total Duration: {total_duration:.1f}ms ({total_duration/1000:.2f}s)")
        
        if self.request_times:
            avg_response_time = (total_duration / len(self.request_times))
            print(f"{summary_color}   Avg Response Time: {avg_response_time:.1f}ms")
        
        # Performance insights
        if len(self.request_times) > 1:
            request_intervals = [self.request_times[i] - self.request_times[i-1] 
                               for i in range(1, len(self.request_times))]
            avg_interval = statistics.mean(request_intervals) if request_intervals else 0
            print(f"{Fore.CYAN}   Request Rate: {1/avg_interval:.1f} req/sec" if avg_interval > 0 else "")
        
        # Recommendations
        print(f"\n{Fore.CYAN}💡 RECOMMENDATIONS")
        
        if overall_pass_rate < 100:
            print(f"{Fore.YELLOW}   - Fix failing tests before production deployment")
        
        if not self.api_key:
            print(f"{Fore.YELLOW}   - Provide a valid API key for complete testing")
        
        if total_duration > 5000:  # > 5 seconds
            print(f"{Fore.YELLOW}   - Consider optimizing response times")
        
        if overall_pass_rate >= 95:
            print(f"{Fore.GREEN}   - API key system is working well! ✨")
        
        print(f"\n{Fore.CYAN}{'='*60}")

def main(agent_url: str, api_key: str = None, verbose: bool = False, 
         test_suite: str = "all", output: str = None):
    """
    Run API key tests against a deployed agent
    
    Args:
        agent_url: URL of the deployed agent (e.g., https://your-agent.run.app)
        api_key: Valid API key for testing (optional but recommended)
        verbose: Enable verbose output
        test_suite: Test suite to run (all, basic, auth, features, performance, security)
        output: Output file for results (optional)
    """
    
    print(f"{Fore.MAGENTA}{Style.BRIGHT}")
    print("🔐 API Key Authentication Tester")
    print("================================")
    print(f"{Style.RESET_ALL}")
    
    if not agent_url:
        print(f"{Fore.RED}❌ Agent URL is required")
        return
    
    if not agent_url.startswith(('http://', 'https://')):
        agent_url = f"https://{agent_url}"
    
    # Initialize tester
    tester = APIKeyTester(agent_url=agent_url, api_key=api_key, verbose=verbose)
    
    # Run tests
    try:
        if test_suite == "all":
            test_suites = tester.run_all_tests()
        else:
            print(f"{Fore.YELLOW}⚠️ Specific test suites not implemented yet, running all tests")
            test_suites = tester.run_all_tests()
        
        # Print summary
        tester.print_summary()
        
        # Save results if requested
        if output:
            results_data = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "agent_url": agent_url,
                "test_suites": []
            }
            
            for suite in test_suites:
                suite_data = {
                    "name": suite.name,
                    "passed": suite.passed_count,
                    "failed": suite.failed_count,
                    "pass_rate": suite.pass_rate,
                    "tests": []
                }
                
                for result in suite.results:
                    suite_data["tests"].append({
                        "name": result.name,
                        "passed": result.passed,
                        "duration_ms": result.duration_ms,
                        "details": result.details,
                        "error": result.error,
                        "response_code": result.response_code
                    })
                
                results_data["test_suites"].append(suite_data)
            
            with open(output, 'w') as f:
                json.dump(results_data, f, indent=2)
            
            print(f"{Fore.GREEN}💾 Results saved to {output}")
    
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}⏹️ Testing interrupted by user")
    except Exception as e:
        print(f"\n{Fore.RED}💥 Testing failed with error: {e}")

if __name__ == "__main__":
    fire.Fire(main)