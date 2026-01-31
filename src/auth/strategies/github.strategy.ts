import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';
import { IOAuthUser } from '../interfaces/auth.interface';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
      proxy: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    provider: IOAuthUser,
    done: Function
  ): Promise<any> {
    const { id, displayName, emails } = provider;
    const user: IOAuthUser = {
      id,
      emails: emails[0].value,
      displayName,
    };

    const savedUser = await this.authService.validateSocialLogin(user);
    done(null, savedUser);
  }
}