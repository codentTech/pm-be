import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/common/decorators/public.decorator";
import { OrganizationMemberRepository } from "src/common/repositories/organization-member.repository";
import { ROLE } from "src/common/types/roles.enum";
import { AuthenticatedRequest } from "src/common/types/request.interface";
/**
 * Guard that validates the user is a member of the organization.
 * Extracts org ID from:
 * - X-Organization-Id header (when source is 'header' or not specified)
 * - Route param (when source is 'param', uses paramKey: 'id' or 'orgId')
 * If no org ID is found, allows the request (no org context to validate).
 * Public routes (e.g. invitation preview) are allowed without auth.
 */
@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.Id) return false;

    if ((user as { SystemRole?: string }).SystemRole === ROLE.SUPER_ADMIN) {
      return true;
    }

    const orgId = this.getOrgId(request);
    if (!orgId) return true;

    const isMember = await this.orgMemberRepository.isMember(user.Id, orgId);
    if (!isMember) {
      throw new ForbiddenException("You are not a member of this organization");
    }
    return true;
  }

  private getOrgId(req: AuthenticatedRequest): string | null {
    const headerOrgId = req.headers["x-organization-id"] as string | undefined;
    if (headerOrgId?.trim()) return headerOrgId.trim();

    const paramOrgId = req.params?.orgId as string | undefined;
    if (paramOrgId) return paramOrgId;

    const queryOrgId = req.query?.orgId as string | undefined;
    if (queryOrgId) return String(queryOrgId).trim();

    // Do NOT use params.id for /projects, /kpis, /bids, /todo-lists - id is entity ID, not org ID
    const path = (req.originalUrl ?? req.url ?? "").split("?")[0].toLowerCase();
    const isEntityRoute = /^\/(projects|kpis|bids|todo-lists)(\/|$)/.test(path);
    if (!isEntityRoute) {
      const paramId = req.params?.id as string | undefined;
      if (paramId) return paramId;
    }

    return null;
  }
}
