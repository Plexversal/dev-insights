import express from 'express';
import { createServer, getServerPort } from '@devvit/web/server';
import apiRoutes from './routes/api';
import internalRoutes from './routes/internal';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

// Mount routes
app.use(apiRoutes);
app.use(internalRoutes);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
