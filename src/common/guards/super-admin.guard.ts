import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLE } from "src/common/types/roles.enum";
import { AuthenticatedRequest } from "src/common/types/request.interface";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.Id) return false;
    if (user.SystemRole !== ROLE.SUPER_ADMIN) {
      throw new ForbiddenException("Super Admin access required");
    }
    return true;
  }
}
