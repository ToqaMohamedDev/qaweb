
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import next from 'next';
import { parse } from 'url';

import { WebSocketHandler } from './lib/server/websocket/handler';
import { Logger } from './lib/server/utils/logger';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const logger = new Logger('Server');

const config = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    }
};

app.prepare().then(async () => {
    logger.info('Starting Quiz Battle Server...', { env: process.env.NODE_ENV });

    // Redis
    const redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redis.on('connect', () => logger.info('✓ Redis connected'));
    redis.on('error', (err) => logger.error('Redis connection error', err));

    const server = express();
    const httpServer = createServer(server);

    // WebSocket Setup
    // Initialize things that need redis
    if (process.env.NODE_ENV === 'development') {
        // Setup demo data if needed
    }

    const wsHandler = new WebSocketHandler(httpServer, redis, {
        jwtSecret: config.jwt.secret,
        corsOrigin: config.cors.origin,
    });

    // Express Middleware
    server.use(helmet({ contentSecurityPolicy: false }));
    server.use(cors({ origin: config.cors.origin, credentials: true }));
    // server.use(express.json());



    // Next.js Handler (Fallback)
    server.all(/.*/, (req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    httpServer.listen(port, () => {
        logger.info(`> Ready on http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
});
