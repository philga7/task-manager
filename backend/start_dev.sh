#!/bin/bash

# Claude Code PM Backend Development Startup Script

echo "🚀 Starting Claude Code PM Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Test environment
echo "🧪 Testing environment..."
python test_environment.py

if [ $? -ne 0 ]; then
    echo "❌ Environment test failed. Please check the errors above."
    exit 1
fi

echo "✅ Environment test passed!"

# Start the development server
echo "🌐 Starting FastAPI development server..."
echo "📖 API Documentation will be available at: http://localhost:8000/docs"
echo "🔗 Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
