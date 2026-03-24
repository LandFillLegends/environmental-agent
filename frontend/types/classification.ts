/**
 * These types mirror the Pydantic schemas on the backend.
 * Keep them in sync — if you change backend/app/schemas/classification.py,
 * update this file too.
 */

export interface WasteClassificationItem {
  item_name: string;
  material_type: string;
  is_hazardous: boolean;
  is_soiled: boolean;
  search_query: string;
  location: string | null;
  confidence_score: number;
}

export interface DisposalFacility {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  phone: string | null;
  rating: number | null;
  website: string | null;
}

export interface DisposalInstruction {
  item_name: string;
  material_type: string;
  instruction: string;
  facilities: DisposalFacility[];
}

export interface ClassificationRequest {
  image_base64?: string | null;
  message?: string | null;
  location?: string | null;
}

export interface ClassificationResponse {
  items: WasteClassificationItem[];
  disposal_instructions: DisposalInstruction[];
  total_items: number;
  processing_time_ms: number;
}
