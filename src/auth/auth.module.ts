import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserRepository } from "src/common/repositories/user.repository";
import { BcryptService } from "src/common/services/bcrypt.service";
import { UserEntity } from "src/core/database/entities/user.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { Auth0Strategy } from "./strategies/auth0.strategy";
import { FacebookStrategy } from "./strategies/facebook.strategy";
import { GithubStrategy } from "./strategies/github.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

const optionalOAuthStrategies = [
  ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
  ...(process.env.FACEBOOK_CLIENT_ID ? [FacebookStrategy] : []),
  ...(process.env.GITHUB_CLIENT_ID ? [GithubStrategy] : []),
  ...(process.env.AUTH0_CLIENT_ID ? [Auth0Strategy] : []),
];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET_KEY"),
        signOptions: { expiresIn: "60m" },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    JwtStrategy,
    BcryptService,
    ...optionalOAuthStrategies,
  ],
  exports: [JwtModule, JwtStrategy, PassportModule],
})
export class AuthModule {}
