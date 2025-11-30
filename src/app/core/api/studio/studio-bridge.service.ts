// core/bridge/studio-bridge.service.ts  (ajusta la ruta donde lo tengas)

import { Injectable, signal } from '@angular/core';

export interface StudioCourseUpdatePayload {
  id: number;
  title: string;
  miniatureUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class StudioBridgeService {

  // signal solo-lectura para que los componentes se suscriban
  private readonly _courseUpdate = signal<StudioCourseUpdatePayload | null>(null);
  readonly courseUpdate = this._courseUpdate.asReadonly();

  constructor() { }

  /** Llamado por el hijo (DetailsComponent) cuando se actualiza el curso */
  notifyCourseUpdated(update: StudioCourseUpdatePayload): void {
    this._courseUpdate.set(update);
  }

  /** Opcional: limpiar estado cuando quieras */
  clear(): void {
    this._courseUpdate.set(null);
  }
}

