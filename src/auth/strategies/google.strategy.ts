import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { IOAuthUser } from '../interfaces/auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      proxy: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    provider: IOAuthUser,
    done: VerifyCallback
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