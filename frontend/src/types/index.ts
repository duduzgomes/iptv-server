export interface Category {
  id: number;
  name: string;
  contentType: "LIVE" | "VOD" | "SERIES";
  active: boolean;
}
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: number;
  username: string;
  password: string;
  maxConnections: number;
  active: boolean;
  expiresAt: string;
  createdBy: string | null;
  createdAt: string;
}
