# Mohit AI Backend

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19.2-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.15.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

</div>

Backend API for Mohit AI - The revolutionary Inbound SDR Platform that responds to leads in under 5 minutes with AI-powered intelligence and multi-channel communication.

## 🚀 Features

### Core Capabilities
- **⚡ Sub-5-Minute Response Time**: Industry-leading response time to capture leads while they're hot
- **🤖 AI-Powered Lead Qualification**: Advanced ML models for accurate lead scoring and qualification
- **📞 Multi-Channel Communication**: Seamlessly engage via Voice, SMS, Email, and Live Chat
- **🔗 CRM Integrations**: Native integrations with HubSpot, Salesforce, Pipedrive, and more
- **📊 Real-Time Analytics**: Comprehensive dashboards with actionable insights
- **🔐 Enterprise Security**: JWT authentication, rate limiting, and data encryption
- **🎯 Smart Lead Routing**: AI-based lead assignment and prioritization
- **📈 Performance Monitoring**: Built-in metrics and health monitoring

### Advanced Features
- **Voice AI Integration**: Natural conversations using ElevenLabs voice synthesis
- **Intelligent Follow-ups**: Automated nurture sequences based on lead behavior
- **A/B Testing**: Built-in experimentation framework for optimization
- **Webhook Support**: Real-time event streaming for external integrations
- **Queue Management**: Robust job processing with Bull and Redis
- **WebSocket Support**: Real-time updates and notifications

### 🤖 AI Calls Features
- **🎙️ AI-Powered Calling**: Automated outbound calls with AI agents
- **📝 Real-Time Transcription**: Live call transcription with speaker identification
- **💡 AI Insights**: Real-time generation of insights, sentiment analysis, and action items
- **🎤 Voice Synthesis**: Natural-sounding AI voices with multiple options
- **📋 Call Queue Management**: Intelligent queue system with priority handling
- **🃏 Content Cards**: Contextual content cards with pricing, competitor info, and talking points
- **🎛️ Progressive Settings**: UI complexity control with 4 levels (Overview, Basic, Detailed, Advanced)
- **🔧 AI Behavior Adjustment**: Fine-tune AI response characteristics (speed, formality, empathy, technical detail)
- **📊 Real-Time Metrics**: Live call metrics and performance analytics
- **🛡️ Compliance Features**: Call recording announcements, AI disclosure, data retention policies

## 🛠️ Technology Stack

### Backend Core
- **Node.js 18+**: Modern JavaScript runtime with ES modules
- **Express 4.19.2**: Fast, minimalist web framework
- **TypeScript Support**: Type safety and better developer experience

### Database & ORM
- **PostgreSQL 15+**: Robust relational database
- **Prisma 5.15.0**: Next-generation ORM with type safety
- **Redis 7+**: In-memory data store for caching and queues

### AI & Communication
- **OpenAI GPT-4**: Advanced language understanding and generation
- **Google Generative AI**: Alternative AI provider with redundancy
- **Twilio**: Voice calls, SMS, and programmable communications
- **ElevenLabs**: Realistic AI voice synthesis
- **SendGrid**: Transactional email delivery
- **AI Service Factory**: Fallback mechanism between AI providers

### Real-time & Queuing
- **Socket.io 4.7.5**: Bi-directional real-time communication
- **Bull 4.12.9**: Redis-based queue for background jobs
- **Node-cron 3.0.3**: Scheduled task execution

### Security & Monitoring
- **Helmet 7.1.0**: Security headers middleware
- **JWT**: Secure authentication tokens
- **Bcrypt**: Password hashing
- **Rate Limiting**: API protection
- **Winston & Pino**: Advanced logging
- **Compression**: Response optimization

## 📊 Performance Metrics

- **Response Time**: < 5 minutes average lead response
- **Uptime**: 99.9% availability SLA
- **Throughput**: 10,000+ concurrent leads
- **API Latency**: < 100ms p99
- **Queue Processing**: 1,000 jobs/minute

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Twilio account (for voice/SMS)
- API keys for AI services

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Mohit4022-cloud/Mohit-AI-Backend.git
cd Mohit-AI-Backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Also copy AI-specific environment variables
cp .env.ai-calls.example .env.ai-calls
# Edit .env with your configuration
```

4. **Set up the database:**
```bash
npx prisma generate
npx prisma migrate deploy
```

5. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Production Deployment

```bash
# Build and start production server
npm start
```

## 📁 Project Structure

```
Mohit-AI-Backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── analytics.controller.js
│   │   ├── auth.controller.js
│   │   ├── call.controller.js
│   │   └── lead.controller.js
│   ├── middleware/        # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── models/           # Data models
│   │   ├── lead.model.js
│   │   └── leadActivity.model.js
│   ├── routes/           # API routes
│   │   ├── analytics.routes.js
│   │   ├── auth.routes.js
│   │   ├── call.routes.js
│   │   └── lead.routes.js
│   ├── services/         # Business logic
│   │   ├── ai/          # AI integrations
│   │   │   ├── aiServiceFactory.js    # AI provider management
│   │   │   ├── aiCallsService.js      # AI call management
│   │   │   ├── aiVoiceService.js      # Voice synthesis
│   │   │   ├── contentCardsService.js  # Content cards
│   │   │   ├── progressiveSettingsService.js # UI control
│   │   │   ├── elevenLabsService.js   # ElevenLabs integration
│   │   │   ├── openaiService.js       # OpenAI integration
│   │   │   └── googleAIService.js     # Google AI integration
│   │   ├── analytics/   # Metrics and analytics
│   │   ├── crm/         # CRM integrations
│   │   ├── notification/# Notification system
│   │   ├── queue/       # Job processing
│   │   ├── websocket/   # Real-time communication
│   │   └── twilio/      # Communication services
│   ├── utils/           # Utilities
│   ├── workers/         # Background workers
│   └── server.js        # Application entry point
├── scripts/             # Utility scripts
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Server
NODE_ENV=production
PORT=5000
BASE_URL=https://api.mohit-ai.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/mohit_ai

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI Services
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
GOOGLE_GENERATIVE_AI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# AI Calls Configuration
ENABLE_AI_CALLS=true
ENABLE_AI_TRANSCRIPTION=true
ENABLE_AI_INSIGHTS=true
MAX_CONCURRENT_AI_CALLS=3

# Communication
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Redis
REDIS_URL=redis://localhost:6379

# WebSocket
WEBSOCKET_PORT=3001
WEBSOCKET_PATH=/socket.io/

# Monitoring
SENTRY_DSN=https://...
```

## 📡 API Documentation

### Authentication

All API endpoints except `/auth/*` require authentication:

```bash
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Leads
- `GET /api/leads` - List all leads
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `POST /api/leads/:id/qualify` - AI qualification

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/leads/:id` - Lead analytics
- `GET /api/analytics/performance` - Performance report

#### Communications
- `POST /api/calls/initiate` - Start voice call
- `POST /api/messages/send` - Send SMS/Email
- `GET /api/conversations/:leadId` - Get conversation history

### AI Calls Endpoints

#### AI Call Management
- `GET /api/ai-calls/active` - Get active AI calls
- `GET /api/ai-calls/history` - Get AI call history
- `POST /api/ai-calls/initiate` - Initiate new AI call
- `GET /api/ai-calls/:callId` - Get AI call details
- `PUT /api/ai-calls/:callId/status` - Update call status
- `POST /api/ai-calls/:callId/takeover` - Human takeover of AI call
- `POST /api/ai-calls/:callId/pause-ai` - Pause AI
- `POST /api/ai-calls/:callId/resume-ai` - Resume AI
- `POST /api/ai-calls/:callId/end` - End AI call

#### AI Transcription
- `GET /api/ai-calls/:callId/transcript` - Get call transcript
- `POST /api/ai-calls/:callId/transcript` - Add transcript entry
- `POST /api/ai-calls/:callId/transcript/start` - Start live transcription
- `POST /api/ai-calls/:callId/transcript/stop` - Stop live transcription

#### AI Insights
- `GET /api/ai-calls/:callId/insights` - Get call insights
- `POST /api/ai-calls/:callId/insights` - Generate new insight
- `GET /api/ai-calls/insights/trends` - Get insight trends

#### AI Call Queue
- `GET /api/ai-calls/queue` - Get call queue
- `POST /api/ai-calls/queue` - Add call to queue
- `PUT /api/ai-calls/queue/:callId/priority` - Update queue priority
- `DELETE /api/ai-calls/queue/:callId` - Remove from queue
- `POST /api/ai-calls/queue/process` - Process queue

#### AI Settings
- `GET /api/ai-calls/settings` - Get AI settings
- `PUT /api/ai-calls/settings` - Update AI settings
- `GET /api/ai-calls/settings/voices` - Get available voices
- `POST /api/ai-calls/settings/test-voice` - Test voice

#### AI Content Cards
- `GET /api/ai-calls/content-cards` - Get content cards
- `POST /api/ai-calls/content-cards` - Create content card
- `PUT /api/ai-calls/content-cards/:cardId` - Update content card
- `DELETE /api/ai-calls/content-cards/:cardId` - Delete content card

#### Progressive Settings
- `GET /api/ai-calls/progressive-settings` - Get progressive settings
- `PUT /api/ai-calls/progressive-settings` - Update progressive settings

### WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const socket = io('https://api.mohit-ai.com');

socket.on('lead-update', (data) => {
  console.log('Lead updated:', data);
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

### AI Calls WebSocket Events

```javascript
// Join AI calls room
socket.emit('join:call', callId);

// Listen for AI call events
socket.on('call:created', (data) => {
  console.log('AI call created:', data);
});

socket.on('call:status', (data) => {
  console.log('Call status updated:', data);
});

socket.on('transcript:update', (data) => {
  console.log('New transcript entry:', data);
});

socket.on('insight:new', (data) => {
  console.log('New AI insight:', data);
});

socket.on('content_card:created', (data) => {
  console.log('New content card:', data);
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testNamePattern="Lead Service"
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

### Render.com

The project includes `render.yaml` for easy deployment:

```bash
# Deploy to Render
render deploy
```

### Environment-Specific Commands

```bash
# Development
npm run dev

# Production
npm start

# Database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

## 📊 Monitoring & Logging

### Health Check

```bash
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "queue": "active"
  }
}
```

### Metrics Endpoint

```bash
GET /metrics
```

Provides Prometheus-compatible metrics.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use semantic commit messages

## 📜 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- OpenAI for GPT integration
- Google for Generative AI capabilities
- Twilio for communication infrastructure
- ElevenLabs for voice synthesis
- The amazing open-source community

## 🤖 AI Calls Architecture

The AI calls feature follows a modular architecture:

```
Frontend → API Routes → Controllers → Services → AI Providers
    ↓         ↓           ↓          ↓          ↓
WebSocket → Handlers → Database → Cache → External APIs
```

### Key Components

- **AI Service Factory**: Manages multiple AI providers with fallback
- **AI Calls Service**: Core AI call management logic
- **AI Voice Service**: Voice synthesis and management
- **Content Cards Service**: Contextual content generation
- **Progressive Settings Service**: UI complexity control
- **AI Auth Middleware**: Role-based authorization for AI features

### AI Services Integration

- **OpenAI**: GPT-4 for call analysis and AI response generation
- **Google Generative AI**: Alternative AI provider with Gemini models
- **ElevenLabs**: High-quality voice synthesis with multiple voice options

---

<div align="center">
Built with ❤️ by Mohit AI Team
</div>
