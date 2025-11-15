// core/bridge/portfolio-bridge.service.ts (ajusta la ruta según tu estructura)

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortfolioBridgeService {

  private searchTermSubject = new BehaviorSubject<string>('');
  /** Observable para que UserCoursesComponent escuche los cambios de búsqueda */
  searchTerm$ = this.searchTermSubject.asObservable();

  /** Actualiza el término de búsqueda del portafolio */
  setSearchTerm(term: string) {
    this.searchTermSubject.next(term);
  }
}

