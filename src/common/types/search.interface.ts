import { SearchResultType } from './search-result-type.enum';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  boardId?: string;
  boardName?: string;
}

export interface SearchResponse {
  cards: SearchResultItem[];
  todos: SearchResultItem[];
  boards: SearchResultItem[];
  kpis: SearchResultItem[];
  workspaces: SearchResultItem[];
}
