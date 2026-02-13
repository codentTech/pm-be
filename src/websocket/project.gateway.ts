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

export const PROJECT_ROOM_PREFIX = 'project:';
export const USER_ROOM_PREFIX = 'user:';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class ProjectGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProjectGateway.name);
  private readonly presence = new Map<string, Map<string, { userId: string; fullName: string }>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Project WebSocket gateway initialized');
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
    const projectId = client.projectId;
    if (projectId) {
      this.leaveProject(client, projectId);
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('project:join')
  handleJoinProject(client: any, projectId: string) {
    if (!projectId || !client.userId) return;
    const prevProjectId = client.projectId;
    if (prevProjectId) {
      this.leaveProject(client, prevProjectId);
    }
    const room = `${PROJECT_ROOM_PREFIX}${projectId}`;
    client.join(room);
    client.projectId = projectId;

    const userInfo = { userId: client.userId, fullName: client.fullName || 'User' };
    if (!this.presence.has(room)) {
      this.presence.set(room, new Map());
    }
    this.presence.get(room)!.set(client.userId, userInfo);

    client.to(room).emit('presence:joined', { user: userInfo, room });
    client.emit('project:joined', { projectId });
    this.logger.debug(`User ${client.userId} joined project ${projectId}`);
  }

  @SubscribeMessage('project:leave')
  handleLeaveProject(client: any, projectId: string) {
    if (projectId) this.leaveProject(client, projectId);
  }

  private leaveProject(client: any, projectId: string) {
    const room = `${PROJECT_ROOM_PREFIX}${projectId}`;
    client.leave(room);
    if (client.projectId === projectId) client.projectId = null;

    const userInfo = { userId: client.userId, fullName: client.fullName || 'User' };
    const map = this.presence.get(room);
    if (map) {
      map.delete(client.userId);
      if (map.size === 0) this.presence.delete(room);
    }
    client.to(room).emit('presence:left', { user: userInfo, room });
  }

  emitCardMoved(projectId: string, payload: { cardId: string; fromListId: string; toListId: string; position: number }) {
    this.server.to(`${PROJECT_ROOM_PREFIX}${projectId}`).emit('card:moved', payload);
  }

  emitCardCreated(projectId: string, payload: { card: any; listId: string }) {
    this.server.to(`${PROJECT_ROOM_PREFIX}${projectId}`).emit('card:created', payload);
  }

  emitCardUpdated(projectId: string, payload: { card: any }) {
    this.server.to(`${PROJECT_ROOM_PREFIX}${projectId}`).emit('card:updated', payload);
  }

  emitCardDeleted(projectId: string, payload: { cardId: string; listId: string }) {
    this.server.to(`${PROJECT_ROOM_PREFIX}${projectId}`).emit('card:deleted', payload);
  }

  emitListReordered(projectId: string, payload: { listIds: string[] }) {
    this.server.to(`${PROJECT_ROOM_PREFIX}${projectId}`).emit('list:reordered', payload);
  }

  emitListCreated(projectId: string, payload: { list: any }) {
    this.server.to(`${PROJECT_ROOM_PREFIX}${projectId}`).emit('list:created', payload);
  }

  emitListDeleted(projectId: string, payload: { listId: string }) {
    this.server.to(`${PROJECT_ROOM_PREFIX}${projectId}`).emit('list:deleted', payload);
  }

  getPresence(projectId: string): { userId: string; fullName: string }[] {
    const map = this.presence.get(`${PROJECT_ROOM_PREFIX}${projectId}`);
    return map ? Array.from(map.values()) : [];
  }

  emitNotificationToUser(userId: string, notification: Record<string, unknown>) {
    this.server.to(`${USER_ROOM_PREFIX}${userId}`).emit('notification:created', notification);
  }
}
