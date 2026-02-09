import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { InvitationsModule } from './invitations/invitations.module';
import { BoardsModule } from './boards/boards.module';
import { ListsModule } from './lists/lists.module';
import { CardsModule } from './cards/cards.module';
import { KpisModule } from './kpis/kpis.module';
import { TodoListsModule } from './todo-lists/todo-lists.module';
import { TodoItemsModule } from './todo-items/todo-items.module';
import { LabelsModule } from './labels/labels.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { CommentsModule } from './comments/comments.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { typeOrmConfig } from './core/config/typeorm.config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { EmailModule } from './common/email.module';

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UserModule,
    OrganizationsModule,
    InvitationsModule,
    BoardsModule,
    ListsModule,
    CardsModule,
    KpisModule,
    TodoListsModule,
    TodoItemsModule,
    LabelsModule,
    AttachmentsModule,
    CommentsModule,
    ChecklistsModule,
    WebsocketModule,
    SearchModule,
    NotificationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
