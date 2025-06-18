import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import { initializeWebSocketHandlers } from './services/websocket/index.js';
import { startWorkers } from './workers/index.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://mohit-ai-frontend.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', routes);

// WebSocket initialization
global.io = io; // Make io available globally
initializeWebSocketHandlers(io);

// TODO: Add WebSocket relay for Twilio-ElevenLabs voice streaming
// This requires additional setup with express-ws or a separate WebSocket server

// Error handling
app.use(errorHandler);

// Start workers
startWorkers();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Mohit AI Backend running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📞 Twilio: ${process.env.ENABLE_VOICE_CALLS === 'true' ? 'Enabled' : 'Disabled'}`);
  logger.info(`🎙️ ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Not configured'}`);
});