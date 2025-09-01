#!/usr/bin/env python3
"""
Test script to verify Python environment setup
"""
import sys
import importlib

def test_imports():
    """Test that all required packages can be imported"""
    packages = [
        'fastapi',
        'uvicorn',
        'requests',
        'pydantic',
        'dotenv',  # python-dotenv imports as dotenv
        'jwt',     # PyJWT imports as jwt
        'cryptography',
        'httpx',
        'structlog'
    ]
    
    print("🧪 Testing Python environment setup...")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print()
    
    failed_imports = []
    
    for package in packages:
        try:
            # Handle package name differences
            import_name = package.replace('-', '_')
            module = importlib.import_module(import_name)
            version = getattr(module, '__version__', 'unknown')
            print(f"✅ {package} (v{version})")
        except ImportError as e:
            print(f"❌ {package} - Import failed: {e}")
            failed_imports.append(package)
    
    print()
    if failed_imports:
        print(f"❌ {len(failed_imports)} package(s) failed to import:")
        for package in failed_imports:
            print(f"   - {package}")
        return False
    else:
        print("🎉 All packages imported successfully!")
        return True

def test_fastapi_app():
    """Test FastAPI app creation"""
    try:
        from main import app
        print("✅ FastAPI app created successfully")
        print(f"   App title: {app.title}")
        print(f"   App version: {app.version}")
        return True
    except Exception as e:
        print(f"❌ FastAPI app creation failed: {e}")
        return False

def test_config():
    """Test configuration loading"""
    try:
        from config import config
        print("✅ Configuration loaded successfully")
        print(f"   Port: {config.PORT}")
        print(f"   Environment: {config.ENVIRONMENT}")
        print(f"   Debug mode: {config.DEBUG}")
        return True
    except Exception as e:
        print(f"❌ Configuration loading failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Claude Code PM Python Environment Test")
    print("=" * 50)
    
    tests = [
        ("Package Imports", test_imports),
        ("FastAPI App", test_fastapi_app),
        ("Configuration", test_config)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Python environment is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
