export type FindingVisibility = "private" | "public";

export type FindingGeometry = { type: "Point"; coordinates: [number, number] } | null;

export type FindingMedia = { id: string; storageKey: string };

export type Finding = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  foundAt: string;
  weightGrams: number | null;
  visibility: FindingVisibility;
  geometry: FindingGeometry;
  media: FindingMedia[];
  createdAt: string;
  updatedAt: string;
};

export type FindingInput = {
  title: string;
  description?: string;
  category?: string;
  foundAt: string;
  weightGrams?: number;
  longitude?: number;
  latitude?: number;
  visibility: FindingVisibility;
};
