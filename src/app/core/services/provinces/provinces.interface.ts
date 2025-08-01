// src/app/core/api/provinces/provinces.interfaces.ts
export interface RawProvinciaData {
  [id: string]: {
    provincia: string;
    cantones: {
      [cantonId: string]: {
        canton: string;
        parroquias: {
          [parroquiaId: string]: string;
        };
      };
    };
  };
}

export interface Provincia {
  id: string;
  nombre: string;
  cantones: Canton[];
}

export interface Canton {
  id: string;
  nombre: string;
  parroquias: Parroquia[];
}

export interface Parroquia {
  id: string;
  nombre: string;
}
