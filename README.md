# AI Snippet Service

A service that generates AI-powered summaries of text content. Users can paste raw text (blog drafts, transcripts, etc.) and get back short, AI-generated summaries they can reuse elsewhere.

## Features

- **Create snippets** with AI-generated summaries
- **Browse all snippets** with search functionality
- **View individual snippets** with full details
- **RESTful API** with proper error handling
- **Modern UI** built with Remix and Tailwind CSS
- **Docker support** for easy deployment

## Tech Stack

- **Backend**: Node.js 20+, TypeScript, Express, MongoDB
- **Frontend**: Remix, React, TypeScript, Tailwind CSS
- **AI Provider**: OpenAI GPT-3.5-turbo
- **Testing**: Vitest, Supertest
- **Containerization**: Docker, Docker Compose

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- OpenAI API key

## Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-snippet-service
```

### 2. Environment Configuration

#### API Configuration

Copy the example environment file and configure it:

```bash
cp api/.env.example api/.env
```

Edit `api/.env` with your configuration:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/snippets

# AI Provider API Key (OpenAI, Gemini, or Hugging Face)
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### UI Configuration

Copy the example environment file and configure it:

```bash
cp ui/.env.example ui/.env
```

Edit `ui/.env` with your configuration:

```env
# API Configuration
API_URL=http://localhost:3000

# Server Configuration
PORT=3030
NODE_ENV=development
```

### 3. Obtain API Keys

#### OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `api/.env` file

**Note**: Keep your API key secure and never commit it to version control.

## Running the Application

### Option 1: Docker (Recommended)

```bash
# Start all services
docker compose up --build

# The application will be available at:
# - UI: http://localhost:3030
# - API: http://localhost:3000
# - MongoDB: localhost:27017
```

### Option 2: Local Development

#### Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or install MongoDB locally
```

#### Start API

```bash
cd api
npm install
npm run build
npm start
```

#### Start UI

```bash
cd ui
npm install
npm run dev
```

## Testing

### Run All Tests

```bash
# API Tests
cd api && npm test

# UI Tests
cd ui && npm test
```

### Run Tests with Coverage

```bash
# API Tests with Coverage
cd api && npm run test:coverage

# UI Tests with Coverage
cd ui && npm run test:coverage
```

## API Documentation

### Endpoints

#### Create Snippet
```bash
POST /snippets
Content-Type: application/json

{
  "title": "My Blog Post",
  "text": "This is the content I want summarized..."
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "summary": "AI-generated summary in ≤ 30 words"
}
```

#### Get Snippet by ID
```bash
GET /snippets/:id
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "My Blog Post",
  "text": "This is the content I want summarized...",
  "summary": "AI-generated summary in ≤ 30 words",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### List All Snippets
```bash
GET /snippets
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "My Blog Post",
    "text": "This is the content I want summarized...",
    "summary": "AI-generated summary in ≤ 30 words",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

### Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (AI rate limit)

## Development

### Project Structure

```
ai-snippet-service/
├── api/                    # Backend API
│   ├── src/
│   │   ├── __tests__/     # API tests
│   │   ├── ai/            # AI integration
│   │   ├── models/        # Database models
│   │   └── app.ts         # Express app
│   ├── Dockerfile
│   └── .env.example
├── ui/                     # Frontend UI
│   ├── app/
│   │   ├── __tests__/     # UI tests
│   │   ├── components/    # React components
│   │   └── routes/        # Remix routes
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

### Code Quality

```bash
# Lint API
cd api && npm run lint

# Lint UI
cd ui && npm run lint

# Format code
cd api && npm run format
cd ui && npm run format
```

## Post-Challenge Reflection

### What I'd Improve with More Time

1. **Authentication & Authorization**: Implement JWT-based authentication for snippet ownership
2. **Pagination & Sorting**: Add pagination to the snippets list and sorting options
3. **Streaming Responses**: Implement Server-Sent Events for real-time AI summary generation
4. **Rate Limiting**: Add proper rate limiting for API endpoints
5. **Caching**: Implement Redis caching for frequently accessed snippets
6. **Monitoring**: Add logging, metrics, and health monitoring
7. **CI/CD Pipeline**: Complete the GitHub Actions pipeline with deployment

### Trade-offs Made

1. **Simplicity over Features**: Focused on core functionality rather than advanced features
2. **Development Speed**: Used familiar tech stack (Remix, Express) for faster development
3. **Testing Coverage**: Prioritized integration tests over unit tests for better confidence
4. **UI Polish**: Focused on functionality over perfect UI/UX design
5. **Error Handling**: Implemented basic error handling rather than comprehensive error management

### Time Management

- **Core Implementation**: ~2.5 hours
- **Testing**: ~30 minutes
- **Documentation**: ~30 minutes
- **Docker Setup**: ~30 minutes

The core specification was completed within the 3-hour timebox, with additional time spent on testing and documentation.

## License

MIT License - see LICENSE file for details.
