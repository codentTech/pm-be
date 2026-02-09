import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const BOARD_ROOM_PREFIX = 'board:';
export const USER_ROOM_PREFIX = 'user:';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class BoardGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BoardGateway.name);
  private readonly presence = new Map<string, Map<string, { userId: string; fullName: string }>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Board WebSocket gateway initialized');
  }

  async handleConnection(client: any) {
    try {
      const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      client.userId = payload.sub || payload.Id;
      client.fullName = payload.fullName || payload.Email || 'User';
      client.join(`${USER_ROOM_PREFIX}${client.userId}`);
      this.logger.debug(`Client connected: ${client.id} (user: ${client.userId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: any) {
    const boardId = client.boardId;
    if (boardId) {
      this.leaveBoard(client, boardId);
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('board:join')
  handleJoinBoard(client: any, boardId: string) {
    if (!boardId || !client.userId) return;
    const prevBoardId = client.boardId;
    if (prevBoardId) {
      this.leaveBoard(client, prevBoardId);
    }
    const room = `${BOARD_ROOM_PREFIX}${boardId}`;
    client.join(room);
    client.boardId = boardId;

    const userInfo = { userId: client.userId, fullName: client.fullName || 'User' };
    if (!this.presence.has(room)) {
      this.presence.set(room, new Map());
    }
    this.presence.get(room)!.set(client.userId, userInfo);

    client.to(room).emit('presence:joined', { user: userInfo, room });
    client.emit('board:joined', { boardId });
    this.logger.debug(`User ${client.userId} joined board ${boardId}`);
  }

  @SubscribeMessage('board:leave')
  handleLeaveBoard(client: any, boardId: string) {
    if (boardId) this.leaveBoard(client, boardId);
  }

  private leaveBoard(client: any, boardId: string) {
    const room = `${BOARD_ROOM_PREFIX}${boardId}`;
    client.leave(room);
    if (client.boardId === boardId) client.boardId = null;

    const userInfo = { userId: client.userId, fullName: client.fullName || 'User' };
    const map = this.presence.get(room);
    if (map) {
      map.delete(client.userId);
      if (map.size === 0) this.presence.delete(room);
    }
    client.to(room).emit('presence:left', { user: userInfo, room });
  }

  emitCardMoved(boardId: string, payload: { cardId: string; fromListId: string; toListId: string; position: number }) {
    this.server.to(`${BOARD_ROOM_PREFIX}${boardId}`).emit('card:moved', payload);
  }

  emitCardCreated(boardId: string, payload: { card: any; listId: string }) {
    this.server.to(`${BOARD_ROOM_PREFIX}${boardId}`).emit('card:created', payload);
  }

  emitCardUpdated(boardId: string, payload: { card: any }) {
    this.server.to(`${BOARD_ROOM_PREFIX}${boardId}`).emit('card:updated', payload);
  }

  emitCardDeleted(boardId: string, payload: { cardId: string; listId: string }) {
    this.server.to(`${BOARD_ROOM_PREFIX}${boardId}`).emit('card:deleted', payload);
  }

  emitListReordered(boardId: string, payload: { listIds: string[] }) {
    this.server.to(`${BOARD_ROOM_PREFIX}${boardId}`).emit('list:reordered', payload);
  }

  emitListCreated(boardId: string, payload: { list: any }) {
    this.server.to(`${BOARD_ROOM_PREFIX}${boardId}`).emit('list:created', payload);
  }

  emitListDeleted(boardId: string, payload: { listId: string }) {
    this.server.to(`${BOARD_ROOM_PREFIX}${boardId}`).emit('list:deleted', payload);
  }

  getPresence(boardId: string): { userId: string; fullName: string }[] {
    const map = this.presence.get(`${BOARD_ROOM_PREFIX}${boardId}`);
    return map ? Array.from(map.values()) : [];
  }

  emitNotificationToUser(userId: string, notification: Record<string, unknown>) {
    this.server.to(`${USER_ROOM_PREFIX}${userId}`).emit('notification:created', notification);
  }
}
