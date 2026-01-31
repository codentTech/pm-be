import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { EAuthProvider } from 'src/common/types/provider.enum';
import { AuthService } from '../auth.service';
import { IOAuthUser } from '../interfaces/auth.interface';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_CLIENT_ID'),
      clientSecret: configService.get<string>('FACEBOOK_CLIENT_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'name', 'email'],
      proxy: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    provider: any,
    done: Function
  ): Promise<any> {
    const { id, name, emails } = provider;

    const user: IOAuthUser = {
      id,
      emails: emails[0].value,
      displayName: `${name.givenName} ${name.familyName}`,
    };

    const savedUser = await this.authService.validateSocialLogin(user);
    done(null, savedUser);
  }
}