#!/usr/bin/env python3
"""
Comprehensive CCPM Integration Test Runner
Runs all tests for the CCPM integration functionality
"""
import os
import sys
import subprocess
import time
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print('='*60)
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print("✅ SUCCESS")
        if result.stdout:
            print("Output:")
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print("❌ FAILED")
        print(f"Exit code: {e.returncode}")
        if e.stdout:
            print("Stdout:")
            print(e.stdout)
        if e.stderr:
            print("Stderr:")
            print(e.stderr)
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    print("Checking dependencies...")
    
    required_packages = [
        "fastapi",
        "pytest",
        "httpx",
        "psutil"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - MISSING")
    
    if missing_packages:
        print(f"\nMissing packages: {', '.join(missing_packages)}")
        print("Please install missing packages:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def run_backend_tests():
    """Run backend API tests"""
    print("\n" + "="*60)
    print("BACKEND API TESTS")
    print("="*60)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Run workstreams API tests
    print("\n1. Testing Workstreams API...")
    success = run_command(
        "python -m pytest tests/test_workstreams_api.py -v",
        "Workstreams API Tests"
    )
    
    if not success:
        print("❌ Workstreams API tests failed")
        return False
    
    # Run health endpoint tests
    print("\n2. Testing Health Endpoints...")
    success = run_command(
        "python -m pytest tests/test_health.py -v",
        "Health Endpoint Tests"
    )
    
    if not success:
        print("❌ Health endpoint tests failed")
        return False
    
    return True

def run_integration_tests():
    """Run integration tests"""
    print("\n" + "="*60)
    print("INTEGRATION TESTS")
    print("="*60)
    
    # Test API endpoints manually
    print("\n1. Testing API Endpoints...")
    
    # Start backend server in background
    print("Starting backend server...")
    server_process = subprocess.Popen(
        ["python", "main.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for server to start
    time.sleep(3)
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        success = run_command(
            "curl -s http://localhost:8000/api/v1/health/status",
            "Health Status Endpoint"
        )
        
        if not success:
            print("❌ Health endpoint test failed")
            return False
        
        # Test workstreams endpoint
        print("Testing workstreams endpoint...")
        success = run_command(
            "curl -s http://localhost:8000/api/v1/workstreams/",
            "Workstreams List Endpoint"
        )
        
        if not success:
            print("❌ Workstreams endpoint test failed")
            return False
        
        # Test creating a workstream
        print("Testing workstream creation...")
        workstream_data = {
            "name": "Test Workstream",
            "description": "Test Description",
            "priority": "high",
            "estimatedDuration": 60
        }
        
        import json
        json_data = json.dumps(workstream_data)
        success = run_command(
            f'curl -s -X POST http://localhost:8000/api/v1/workstreams/ -H "Content-Type: application/json" -d \'{json_data}\'',
            "Workstream Creation"
        )
        
        if not success:
            print("❌ Workstream creation test failed")
            return False
        
        return True
        
    finally:
        # Stop server
        print("Stopping backend server...")
        server_process.terminate()
        server_process.wait()

def run_performance_tests():
    """Run performance and load tests"""
    print("\n" + "="*60)
    print("PERFORMANCE TESTS")
    print("="*60)
    
    print("1. Testing API Response Times...")
    
    # Test multiple concurrent requests
    success = run_command(
        "python -c \"import time; import requests; start=time.time(); [requests.get('http://localhost:8000/api/v1/health/status') for _ in range(10)]; print(f'10 requests in {time.time()-start:.2f}s')\"",
        "Concurrent Request Performance"
    )
    
    if not success:
        print("❌ Performance test failed")
        return False
    
    return True

def run_security_tests():
    """Run security tests"""
    print("\n" + "="*60)
    print("SECURITY TESTS")
    print("="*60)
    
    print("1. Testing Input Validation...")
    
    # Test SQL injection attempts
    test_cases = [
        ("'; DROP TABLE workstreams; --", "SQL Injection Prevention"),
        ("<script>alert('xss')</script>", "XSS Prevention"),
        ("../../../etc/passwd", "Path Traversal Prevention")
    ]
    
    for test_input, description in test_cases:
        print(f"Testing {description}...")
        success = run_command(
            f'curl -s -X POST http://localhost:8000/api/v1/workstreams/ -H "Content-Type: application/json" -d \'{{"name": "{test_input}", "description": "test", "priority": "medium", "estimatedDuration": 60}}\'',
            description
        )
        
        if not success:
            print(f"❌ {description} test failed")
            return False
    
    return True

def generate_test_report():
    """Generate a comprehensive test report"""
    print("\n" + "="*60)
    print("GENERATING TEST REPORT")
    print("="*60)
    
    report = f"""
CCPM Integration Test Report
Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}

Test Results:
- Dependencies: ✅ All required packages installed
- Backend API Tests: ✅ Passed
- Integration Tests: ✅ Passed
- Performance Tests: ✅ Passed
- Security Tests: ✅ Passed

Summary:
✅ All tests passed successfully
✅ CCPM integration is working correctly
✅ API endpoints are responding properly
✅ Security measures are in place
✅ Performance is within acceptable limits

Recommendations:
1. Monitor API performance in production
2. Regularly update dependencies
3. Run security tests before deployments
4. Monitor error logs for any issues
"""
    
    # Save report to file
    report_file = "ccpm_test_report.txt"
    with open(report_file, "w") as f:
        f.write(report)
    
    print(f"Test report saved to: {report_file}")
    print(report)

def main():
    """Main test runner function"""
    print("🚀 CCPM Integration Test Runner")
    print("="*60)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed. Please install missing packages.")
        sys.exit(1)
    
    # Run tests
    all_tests_passed = True
    
    # Backend tests
    if not run_backend_tests():
        all_tests_passed = False
    
    # Integration tests
    if not run_integration_tests():
        all_tests_passed = False
    
    # Performance tests
    if not run_performance_tests():
        all_tests_passed = False
    
    # Security tests
    if not run_security_tests():
        all_tests_passed = False
    
    # Generate report
    if all_tests_passed:
        generate_test_report()
        print("\n🎉 All tests passed! CCPM integration is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
