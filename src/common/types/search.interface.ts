import { SearchResultType } from './search-result-type.enum';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  projectId?: string;
  projectName?: string;
}

export interface SearchResponse {
  cards: SearchResultItem[];
  todos: SearchResultItem[];
  projects: SearchResultItem[];
  kpis: SearchResultItem[];
  workspaces: SearchResultItem[];
}
