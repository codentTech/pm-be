import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CardAssigneeRepository } from "src/common/repositories/card-assignee.repository";
import { CardLabelRepository } from "src/common/repositories/card-label.repository";
import { CardRepository } from "src/common/repositories/card.repository";
import { ListRepository } from "src/common/repositories/list.repository";
import { LabelRepository } from "src/common/repositories/label.repository";
import { OrganizationMemberRepository } from "src/common/repositories/organization-member.repository";
import { ProjectRepository } from "src/common/repositories/project.repository";
import { UserEntity } from "src/core/database/entities/user.entity";
import { CardEntity } from "src/core/database/entities/card.entity";
import { ListEntity } from "src/core/database/entities/list.entity";
import { ProjectGateway } from "src/websocket/project.gateway";
import { TicketStatusHistoryEntry } from "src/common/types/ticket-status-history.interface";
import { TicketStatus } from "src/common/types/ticket-status.enum";
import {
  TICKET_STATUS_BY_LIST_TITLE,
  TICKET_VALID_TRANSITIONS,
} from "src/common/constants/ticket.constant";
import { ProjectStatus } from "src/common/types/project-status.enum";
import { createPaginatedResponse } from "src/common/dto/paginated-response.dto";
import { CreateCardDto, UpdateCardDto } from "./dto/card.dto";

@Injectable()
export class CardsService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly cardLabelRepository: CardLabelRepository,
    private readonly cardAssigneeRepository: CardAssigneeRepository,
    private readonly labelRepository: LabelRepository,
    private readonly orgMemberRepository: OrganizationMemberRepository,
    private readonly projectGateway: ProjectGateway,
  ) {}

  async create(dto: CreateCardDto, user: UserEntity): Promise<CardEntity> {
    const list = await this.assertListOwnership(dto.ListId, user.Id);
    const statusFromList = this.resolveStatusFromList(list?.Title);
    const initialStatus = dto.Status ?? statusFromList ?? TicketStatus.BACKLOG;

    this.assertProjectWritable(list?.Project);
    this.validateStatusRules(initialStatus, dto);

    const position =
      dto.Position ??
      (await this.cardRepository.getNextPositionForList(dto.ListId));
    const card = this.cardRepository.create({
      ...dto,
      Position: position,
      DueDate: dto.DueDate ? new Date(dto.DueDate) : undefined,
      ReporterId: dto.ReporterId ?? user.Id,
      Status: initialStatus,
      StatusHistory: [
        {
          Status: initialStatus,
          Timestamp: new Date().toISOString(),
          UserId: user.Id,
        },
      ] as TicketStatusHistoryEntry[],
      CreatedBy: user,
    });
    const saved = await this.cardRepository.save(card);
    if (list?.ProjectId) {
      this.projectGateway.emitCardCreated(list.ProjectId, {
        card: saved,
        listId: dto.ListId,
      });
    }
    return saved;
  }

  async findOne(id: string, user: UserEntity): Promise<CardEntity> {
    const card = await this.cardRepository.findOneById(id, [
      "List",
      "List.Project",
      "List.Project.CreatedBy",
      "CardLabels",
      "CardLabels.Label",
      "CardAssignees",
      "CardAssignees.User",
    ]);
    if (!card) throw new NotFoundException("Card not found");
    const project = card.List?.Project;
    if (project?.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(
        user.Id,
        project.OrganizationId,
      );
      if (!isMember) throw new ForbiddenException("Access denied");
    } else if (project?.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException("Access denied");
    }
    return card;
  }

  async update(
    id: string,
    dto: UpdateCardDto,
    user: UserEntity,
  ): Promise<CardEntity> {
    const card = await this.findOne(id, user);
    const prevListId = card.ListId;
    const list = await this.listRepository.findOneById(prevListId, ["Project"]);
    const projectId = list?.ProjectId;
    this.assertProjectWritable(list?.Project);

    let nextStatus: TicketStatus | undefined = dto.Status ?? undefined;

    if (dto.ListId && dto.ListId !== card.ListId) {
      const targetList = await this.assertListOwnership(dto.ListId, user.Id);
      this.assertProjectWritable(targetList?.Project);
      card.ListId = dto.ListId;
      if (!nextStatus) {
        nextStatus = this.resolveStatusFromList(targetList?.Title);
      }
    }

    if (nextStatus && nextStatus !== card.Status) {
      this.validateTransition(card.Status as TicketStatus, nextStatus);
      this.validateStatusRules(nextStatus, {
        ...dto,
        AcceptanceCriteria:
          dto.AcceptanceCriteria ?? card.AcceptanceCriteria ?? undefined,
        BlockedReason: dto.BlockedReason ?? card.BlockedReason ?? undefined,
        ValidationNotes:
          dto.ValidationNotes ?? card.ValidationNotes ?? undefined,
      });
      this.appendStatusHistory(card, nextStatus, user.Id, dto.StatusReason);
      if (nextStatus === TicketStatus.REOPENED) {
        card.ReopenCount = (card.ReopenCount ?? 0) + 1;
      }
      card.Status = nextStatus;
    }
    if (dto.DueDate !== undefined) {
      card.DueDate = dto.DueDate ? new Date(dto.DueDate) : null;
    }
    if (dto.Title !== undefined) card.Title = dto.Title;
    if (dto.Description !== undefined) card.Description = dto.Description;
    if (dto.Position !== undefined) card.Position = dto.Position;
    if (dto.TicketType !== undefined) card.TicketType = dto.TicketType;
    if (dto.Priority !== undefined) card.Priority = dto.Priority;
    if (dto.ReporterId !== undefined) card.ReporterId = dto.ReporterId;
    if (dto.EstimateHours !== undefined) card.EstimateHours = dto.EstimateHours;
    if (dto.SprintId !== undefined) card.SprintId = dto.SprintId;
    if (dto.ParentEpicId !== undefined) card.ParentEpicId = dto.ParentEpicId;
    if (dto.BlockedReason !== undefined) card.BlockedReason = dto.BlockedReason;
    if (dto.AcceptanceCriteria !== undefined)
      card.AcceptanceCriteria = dto.AcceptanceCriteria;
    if (dto.Severity !== undefined) card.Severity = dto.Severity;
    if (dto.ValidationNotes !== undefined)
      card.ValidationNotes = dto.ValidationNotes;

    // Detach relations before save - TypeORM uses relation values over column values.
    // List: must detach so our ListId update is persisted (else List relation overwrites it).
    // CardLabels/CardAssignees: we replace them separately via setLabelsForCard/setAssigneesForCard.
    card.List = undefined;
    card.CardLabels = undefined;
    card.CardAssignees = undefined;

    const saved = await this.cardRepository.save(card);

    if (dto.LabelIds !== undefined) {
      const listWithProject = await this.listRepository.findOneById(
        saved.ListId,
        ["Project"],
      );
      const orgId = listWithProject?.Project?.OrganizationId;
      if (orgId) {
        const orgLabels = await this.labelRepository.findByOrgId(orgId);
        const validIds = dto.LabelIds.filter((lid) =>
          orgLabels.some((l) => l.Id === lid),
        );
        await this.cardLabelRepository.setLabelsForCard(saved.Id, validIds);
      }
    }
    if (dto.AssigneeIds !== undefined && saved?.Id) {
      const listWithProject = await this.listRepository.findOneById(
        saved.ListId,
        ["Project"],
      );
      const orgId = listWithProject?.Project?.OrganizationId;
      if (orgId) {
        const memberChecks = await Promise.all(
          dto.AssigneeIds.map((uid) =>
            this.orgMemberRepository.isMember(uid, orgId),
          ),
        );
        const validAssigneeIds = dto.AssigneeIds.filter(
          (_, i) => memberChecks[i],
        );
        await this.cardAssigneeRepository.setAssigneesForCard(
          saved.Id,
          validAssigneeIds,
        );
      }
    }

    const savedWithRelations = await this.cardRepository.findOneById(saved.Id, [
      "CardLabels",
      "CardLabels.Label",
      "CardAssignees",
      "CardAssignees.User",
    ]);

    if (projectId) {
      if (dto.ListId && dto.ListId !== prevListId) {
        this.projectGateway.emitCardMoved(projectId, {
          cardId: saved.Id,
          fromListId: prevListId,
          toListId: dto.ListId,
          position: saved.Position ?? 0,
        });
      } else {
        this.projectGateway.emitCardUpdated(projectId, {
          card: savedWithRelations ?? saved,
        });
      }
    }
    return savedWithRelations ?? saved;
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const card = await this.findOne(id, user);
    const list = await this.listRepository.findOneById(card.ListId, [
      "Project",
    ]);
    const projectId = list?.ProjectId;
    await this.cardRepository.remove(card);
    if (projectId) {
      this.projectGateway.emitCardDeleted(projectId, {
        cardId: id,
        listId: card.ListId,
      });
    }
  }

  async getProductBacklog(
    projectId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.assertProjectAccess(projectId, user);
    const listIds = await this.listRepository.findIdsByProjectId(projectId);
    if (!listIds.length) {
      return createPaginatedResponse(
        [],
        0,
        page,
        Math.min(100, Math.max(1, limit)),
      );
    }
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.cardRepository.findProductBacklog(
      listIds,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async getSprintBacklog(
    projectId: string,
    sprintId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.assertProjectAccess(projectId, user);
    const listIds = await this.listRepository.findIdsByProjectId(projectId);
    if (!listIds.length) {
      return createPaginatedResponse(
        [],
        0,
        page,
        Math.min(100, Math.max(1, limit)),
      );
    }
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.cardRepository.findSprintBacklog(
      listIds,
      sprintId,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async getBugBacklog(
    projectId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.assertProjectAccess(projectId, user);
    const listIds = await this.listRepository.findIdsByProjectId(projectId);
    if (!listIds.length) {
      return createPaginatedResponse(
        [],
        0,
        page,
        Math.min(100, Math.max(1, limit)),
      );
    }
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.cardRepository.findBugBacklog(
      listIds,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  async getBlockedBacklog(
    projectId: string,
    user: UserEntity,
    page: number,
    limit: number,
  ) {
    await this.assertProjectAccess(projectId, user);
    const listIds = await this.listRepository.findIdsByProjectId(projectId);
    if (!listIds.length) {
      return createPaginatedResponse(
        [],
        0,
        page,
        Math.min(100, Math.max(1, limit)),
      );
    }
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.cardRepository.findBlockedBacklog(
      listIds,
      skip,
      take,
    );
    return createPaginatedResponse(items, total, page, take);
  }

  private validateTransition(from: TicketStatus, to: TicketStatus): void {
    const allowed = TICKET_VALID_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Invalid transition from ${from} to ${to}`);
    }
  }

  private validateStatusRules(
    status: TicketStatus,
    dto: CreateCardDto | UpdateCardDto,
  ): void {
    // if (status === TicketStatus.READY && !dto.AcceptanceCriteria?.trim()) {
    //   throw new BadRequestException('Acceptance criteria required to move ticket to Ready');
    // }
    // if (status === TicketStatus.BLOCKED && !dto.BlockedReason?.trim()) {
    //   throw new BadRequestException('Blocked reason required to move ticket to Blocked');
    // }
    // if (status === TicketStatus.DONE && !dto.ValidationNotes?.trim()) {
    //   throw new BadRequestException('Validation notes required to move ticket to Done');
    // }
    // const statusReason =
    //   'StatusReason' in dto ? (dto as UpdateCardDto).StatusReason : undefined;
    // if (status === TicketStatus.REOPENED && !statusReason?.trim()) {
    //   throw new BadRequestException('Reopen reason required when ticket is Reopened');
    // }
  }

  private appendStatusHistory(
    card: CardEntity,
    newStatus: TicketStatus,
    userId: string,
    reason?: string,
  ): void {
    const history: TicketStatusHistoryEntry[] = Array.isArray(
      card.StatusHistory,
    )
      ? [...card.StatusHistory]
      : [];
    history.push({
      Status: newStatus,
      Timestamp: new Date().toISOString(),
      UserId: userId,
      Reason: reason,
    });
    card.StatusHistory = history;
  }

  private resolveStatusFromList(title?: string | null): TicketStatus | null {
    if (!title) return null;
    return TICKET_STATUS_BY_LIST_TITLE[title.trim().toLowerCase()] ?? null;
  }

  private assertProjectWritable(project?: { Status?: ProjectStatus | null }) {
    const status = project?.Status;
    if (status === ProjectStatus.PAUSED) {
      throw new BadRequestException(
        "Project is paused; ticket changes are blocked",
      );
    }
    if (status === ProjectStatus.CLOSED) {
      throw new BadRequestException("Project is closed and read-only");
    }
  }

  private async assertProjectAccess(projectId: string, user: UserEntity) {
    const project = await this.projectRepository.findOneById(projectId, [
      "CreatedBy",
    ]);
    if (!project) throw new NotFoundException("Project not found");
    if (project.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(
        user.Id,
        project.OrganizationId,
      );
      if (!isMember) throw new ForbiddenException("Access denied");
    } else if (project.CreatedBy?.Id !== user.Id) {
      throw new ForbiddenException("Access denied");
    }
    return project;
  }

  private async assertListOwnership(
    listId: string,
    userId: string,
  ): Promise<ListEntity | null> {
    const list = await this.listRepository.findOneById(listId, [
      "Project",
      "Project.CreatedBy",
    ]);
    if (!list) throw new NotFoundException("List not found");
    const project = list.Project;
    if (project?.OrganizationId) {
      const isMember = await this.orgMemberRepository.isMember(
        userId,
        project.OrganizationId,
      );
      if (!isMember) throw new ForbiddenException("Access denied");
    } else if (project?.CreatedBy?.Id !== userId) {
      throw new ForbiddenException("Access denied");
    }
    return list;
  }
}
