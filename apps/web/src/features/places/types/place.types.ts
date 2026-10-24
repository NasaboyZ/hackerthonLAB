export type PlaceType = "spot" | "area";
export type PlaceVisibility = "private" | "public";

export type PlaceGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type Place = {
  id: string;
  name: string;
  type: PlaceType;
  visibility: PlaceVisibility;
  geometry: PlaceGeometry;
  createdAt: string;
  updatedAt: string;
};

export type CreateSpotInput = { name: string; longitude: number; latitude: number; visibility?: PlaceVisibility };
export type CreateAreaInput = { name: string; coordinates: number[][][][]; visibility?: PlaceVisibility };
