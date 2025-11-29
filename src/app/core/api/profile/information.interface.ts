// core/api/profile/information.interface.ts

/**
 * Tipos auxiliares para campos de catálogo
 */
export type Sexo = 'masculino' | 'femenino';

export type EstadoCivil =
  | 'casado/a'
  | 'unido/a'
  | 'separado/a'
  | 'divorciado/a'
  | 'viudo/a'
  | 'soltero/a';

export type Discapacidad = 'si' | 'no';

export type DiscapacidadPermanente =
  | 'intelectual (retraso mental)'
  | 'físico-motora (parálisis y amputaciones)'
  | 'visual (ceguera)'
  | 'auditiva (sordera)'
  | 'mental (enfermedades psiquiátricas)'
  | 'otro tipo';

export type AsistenciaEstablecimiento = 'si' | 'no';

/**
 * Estructura que devuelve el backend en show/update
 */
export interface UserInformation {
  id: number;
  birthdate: string; // 'YYYY-MM-DD'
  phone_number: string;

  province_id: number;
  province_name: string | null;

  canton_id: number;
  canton_name: string | null;

  parish_id: number;
  parish_name: string | null;

  sexo: Sexo;
  estado_civil: EstadoCivil;
  discapacidad: Discapacidad;
  discapacidad_permanente: DiscapacidadPermanente | null;
  asistencia_establecimiento_discapacidad: AsistenciaEstablecimiento | null;

  user_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Payload que se envía al backend para update
 */
export interface InformationRequest {
  birthdate: string; // 'YYYY-MM-DD'
  phone_number: string;
  province_id: number;
  canton_id: number;
  parish_id: number;
  sexo: Sexo;
  estado_civil: EstadoCivil;
  discapacidad: Discapacidad;
  discapacidad_permanente?: DiscapacidadPermanente | null;
  asistencia_establecimiento_discapacidad?: AsistenciaEstablecimiento | null;
}

/**
 * Respuesta del GET /profile/info/show
 */
export interface InformationShowResponse {
  userInformation: UserInformation | null;
 
}

/**
 * Respuesta del PUT /profile/info/update
 */
export interface InformationUpdateResponse {
  message: string;
  userInformation: UserInformation;
  
}
