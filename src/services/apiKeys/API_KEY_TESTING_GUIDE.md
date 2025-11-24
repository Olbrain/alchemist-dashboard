# API Key Testing Guide

## Overview

This comprehensive testing script validates the secure API key authentication system for deployed agents. It tests authentication, authorization, rate limiting, usage tracking, security measures, and performance under load.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements_test.txt
```

### 2. Basic Usage

```bash
# Test with a valid API key (recommended)
python test_api_keys.py --agent-url https://your-agent.run.app --api-key ak_your_test_key_here

# Test without API key (limited functionality)
python test_api_keys.py --agent-url https://your-agent.run.app

# Verbose output
python test_api_keys.py --agent-url https://your-agent.run.app --api-key ak_test_key --verbose

# Save results to file
python test_api_keys.py --agent-url https://your-agent.run.app --api-key ak_test_key --output results.json
```

### 3. Local Testing

```bash
# Test locally running agent
python test_api_keys.py --agent-url http://localhost:8000 --api-key ak_test_key
```

## Test Suites

### 🔧 Basic Functionality
- **Health Check**: Validates public health endpoint
- **Auth Info (No Key)**: Tests unauthenticated endpoint access
- **Auth Info (With Key)**: Validates API key authentication info

### 🔐 API Key Authentication  
- **Valid Key Test**: Tests conversation creation with valid API key
- **Invalid Key Test**: Ensures invalid keys are rejected (401)
- **No Key Test**: Ensures protected endpoints require authentication
- **Malformed Keys**: Tests various invalid key formats

### ⚡ Feature Tests
- **Send Message**: Tests complete conversation flow
- **Usage Stats**: Validates usage tracking and statistics

### 🚀 Performance & Load
- **Rate Limiting**: Tests rate limit enforcement
- **Concurrent Requests**: Tests concurrent API key usage

### 🛡️ Security
- **Security Headers**: Checks for security-related HTTP headers
- **Input Validation**: Tests malformed inputs and edge cases

## Test Results

### ✅ Success Indicators
- Green checkmarks for passed tests
- Response times under 500ms
- 95%+ pass rate overall
- Proper 401 responses for invalid keys
- Usage tracking working correctly

### ❌ Failure Indicators
- Red X marks for failed tests
- 500 server errors
- Incorrect authentication behavior
- Missing security headers
- Poor performance (>2s response times)

### 📊 Example Output

```
🚀 API Key Tester Initialized
Agent URL: https://your-agent.run.app
API Key: ✅ Provided
Verbose: True
============================================================

🧪 Running: Health Check
✅ Health Check (145.2ms)

🧪 Running: Auth Info (No Key)  
✅ Auth Info (No Key) (89.7ms)

🧪 Running: Auth Info (With Key)
✅ Auth Info (With Key) (156.3ms)

🧪 Running: Create Conversation (Valid Key)
✅ Create Conversation (Valid Key) (234.8ms)

🧪 Running: Create Conversation (Invalid Key)
✅ Create Conversation (Invalid Key) (98.1ms)

============================================================
🎯 TEST RESULTS SUMMARY
============================================================

📊 Basic Functionality
   Passed: 3/3 (100.0%)

📊 API Key Authentication  
   Passed: 4/4 (100.0%)

📊 Feature Tests
   Passed: 2/2 (100.0%)

📊 Performance & Load
   Passed: 2/2 (100.0%)

📊 Security
   Passed: 1/1 (100.0%)

🏆 OVERALL RESULTS
   Total Tests: 12
   Passed: 12
   Failed: 0
   Pass Rate: 100.0%
   Total Duration: 1,847.3ms (1.85s)
   Avg Response Time: 153.9ms
   Request Rate: 6.5 req/sec

💡 RECOMMENDATIONS
   - API key system is working well! ✨
============================================================
```

## Advanced Usage

### Custom Test Configuration

```python
# Create custom test instance
from test_api_keys import APIKeyTester

tester = APIKeyTester(
    agent_url="https://your-agent.run.app",
    api_key="ak_your_key", 
    verbose=True
)

# Run specific tests
result = tester.run_test("Health Check", tester.test_health_check)
print(f"Test passed: {result.passed}")

# Run all tests
suites = tester.run_all_tests()
tester.print_summary()
```

### Integration with CI/CD

```yaml
# GitHub Actions example
- name: Test API Keys
  run: |
    pip install -r requirements_test.txt
    python test_api_keys.py \
      --agent-url ${{ secrets.AGENT_URL }} \
      --api-key ${{ secrets.TEST_API_KEY }} \
      --output test-results.json
    
    # Check pass rate
    python -c "
    import json
    with open('test-results.json') as f:
        results = json.load(f)
    total_passed = sum(suite['passed'] for suite in results['test_suites'])  
    total_tests = sum(len(suite['tests']) for suite in results['test_suites'])
    pass_rate = total_passed / total_tests * 100
    assert pass_rate >= 95, f'Pass rate {pass_rate:.1f}% below 95% threshold'
    print(f'✅ All tests passed ({pass_rate:.1f}%)')
    "
```

### Load Testing

For more intensive load testing:

```bash
# Run multiple test instances in parallel
for i in {1..5}; do
    python test_api_keys.py --agent-url https://your-agent.run.app --api-key ak_key_$i &
done
wait

# Monitor resource usage during tests
top -p $(pgrep -f test_api_keys.py)
```

## Test Data Requirements

### Valid API Key
- Must be created through the frontend UI
- Should belong to the same agent being tested
- Must have `active` status
- Should have appropriate permissions

### Agent Requirements  
- Must be deployed and accessible
- Should have API key middleware installed
- Must respond to health checks
- Should implement all tested endpoints

## Troubleshooting

### Common Issues

**❌ Connection Errors**
```bash
# Check agent URL is accessible
curl https://your-agent.run.app/health

# Verify SSL/TLS configuration
curl -v https://your-agent.run.app/health
```

**❌ Authentication Failures**
```bash
# Verify API key format (should start with ak_)
echo $API_KEY | grep "^ak_"

# Test key manually
curl -H "Authorization: Bearer ak_your_key" \
     https://your-agent.run.app/auth/info
```

**❌ Rate Limiting Issues**
```bash
# Check current rate limits
curl -H "Authorization: Bearer ak_your_key" \
     -I https://your-agent.run.app/api/usage/stats
```

**❌ Firestore Permissions**
```bash
# Verify service account has Firestore access
# Check IAM roles: Firestore User, Firebase Admin SDK Administrator Service Agent
```

### Debug Mode

```bash
# Run with maximum verbosity
python test_api_keys.py \
    --agent-url https://your-agent.run.app \
    --api-key ak_your_key \
    --verbose \
    2>&1 | tee debug.log

# Check specific test failures
grep "❌" debug.log
```

### Performance Analysis

```bash
# Analyze response times
python -c "
import json
with open('results.json') as f:
    results = json.load(f)
    
durations = []
for suite in results['test_suites']:
    for test in suite['tests']:
        durations.append(test['duration_ms'])

print(f'Avg: {sum(durations)/len(durations):.1f}ms')
print(f'Max: {max(durations):.1f}ms') 
print(f'Min: {min(durations):.1f}ms')
"
```

## Security Considerations

### Test API Keys
- **Use dedicated test keys** - Don't use production API keys
- **Rotate test keys regularly** - Generate new keys for testing
- **Limit test key permissions** - Use minimal required permissions
- **Monitor test key usage** - Track usage to detect anomalies

### Environment Isolation
- Test against staging/dev environments first
- Use separate Firestore projects for testing
- Avoid testing against production endpoints
- Clean up test data after testing

### Data Privacy
- Don't log actual API keys in test output
- Mask sensitive data in test results
- Don't commit API keys to version control
- Use environment variables for sensitive data

## Extension Points

### Custom Test Cases

```python
def test_custom_endpoint(self) -> TestResult:
    \"\"\"Add your custom test here\"\"\"
    headers = self._create_auth_header()
    response, duration = self._make_request('GET', '/your/endpoint', headers=headers)
    
    return TestResult(
        name="Custom Test",
        passed=response.status_code == 200,
        duration_ms=duration,
        details="Your custom test logic"
    )

# Add to test suite
tester = APIKeyTester(agent_url, api_key)
result = tester.run_test("Custom Test", test_custom_endpoint)
```

### Metrics Integration

```python
# Send results to monitoring system
def send_to_metrics(test_results):
    for suite in test_results:
        for result in suite.results:
            # Send to Prometheus/Grafana/etc
            metrics.counter('api_test.results', {
                'test_name': result.name,
                'passed': result.passed,
                'duration_ms': result.duration_ms
            })
```

This comprehensive testing script ensures your API key authentication system is secure, performant, and ready for production use! 🚀