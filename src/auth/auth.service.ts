import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import axios from "axios";
import { AuthErrors } from "src/common/constants/auth.errors";
import { UserRepository } from "src/common/repositories/user.repository";
import { BcryptService } from "src/common/services/bcrypt.service";
import { UserEntity } from "src/core/database/entities/user.entity";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { ILoginResponse, IOAuthUser } from "./interfaces/auth.interface";

@Injectable()
export class AuthService {
  private auth0Domain;
  constructor(
    configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService
  ) {
    this.auth0Domain = configService.get<string>("AUTH0_DOMAIN");
  }

  /**
   * Handles user registration.
   *
   * @param data - The registration details including email and password.
   * @returns A promise resolving to the newly created user entity.
   * @throws ConflictException if the email is already in use.
   */
  async register(data: RegisterDto): Promise<UserEntity> {
    const { Email, Password } = data;

    // Check if user exists
    const existingUser = await this.userRepository.findOneRecord({ Email });
    if (existingUser)
      throw new ConflictException(AuthErrors.USER_ALREADY_EXISTS);

    // Hash password and save user
    const hashedPassword = await this.bcryptService.hashPassword(Password);
    const newUser = await this.userRepository
      .getORMMethods()
      .save({ ...data, Password: hashedPassword });

    return newUser;
  }

  /**
   * Handles user login.
   *
   * @param data - The login credentials including email and password.
   * @returns A promise resolving to an object containing the authenticated user and JWT token.
   * @throws UnauthorizedException if the credentials are invalid.
   */
  async login(data: LoginDto): Promise<ILoginResponse> {
    const { Email, Password } = data;

    // Check if user exists
    const user = await this.userRepository.findOneRecord(
      { Email },
      { relations: true }
    );
    if (!user) throw new NotFoundException(AuthErrors.USER_NOT_FOUND);

    // Verify password
    const matched = await this.bcryptService.comparePassword(
      Password,
      user.Password
    );
    if (!matched) throw new BadRequestException(AuthErrors.INVALID_CREDENTIALS);

    // Generate token
    const token = this.generateAccessToken(user);

    return { user, token };
  }

  /**
   * Validates and handles social login, checks if user exists, and saves the new user if necessary.
   *
   * @param socialUser The user information obtained from the social login provider (e.g., Facebook, Google).
   * @returns {ILoginResponse} Returns the user data along with the generated access token.
   */
  async validateSocialLogin(socialUser: IOAuthUser): Promise<ILoginResponse> {
    const { emails, id, displayName } = socialUser;
    if (!id || !emails)
      throw new BadRequestException(AuthErrors.INVALID_OAUTH_DATA);

    let user = await this.userRepository.findOneRecord({
      Email: String(emails),
    });

    if (!user) {
      user = await this.userRepository.getORMMethods().save({
        Email: emails,
        FullName: displayName || "",
      } as UserEntity);
    }

    const token = this.generateAccessToken(user);

    return { user, token };
  }

  /**
   * Validates and handles social login, checks if user exists, and saves the new user if necessary.
   *
   * @param accessToken The accessToken obtained from the auth0 provider.
   * @returns {ILoginResponse} Returns the user data along with the generated access token.
   */
  async validateOAuthLogin(accessToken: string): Promise<ILoginResponse> {
    // Fetch user data from Auth0
    const auth0Response = await axios.get(
      `https://${this.auth0Domain}/userinfo`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { email, name } = auth0Response.data;

    let user = await this.userRepository.findOneRecord({
      Email: String(email),
    });

    if (!user) {
      user = await this.userRepository.getORMMethods().save({
        Email: email,
        FullName: name || "",
      } as unknown as UserEntity);
    }

    const token = await this.generateAccessToken(user);

    return { user, token };
  }

  generateAccessToken(user: UserEntity): string {
    const payload = { Id: user.Id, Email: user.Email };
    return this.jwtService.sign(payload, { expiresIn: "24h" });
  }
}
