import { Injectable, signal,effect } from '@angular/core';
export interface CourseRatingSummary {
  avg_stars: number;
  count: number;
  user_stars: number;
}
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

  // ================== PUENTE #1: CURSO COMPLETADO ==================
  /**
   * Cuando se emite un certificado (course completado) desde
   * ContentComponent o TestComponent, se marcará en este flag.
   * CourseComponent lo escucha para:
   *  - abrir el diálogo de rating
   *  - lanzar el toast de "Curso completado"
   */
  readonly certificateIssued = signal<boolean>(false);

  /** Llamar cuando el backend indique certificate_issued = true */
  notifyCertificateIssued() {
    this.certificateIssued.set(true);
  }

  /** Consumir el evento (CourseComponent lo llama después de abrir dialog/Toast) */
  consumeCertificateIssued() {
    this.certificateIssued.set(false);
  }

  // ================== PUENTE #2: RATING ACTUALIZADO ==================
  /**
   * Cuando se califique el curso en el futuro RatingComponent,
   * este resumen se actualizará aquí para que DetailComponent
   * pueda reflejar el promedio, el conteo y tu calificación.
   */
  readonly ratingSummary = signal<CourseRatingSummary | null>(null);

  setRatingSummary(summary: CourseRatingSummary) {
    this.ratingSummary.set(summary);
  }

  clearRatingSummary() {
    this.ratingSummary.set(null);
  }

  // ================== PUENTE #3: CERRAR DIÁLOGO RATING ==================
  /**
   * RatingComponent pide cerrar el cuadro de diálogo.
   * CourseComponent lo escucha y pone dialogShow = false.
   */
  readonly closeRatingDialog = signal<boolean>(false);

  requestCloseRatingDialog() {
    this.closeRatingDialog.set(true);
  }

  consumeCloseRatingDialog() {
    this.closeRatingDialog.set(false);
  }
}
