// core/api/information/information.interface.ts
export interface InformationResponse {
  userInformation: UserInformation;
}

export interface UserInformation {
  id:           number;
  birthdate:    string; // viene como string 'YYYY-MM-DD' desde Laravel
  phone_number: string;
  province:     string;
  canton:       string;
  parish:       string;

  sexo:         'femenino' | 'masculino';
  estado_civil: 'casado/a' | 'unido/a' | 'separado/a' | 'divorciado/a' | 'viudo/a' | 'soltero/a';
  discapacidad: 'si' | 'no';
  discapacidad_permanente: string | null;
  asistencia_establecimiento_discapacidad: string | null;

  user_id:      number;
  created_at:   string;
  updated_at:   string;
}

export interface InformationRequest {
  birthdate:    string | null; // 'YYYY-MM-DD'
  phone_number: string | null;
  province:     string | null;
  canton:       string | null;
  parish:       string | null;
  sexo:         string;
  estado_civil: string;
  discapacidad: string;
  discapacidad_permanente: string | null;
  asistencia_establecimiento_discapacidad: string | null;
}
