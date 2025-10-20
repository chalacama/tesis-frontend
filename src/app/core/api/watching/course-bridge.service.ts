import { Injectable, signal } from '@angular/core';

@Injectable()
export class CourseBridge {
  // Estado compartido solo durante /learning/course/...
  readonly isRegistered = signal<boolean>(false);

  setRegistered(v: boolean) {
    this.isRegistered.set(v);
  }
}
