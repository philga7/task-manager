# Claude Code PM Backend API Documentation

## Overview

This is a FastAPI-based backend service that provides integration with Claude Code PM and task management capabilities for your React frontend.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: TBD

## Authentication

Currently, the API does not require authentication. In production, you should implement JWT-based authentication.

## API Endpoints

### Health Check Endpoints

#### GET `/`
Basic health check endpoint.

**Response:**
```json
{
  "message": "Claude Code PM Backend is running!",
  "status": "healthy",
  "version": "0.1.0"
}
```

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "claude-code-pm-backend",
  "version": "0.1.0"
}
```

#### GET `/api/v1/health/detailed`
Detailed health check with system information.

**Response:**
```json
{
  "status": "healthy",
  "service": "claude-code-pm-backend",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "0.1.0",
  "system": {
    "cpu_percent": 25.5,
    "memory_percent": 45.2,
    "disk_percent": 60.1,
    "process_id": 12345
  }
}
```

### Claude Code PM Endpoints

#### GET `/api/v1/claude-pm/status`
Check Claude Code PM installation and status.

**Response:**
```json
{
  "status": "operational",
  "claude_pm_installed": true,
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "endpoints": [
    "/api/v1/claude-pm/status",
    "/api/v1/claude-pm/config",
    "/api/v1/claude-pm/epics"
  ]
}
```

#### GET `/api/v1/claude-pm/config`
Get Claude Code PM configuration information.

**Response:**
```json
{
  "config_files_found": ["~/.claude/config.json"],
  "config_directory": "~/.claude",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET `/api/v1/claude-pm/epics`
List available Claude Code PM epics.

**Response:**
```json
{
  "epics": [
    {
      "id": "test-epic-1",
      "name": "Test Epic",
      "status": "active",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total_count": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST `/api/v1/claude-pm/epics`
Create a new Claude Code PM epic.

**Request Body:**
```json
{
  "name": "New Epic Name",
  "description": "Epic description"
}
```

**Response:**
```json
{
  "epic_id": "new-epic-123",
  "name": "New Epic Name",
  "status": "created",
  "created_at": "2024-01-15T10:30:00.000Z",
  "message": "Epic created successfully (mock response)"
}
```

### Task Management Endpoints

#### GET `/api/v1/tasks`
Get all tasks.

**Response:**
```json
[
  {
    "id": "task_1_1705312200",
    "title": "Test Task",
    "description": "Task description",
    "priority": "high",
    "status": "pending",
    "due_date": "2024-01-15",
    "project_id": "project_1",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET `/api/v1/tasks/{task_id}`
Get a specific task by ID.

**Response:**
```json
{
  "id": "task_1_1705312200",
  "title": "Test Task",
  "description": "Task description",
  "priority": "high",
  "status": "pending",
  "due_date": "2024-01-15",
  "project_id": "project_1",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

#### POST `/api/v1/tasks`
Create a new task.

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "due_date": "2024-01-20",
  "project_id": "project_1"
}
```

**Response:**
```json
{
  "id": "task_2_1705312300",
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "status": "pending",
  "due_date": "2024-01-20",
  "project_id": "project_1",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

#### PUT `/api/v1/tasks/{task_id}`
Update an existing task.

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "status": "completed",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "task_1_1705312200",
  "title": "Updated Task Title",
  "description": "Updated description",
  "priority": "high",
  "status": "completed",
  "due_date": "2024-01-15",
  "project_id": "project_1",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:35:00.000Z"
}
```

#### DELETE `/api/v1/tasks/{task_id}`
Delete a task.

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

#### GET `/api/v1/tasks/status/summary`
Get task summary statistics.

**Response:**
```json
{
  "total_tasks": 10,
  "pending_tasks": 7,
  "completed_tasks": 3,
  "completion_rate": 30.0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a detail message:

```json
{
  "detail": "Error message describing what went wrong"
}
```

## CORS Configuration

The API is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)

## Development

### Running the Server

```bash
cd backend
python main.py
```

The server will start on `http://localhost:8000`

### Testing the API

```bash
cd backend
python test_api.py
```

### API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Data Models

### Task Model

```python
class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    priority: str  # "low", "medium", "high"
    status: str    # "pending", "in_progress", "completed"
    due_date: Optional[str]
    project_id: Optional[str]
    created_at: str
    updated_at: str
```

## Future Enhancements

1. **Database Integration** - Replace mock storage with a real database
2. **Authentication** - Implement JWT-based authentication
3. **Real Claude Code PM Integration** - Connect to actual Claude Code PM CLI
4. **WebSocket Support** - Real-time updates for task changes
5. **File Upload** - Support for task attachments
6. **Search and Filtering** - Advanced task search capabilities
