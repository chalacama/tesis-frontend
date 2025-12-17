// core/bridge/chapter-bridge.service.ts
import { Injectable, signal } from '@angular/core';

export interface ChapterContext {
  courseId: number;
  moduleId: number;
  chapterId: number;
}

@Injectable()
export class ChapterBridgeService {
  private readonly _ctx = signal<ChapterContext | null>(null);
  readonly ctx = this._ctx.asReadonly();

  setContext(ctx: ChapterContext) {
    this._ctx.set(ctx);
  }

  clear() {
    this._ctx.set(null);
  }
}
