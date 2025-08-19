# API Documentation

This document provides detailed information about the AI Assistant API endpoints and their usage.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints (except health checks) require authentication. The application uses NextAuth.js with session-based authentication.

### Headers

```http
Cookie: next-auth.session-token=<session-token>
```

## Endpoints

### Authentication

#### GET/POST `/api/auth/[...nextauth]`

NextAuth.js authentication endpoints for OAuth providers.

**Supported Providers:**
- Google OAuth
- GitHub OAuth

**Example Usage:**
```javascript
// Redirect to OAuth provider
window.location.href = '/api/auth/signin/google'

// Sign out
window.location.href = '/api/auth/signout'
```

### Chat Operations

#### POST `/api/chat`

Send a message to the AI assistant and receive a streaming response.

**Request Body:**
```json
{
  "message": "What's the weather like in Tokyo?",
  "chatId": "optional-chat-id"
}
```

**Response:**
- Content-Type: `text/plain; charset=utf-8`
- Streaming response with AI-generated content

**Example:**
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "What's the current price of AAPL?",
    chatId: "chat_123"
  })
});

const reader = response.body.getReader();
// Handle streaming response
```

### Chat Management

#### GET `/api/chats`

Retrieve all chats for the authenticated user.

**Response:**
```json
{
  "chats": [
    {
      "id": "chat_123",
      "title": "Weather Discussion",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z",
      "userId": "user_456"
    }
  ]
}
```

#### POST `/api/chats`

Create a new chat.

**Request Body:**
```json
{
  "title": "New Chat Title"
}
```

**Response:**
```json
{
  "chat": {
    "id": "chat_789",
    "title": "New Chat Title",
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z",
    "userId": "user_456"
  }
}
```

#### GET `/api/chats/[chatId]`

Retrieve a specific chat and its messages.

**Parameters:**
- `chatId`: Chat identifier

**Response:**
```json
{
  "chat": {
    "id": "chat_123",
    "title": "Weather Discussion",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "userId": "user_456"
  },
  "messages": [
    {
      "id": "msg_001",
      "chatId": "chat_123",
      "role": "user",
      "content": "What's the weather in Tokyo?",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg_002",
      "chatId": "chat_123",
      "role": "assistant",
      "content": "The current weather in Tokyo is...",
      "toolResults": [...],
      "createdAt": "2024-01-15T10:31:00Z"
    }
  ]
}
```

#### DELETE `/api/chats/[chatId]`

Delete a specific chat and all its messages.

**Parameters:**
- `chatId`: Chat identifier

**Response:**
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

#### POST `/api/chats/[chatId]/messages`

Add a message to a specific chat.

**Parameters:**
- `chatId`: Chat identifier

**Request Body:**
```json
{
  "role": "user",
  "content": "What's the latest F1 standings?",
  "toolResults": []
}
```

**Response:**
```json
{
  "message": {
    "id": "msg_003",
    "chatId": "chat_123",
    "role": "user",
    "content": "What's the latest F1 standings?",
    "createdAt": "2024-01-15T10:35:00Z"
  }
}
```

### System Health

#### GET `/api/health`

Check the overall system health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00Z",
  "services": {
    "database": "healthy",
    "ai": "healthy",
    "external_apis": "healthy"
  }
}
```

#### GET `/api/check-db`

Check database connection and schema.

**Response:**
```json
{
  "database": {
    "connected": true,
    "tables": ["users", "accounts", "sessions", "chats", "messages"],
    "lastChecked": "2024-01-15T12:00:00Z"
  }
}
```

## AI Tools

The AI assistant can automatically invoke external tools based on user queries. These tools are not directly accessible via API but are triggered through the chat interface.

### Available Tools

#### Weather Tool
- **Function**: `getWeather`
- **Parameters**: `city`, `country` (optional)
- **Data Source**: OpenWeatherMap API
- **Triggers**: Weather-related queries

#### F1 Racing Tool
- **Function**: `getF1Data`
- **Parameters**: `type` (standings, schedule, results), `season` (optional)
- **Data Source**: Ergast F1 API
- **Triggers**: Formula 1 related queries

#### Stock Market Tool
- **Function**: `getStockPrice`
- **Parameters**: `symbol`, `interval` (optional)
- **Data Source**: Alpha Vantage API
- **Triggers**: Stock market and financial queries

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "message",
      "issue": "Message cannot be empty"
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User not authorized for this resource
- `VALIDATION_ERROR`: Invalid request parameters
- `RATE_LIMITED`: Too many requests
- `EXTERNAL_API_ERROR`: External service unavailable
- `DATABASE_ERROR`: Database operation failed

## Rate Limiting

- **Chat API**: 60 requests per minute per user
- **External Tools**: 100 requests per hour per user
- **Authentication**: No limit

## WebSocket Support

Real-time chat updates are supported via Server-Sent Events (SSE) through the streaming chat endpoint.

## SDK Examples

### JavaScript/TypeScript

```javascript
class AIAssistantClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  async sendMessage(message, chatId) {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chatId })
    });
    return this.handleStreamingResponse(response);
  }

  async getChats() {
    const response = await fetch(`${this.baseURL}/chats`);
    return response.json();
  }

  async createChat(title) {
    const response = await fetch(`${this.baseURL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return response.json();
  }

  async handleStreamingResponse(response) {
    const reader = response.body.getReader();
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      result += new TextDecoder().decode(value);
    }
    
    return result;
  }
}
```

### Python

```python
import requests
import json

class AIAssistantClient:
    def __init__(self, base_url="/api"):
        self.base_url = base_url
        
    def send_message(self, message, chat_id=None):
        response = requests.post(
            f"{self.base_url}/chat",
            json={"message": message, "chatId": chat_id}
        )
        return response.text
        
    def get_chats(self):
        response = requests.get(f"{self.base_url}/chats")
        return response.json()
        
    def create_chat(self, title):
        response = requests.post(
            f"{self.base_url}/chats",
            json={"title": title}
        )
        return response.json()
```

## Testing

### Example Test Cases

```javascript
// Test chat creation
const chat = await client.createChat("Test Chat");
assert(chat.chat.title === "Test Chat");

// Test message sending
const response = await client.sendMessage("Hello", chat.chat.id);
assert(response.length > 0);

// Test tool calling
const weatherResponse = await client.sendMessage("Weather in Tokyo");
assert(weatherResponse.includes("temperature"));
```

### Health Check

```bash
curl -X GET http://localhost:3000/api/health
```

### Authentication Test

```bash
curl -X GET http://localhost:3000/api/chats \
  -H "Cookie: next-auth.session-token=your-session-token"
```
