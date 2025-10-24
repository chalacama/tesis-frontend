import { Injectable, signal,effect } from '@angular/core';

@Injectable()
export class CourseBridge {
  // Estado compartido solo durante /learning/course/...
  readonly isRegistered = signal<boolean>(false);

  setRegistered(v: boolean) {
    this.isRegistered.set(v);
  }

  
  // Conjunto reactivo de capítulos completados (IDs)
  private readonly _completed = signal<Set<number>>(new Set<number>());
  readonly completed = this._completed.asReadonly(); // solo lectura hacia afuera

  /** Carga inicial desde la API (múltiples IDs) */
  seedCompleted(ids: Iterable<number>) {
    const s = new Set(this._completed());
    for (const id of ids) s.add(id);
    this._completed.set(s);
  }

  /** Marca un capítulo como completado (id único, evita duplicados) */
  markChapterCompleted(id: number) {
    if (id == null) return;
    const s = new Set(this._completed());
    if (!s.has(id)) {
      s.add(id);
      this._completed.set(s);
    }
  }

  /** (Opcional) Desmarcar */
  unmarkChapterCompleted(id: number) {
    const s = new Set(this._completed());
    if (s.delete(id)) this._completed.set(s);
  }

  /** Consulta rápida */
  isChapterCompleted(id: number): boolean {
    return this._completed().has(id);
  }
}
