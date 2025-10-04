import { Injectable, WritableSignal, signal } from '@angular/core';
import { UiToastProps } from '../UI/interfaces/ui-toast.interface';


export interface UiToastMessage extends UiToastProps {
  id: number;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class UiToastService {
  private _seq = 0;
  private _messages: WritableSignal<UiToastMessage[]> = signal<UiToastMessage[]>([]);
  readonly messages = this._messages.asReadonly();

  add(toast: UiToastProps) {
    const id = ++this._seq;
    const now = Date.now();
    const msg: UiToastMessage = {
      id,
      createdAt: now,
      severity: toast.severity ?? 'primary',
      position: toast.position ?? 'top-right',
      sticky: toast.sticky ?? false,
      lifetime: toast.lifetime ?? 3000,
      summary: toast.summary ?? '',
      message: toast.message ?? ''
    };
    this._messages.update(list => [...list, msg]);

    // Autocierre si no es sticky
    if (!msg.sticky && msg.lifetime! > 0) {
      window.setTimeout(() => this.remove(id), msg.lifetime);
    }
  }

  remove(id: number) {
    this._messages.update(list => list.filter(m => m.id !== id));
  }

  clear(position?: UiToastProps['position']) {
    if (!position) {
      this._messages.set([]);
      return;
    }
    this._messages.update(list => list.filter(m => m.position !== position));
  }
}
