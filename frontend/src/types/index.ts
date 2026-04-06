export interface Category {
  id: number;
  name: string;
  contentType: "LIVE" | "VOD" | "SERIES";
  active: boolean;
}
