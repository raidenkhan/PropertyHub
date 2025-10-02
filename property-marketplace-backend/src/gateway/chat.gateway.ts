import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MessagesService } from 'src/messages/messages.service';

@WebSocketGateway({
  // Simplified configuration
  cors: {
    origin: [
     
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
  // Remove custom transport/path configurations that might cause issues
  allowEIO3: true,
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor (private messageService:MessagesService){}
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(ChatGateway.name);

  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket Gateway initialized');
    this.logger.log(`Socket.IO server ready with CORS: ${JSON.stringify(server.engine.opts.cors)}`);
    
    // Log engine events for debugging
    server.engine.on('connection_error', (err) => {
      this.logger.error('❌ Engine connection error:', {
        code: err.code,
        message: err.message,
        context: err.context,
        // Don't log the full request object as it's too verbose
      });
    });
    
    server.on('connection', (socket) => {
      this.logger.log(`✅ New socket connection: ${socket.id}`);
    });
  }

  async handleConnection(client: Socket) {

    
    // Extract token from auth or headers
    const token = client.handshake.auth?.token || 
                 client.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      this.logger.warn('⚠️ No authentication token provided');
      // For debugging, allow connection but with limited functionality
      client.handshake.auth = { userId: 'anonymous' };
    } else {
      this.logger.log(`🔑 Token provided (length: ${token.length})`);
      
      // TODO: Add proper JWT verification here
      // For now, decode the JWT payload manually for debugging
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        client.handshake.auth.userId = payload.sub || payload.id;
       
      } catch (error) {
        this.logger.error('❌ JWT decode error:', error.message);
        client.handshake.auth.userId = 'invalid';
      }
    }
    
    const userId = client.handshake.auth.userId;
    
    // Join user to their personal room
    await client.join(`user-${userId}`);
    this.logger.log(`🏠 User ${userId} joined room: user-${userId}`);
     this.logger.log(`✅ User ${userId} joined room user-${userId}`);
  this.logger.log(`Rooms:`, client.rooms);

    
    // Send connection confirmation
    client.emit('connected', {
      success: true,
      userId: userId,
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
    
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId;
    this.logger.log(`👋 User ${userId} disconnected (${client.id})`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    this.logger.log(`🏓 Ping from ${client.id}`);
    
    const response = {
      pong: true,
      timestamp: new Date().toISOString(),
      socketId: client.id,
      userId: client.handshake.auth?.userId,
      transport: client.conn.transport.name,
    };
    
    client.emit('pong', response);
    return response;
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { receiverId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId=client.handshake.auth?.userId
    if (!senderId || !data.receiverId || !data.content) {
      throw new WsException('Invalid message data');
    }
    
       try {
      // ✅ SAVE TO DATABASE
      const message = await this.messageService.createMessage({
        senderId: Number(senderId),
        receiverId: data.receiverId,
        content: data.content,
      });
    // Emit to receiver's room
      this.logger.log(`📤 Emitting to room: user-${data.receiverId}`);
      this.server.to(`user-${data.receiverId}`).emit('newMessage', message);
      client.emit('messageSent', { success: true, messageId: message.id });
    
    // Confirm to sender
  return message; } catch (error) {
      this.logger.error('❌ Failed to save message:', error);
      throw new WsException('Failed to send message');
    }
  }
}
