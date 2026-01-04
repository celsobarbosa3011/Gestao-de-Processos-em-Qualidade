import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken, type JwtPayload } from './auth';
import { log } from './index';

export type WebSocketEventType = 
  | 'process_created' 
  | 'process_updated' 
  | 'notification_created';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
}

interface AuthenticatedWebSocket extends WebSocket {
  isAlive: boolean;
  userId: string;
  userRole: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<AuthenticatedWebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const authWs = ws as AuthenticatedWebSocket;
      
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        log('WebSocket connection rejected: no token provided', 'websocket');
        ws.close(4001, 'Authentication required');
        return;
      }

      const payload = verifyToken(token);
      if (!payload) {
        log('WebSocket connection rejected: invalid token', 'websocket');
        ws.close(4002, 'Invalid token');
        return;
      }

      authWs.isAlive = true;
      authWs.userId = payload.userId;
      authWs.userRole = payload.role;
      this.clients.add(authWs);

      log(`WebSocket client connected: ${payload.userId} (${payload.role})`, 'websocket');

      authWs.on('pong', () => {
        authWs.isAlive = true;
      });

      authWs.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'ping') {
            authWs.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (e) {
        }
      });

      authWs.on('close', () => {
        this.clients.delete(authWs);
        log(`WebSocket client disconnected: ${authWs.userId}`, 'websocket');
      });

      authWs.on('error', (error) => {
        log(`WebSocket error for ${authWs.userId}: ${error.message}`, 'websocket');
        this.clients.delete(authWs);
      });

      authWs.send(JSON.stringify({ type: 'connected', payload: { userId: payload.userId } }));
    });

    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          this.clients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    log('WebSocket server initialized on /ws', 'websocket');
  }

  broadcast(message: WebSocketMessage) {
    const data = JSON.stringify(message);
    let sentCount = 0;
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
        sentCount++;
      }
    });
    
    log(`Broadcast ${message.type}: sent to ${sentCount} clients`, 'websocket');
  }

  broadcastToUser(userId: string, message: WebSocketMessage) {
    const data = JSON.stringify(message);
    let sentCount = 0;
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId === userId) {
        client.send(data);
        sentCount++;
      }
    });
    
    if (sentCount > 0) {
      log(`Sent ${message.type} to user ${userId}`, 'websocket');
    }
  }

  getConnectedCount(): number {
    return this.clients.size;
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });
    this.clients.clear();
    if (this.wss) {
      this.wss.close();
    }
    log('WebSocket server shut down', 'websocket');
  }
}

export const wsManager = new WebSocketManager();
