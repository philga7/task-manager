# Claude Code PM Backend

Python backend for Claude Code PM agent coordination and task management.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Test the environment:**
   ```bash
   python test_environment.py
   ```

5. **Run the development server:**
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── app/                    # Application modules
│   ├── api/               # API routes and endpoints
│   ├── core/              # Core application logic
│   ├── models/            # Data models and schemas
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── venv/                  # Virtual environment (created)
├── main.py               # FastAPI application entry point
├── config.py             # Configuration management
├── requirements.txt      # Python dependencies
├── test_environment.py   # Environment test script
└── README.md            # This file
```

## 🔧 Development Guidelines

### Code Style
- Use **Black** for code formatting: `black .`
- Use **Flake8** for linting: `flake8 .`
- Follow PEP 8 style guidelines

### Testing
- Write tests in the `tests/` directory
- Use pytest for testing: `pytest tests/`
- Run tests with coverage: `pytest --cov=app tests/`

### Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
# Edit .env with your actual values
```

### API Documentation
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## 🛠️ Available Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /api/status` - API status information
- `GET /docs` - Interactive API documentation

## 🔗 Integration with Frontend

The backend is configured to work with your React frontend:
- CORS enabled for `http://localhost:5173` (Vite dev server)
- CORS enabled for `http://localhost:3000` (Create React App dev server)

## 📚 Learning Resources

### Python Concepts
- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Data Validation](https://pydantic-docs.helpmanual.io/)

### Development Tools
- [Black Code Formatter](https://black.readthedocs.io/)
- [Flake8 Linter](https://flake8.pycqa.org/)
- [Pytest Testing Framework](https://docs.pytest.org/)

## 🚨 Troubleshooting

### Common Issues

1. **Import errors**: Make sure virtual environment is activated
2. **Port already in use**: Change PORT in config.py or .env
3. **CORS errors**: Check ALLOWED_ORIGINS in configuration

### Getting Help
- Check the test script: `python test_environment.py`
- Review FastAPI logs for detailed error messages
- Ensure all dependencies are installed: `pip list`

## 🔄 Next Steps

1. **Add API endpoints** for Claude Code PM integration
2. **Implement authentication** with JWT tokens
3. **Add database models** for task management
4. **Create agent coordination services**
5. **Add comprehensive test coverage**
