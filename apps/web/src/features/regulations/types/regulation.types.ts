export type RegulationClassification = "PROHIBITED" | "RESTRICTED" | "UNKNOWN" | "INFORMATION_ONLY";

export type RegulationSource = {
  authorityName: string;
  label: string | null;
  url: string;
};

export type RegulationSummary = {
  id: string;
  title: string;
  description: string;
  classification: RegulationClassification;
  verificationStatus: "verified" | "pending";
  jurisdiction: string;
  authorityName: string;
  lastVerifiedAt: string | null;
  hasVerifiedGeometry: boolean;
  sources: RegulationSource[];
};

export type RegulationProperties = {
  id: string;
  title: string;
  description: string;
  classification: RegulationClassification;
  jurisdiction: string;
  authorityName: string;
  lastVerifiedAt: string | null;
  sources: RegulationSource[];
};

export type RegulationFeature = {
  type: "Feature";
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
  properties: RegulationProperties;
};

export type RegulationFeatureCollection = {
  type: "FeatureCollection";
  features: RegulationFeature[];
};
