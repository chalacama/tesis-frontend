// core/api/profile/interest.interface.ts

export interface InterestCategory {
  id: number;
  name: string;
}

export interface InterestData {
  user_id: number;
  categories: InterestCategory[];
}

export interface InterestResponse {
  ok: boolean;
  message: string;
  data: InterestData;
}

/**
 * Payload que se envía al backend para actualizar los intereses.
 * Debe contener exactamente 4 IDs de categorías.
 */
export interface InterestUpdateRequest {
  categories: number[];
}
