import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrganizationMemberRepository } from 'src/common/repositories/organization-member.repository';
import { SearchResultType } from 'src/common/types/search-result-type.enum';
import { SearchResponse, SearchResultItem } from 'src/common/types/search.interface';

@Injectable()
export class SearchService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orgMemberRepository: OrganizationMemberRepository,
  ) {}

  private async getAccessibleOrgIds(userId: string): Promise<string[]> {
    const memberships = await this.orgMemberRepository.findOrgsByUserId(userId);
    return memberships.map((m) => m.OrganizationId);
  }

  async search(
    userId: string,
    q: string,
    type?: SearchResultType,
    orgId?: string,
    boardId?: string,
    limit = 20,
  ): Promise<SearchResponse> {
    const term = (q || '').trim().toLowerCase();
    if (!term) {
      return { cards: [], todos: [], boards: [], kpis: [], workspaces: [] };
    }

    const orgIds = orgId ? [orgId] : await this.getAccessibleOrgIds(userId);
    const searchPattern = `%${term}%`;
    const idsForIn = orgIds.length ? orgIds : ['00000000-0000-0000-0000-000000000000'];

    const result: SearchResponse = {
      cards: [],
      todos: [],
      boards: [],
      kpis: [],
      workspaces: [],
    };

    if (!type || type === SearchResultType.BOARD) {
      const boardParams: unknown[] = [searchPattern, userId, ...idsForIn];
      const orgInPlaceholders = idsForIn.map((_, i) => `$${i + 3}`).join(', ');
      let boardSql = `
        SELECT DISTINCT b."Id", b."Name", b."Description"
        FROM "Boards" b
        LEFT JOIN "Lists" l ON l."BoardId" = b."Id"
        WHERE (
          LOWER(b."Name") LIKE $1
          OR LOWER(COALESCE(b."Description", '')) LIKE $1
          OR LOWER(l."Title") LIKE $1
        )
          AND ((b."OrganizationId" IS NULL AND b."CreatedBy" = $2) OR (b."OrganizationId" IN (${orgInPlaceholders})))
      `;
      if (orgId) {
        boardParams.push(orgId);
        boardSql += ` AND b."OrganizationId" = $${boardParams.length}`;
      }
      boardParams.push(limit);
      boardSql += ` ORDER BY b."Name" ASC LIMIT $${boardParams.length}`;

      const boards = await this.dataSource.query(boardSql, boardParams);
      result.boards = boards.map(
        (b: { Id: string; Name: string; Description?: string }): SearchResultItem => ({
          type: SearchResultType.BOARD,
          id: b.Id,
          title: b.Name,
          subtitle: b.Description || undefined,
          url: `/projects/${b.Id}`,
        }),
      );
    }

    if (!type || type === SearchResultType.CARD) {
      const cardParams: unknown[] = [searchPattern, userId, ...idsForIn];
      const orgInPlaceholders = idsForIn.map((_, i) => `$${i + 3}`).join(', ');
      let cardSql = `
        SELECT DISTINCT c."Id" as "card_Id", c."Title" as "card_Title", c."Description" as "card_Description",
               l."BoardId" as "list_BoardId", b."Name" as "board_Name"
        FROM "Cards" c
        INNER JOIN "Lists" l ON c."ListId" = l."Id"
        INNER JOIN "Boards" b ON l."BoardId" = b."Id"
        LEFT JOIN "CardLabels" cl ON cl."CardId" = c."Id"
        LEFT JOIN "Labels" lbl ON cl."LabelId" = lbl."Id"
        WHERE (
          LOWER(c."Title") LIKE $1
          OR LOWER(COALESCE(c."Description", '')) LIKE $1
          OR LOWER(l."Title") LIKE $1
          OR LOWER(b."Name") LIKE $1
          OR LOWER(COALESCE(b."Description", '')) LIKE $1
          OR LOWER(COALESCE(lbl."Name", '')) LIKE $1
          OR EXISTS (SELECT 1 FROM "Comments" cm WHERE cm."CardId" = c."Id" AND LOWER(cm."Content") LIKE $1)
          OR EXISTS (SELECT 1 FROM "Checklists" ch WHERE ch."CardId" = c."Id" AND LOWER(ch."Title") LIKE $1)
        )
          AND ((b."OrganizationId" IS NULL AND b."CreatedBy" = $2) OR (b."OrganizationId" IN (${orgInPlaceholders})))
      `;
      if (orgId) {
        cardParams.push(orgId);
        cardSql += ` AND b."OrganizationId" = $${cardParams.length}`;
      }
      if (boardId) {
        cardParams.push(boardId);
        cardSql += ` AND b."Id" = $${cardParams.length}`;
      }
      cardParams.push(limit);
      cardSql += ` ORDER BY c."Title" ASC LIMIT $${cardParams.length}`;

      const cards = await this.dataSource.query(cardSql, cardParams);
      result.cards = cards.map(
        (c: {
          card_Id: string;
          card_Title: string;
          card_Description?: string;
          list_BoardId: string;
          board_Name: string;
        }) => ({
          type: SearchResultType.CARD,
          id: c.card_Id,
          title: c.card_Title,
          subtitle: c.card_Description || undefined,
          url: `/projects/${c.list_BoardId}`,
          boardId: c.list_BoardId,
          boardName: c.board_Name,
        }),
      );
    }

    if (!type || type === SearchResultType.TODO) {
      const todoParams: unknown[] = [searchPattern, ...idsForIn, userId];
      const orgInPlaceholders = idsForIn.map((_, i) => `$${i + 2}`).join(', ');
      let todoSql = `
        SELECT t."Id" as "todo_Id", t."Title" as "todo_Title", t."Description" as "todo_Description",
               tl."Name" as "todoList_Name"
        FROM "TodoItems" t
        INNER JOIN "TodoLists" tl ON t."TodoListId" = tl."Id"
        WHERE (LOWER(t."Title") LIKE $1 OR LOWER(COALESCE(t."Description", '')) LIKE $1 OR LOWER(tl."Name") LIKE $1)
          AND (tl."OrganizationId" IN (${orgInPlaceholders}) OR (tl."OrganizationId" IS NULL AND tl."CreatedBy" = $${idsForIn.length + 2}))
      `;
      if (orgId) {
        todoParams.push(orgId);
        todoSql += ` AND tl."OrganizationId" = $${todoParams.length}`;
      }
      if (boardId) {
        todoParams.push(boardId);
        todoSql += ` AND tl."BoardId" = $${todoParams.length}`;
      }
      todoParams.push(limit);
      todoSql += ` ORDER BY t."Title" ASC LIMIT $${todoParams.length}`;

      const todos = await this.dataSource.query(todoSql, todoParams);
      result.todos = todos.map(
        (t: {
          todo_Id: string;
          todo_Title: string;
          todo_Description?: string;
          todoList_Name?: string;
        }): SearchResultItem => ({
          type: SearchResultType.TODO,
          id: t.todo_Id,
          title: t.todo_Title,
          subtitle: t.todo_Description || t.todoList_Name || undefined,
          url: '/todos',
          boardName: t.todoList_Name,
        }),
      );
    }

    if (!type || type === SearchResultType.KPI) {
      const kpiParams: unknown[] = [searchPattern, ...idsForIn, userId];
      const orgInPlaceholders = idsForIn.map((_, i) => `$${i + 2}`).join(', ');
      let kpiSql = `
        SELECT k."Id" as "kpi_Id", k."Name" as "kpi_Name", k."Notes" as "kpi_Notes"
        FROM "Kpis" k
        WHERE (LOWER(k."Name") LIKE $1 OR LOWER(COALESCE(k."Notes", '')) LIKE $1 OR LOWER(COALESCE(k."Unit", '')) LIKE $1)
          AND (k."OrganizationId" IN (${orgInPlaceholders}) OR (k."OrganizationId" IS NULL AND k."CreatedBy" = $${idsForIn.length + 2}))
      `;
      if (orgId) {
        kpiParams.push(orgId);
        kpiSql += ` AND k."OrganizationId" = $${kpiParams.length}`;
      }
      kpiParams.push(limit);
      kpiSql += ` ORDER BY k."Name" ASC LIMIT $${kpiParams.length}`;

      const kpis = await this.dataSource.query(kpiSql, kpiParams);
      result.kpis = kpis.map(
        (k: { kpi_Id: string; kpi_Name: string; kpi_Notes?: string }): SearchResultItem => ({
          type: SearchResultType.KPI,
          id: k.kpi_Id,
          title: k.kpi_Name,
          subtitle: k.kpi_Notes || undefined,
          url: '/kpis',
        }),
      );
    }

    if (!type || type === SearchResultType.WORKSPACE) {
      const wsParams: unknown[] = [userId, searchPattern];
      let wsSql = `
        SELECT o."Id", o."Name", o."Slug"
        FROM "Organizations" o
        INNER JOIN "OrganizationMembers" om ON o."Id" = om."OrganizationId" AND om."UserId" = $1
        WHERE (LOWER(o."Name") LIKE $2 OR LOWER(COALESCE(o."Slug", '')) LIKE $2)
      `;
      if (orgId) {
        wsParams.push(orgId);
        wsSql += ` AND o."Id" = $${wsParams.length}`;
      }
      wsParams.push(limit);
      wsSql += ` ORDER BY o."Name" ASC LIMIT $${wsParams.length}`;

      const workspaces = await this.dataSource.query(wsSql, wsParams);
      result.workspaces = workspaces.map(
        (w: { Id: string; Name: string; Slug?: string }): SearchResultItem => ({
          type: SearchResultType.WORKSPACE,
          id: w.Id,
          title: w.Name,
          subtitle: w.Slug || undefined,
          url: '/workspace/settings',
        }),
      );
    }

    return result;
  }
}
