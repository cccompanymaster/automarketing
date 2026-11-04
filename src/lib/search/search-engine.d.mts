// Types for search-engine.mjs (kept verbatim from the search handoff).

export interface SearchableProduct {
  title?: string;
  name?: string;
  aliases?: string[];
  keywords?: string[];
  tags?: string[];
  category?: string;
  summary?: string;
  searchText?: string;
  description?: string;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  /** Fields that matched; "<field>:유사" marks a typo-tolerant match. */
  matchedBy: string[];
  index: number;
}

export function normalizeSearchText(value: unknown): { spaced: string; compact: string; tokens: string[]; initials: string };
export function getHangulInitials(value: unknown): string;
export function searchProducts<T extends SearchableProduct>(products: T[], query: string, options?: { limit?: number }): SearchResult<T>[];
export function suggestSearchTerms(products: SearchableProduct[], query: string, limit?: number): string[];
