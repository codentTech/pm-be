import { UserEntity } from 'src/core/database/entities/user.entity';

export interface IEmails {
  value: string;
}

export interface IOAuthUser {
  id: string;
  displayName: string;
  emails: IEmails | string;
}

export interface ILoginResponse {
  user: UserEntity;
  token: string;
}

export interface IJwtPayload {
  sub: string;
  email: string;
}
