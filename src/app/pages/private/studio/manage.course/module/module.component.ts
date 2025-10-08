// module.component.ts
import { Component, OnInit, HostListener, signal, computed, inject, effect, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray, DragDropModule,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../../../../../shared/UI/components/button/button/button.component';
import { ModuleService } from '../../../../../core/api/module/module.service';
import { ModuleResponse } from '../../../../../core/api/module/module.interface';
import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

type ChapItem = {
  id: number;
  order: number;
  updated_at: string;
  title: string;
  description: string | null;
  type_name: string;        // viene de learning_content.type_learning_content.name
  questions_count: number;
  new?: boolean;
  edited?: boolean;
  _moduleId?: number;    // módulo actual (para preparar payload)
  _moved?: boolean;      // si se movió de módulo
};

type ModItem = {
  id: number;
  order: number;
  updated_at: string;
  name: string;
  chapters: ChapItem[];     // <-- debe ser array
  new?: boolean;
  edited?: boolean;
  openChapters?: boolean;
};

@Component({
  selector: 'app-module',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, 
    CdkDropList, CdkDrag, ButtonComponent, IconComponent,
    LoadingBarComponent
  ],
  templateUrl: './module.component.html',
  styleUrl: './module.component.css',
})
export class ModuleComponent implements OnInit {
  // inyecciones
  private readonly route = inject(ActivatedRoute);
  private readonly moduleSrv = inject(ModuleService);
  // private router: Router,
  private readonly router = inject(Router);
 private chaptersDirty = signal<boolean>(false);
  // estado UI
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // datos
  modules = signal<ModItem[]>([]);
  private original = signal<ModItem[]>([]);

  // popover/edición
  openMenuIndex = signal<number | null>(null);
  openMenuIndexChap = signal<number | null>(null);
  editingId = signal<number | null>(null);
  nameBuffer = signal<string>('');
  openMenuChapKey = signal<string | null>(null);
  editingChapKey = signal<string | null>(null);
  chapTitleBuffer = signal<string>('');
  chapDescBuffer = signal<string>(''); 
chapKey = (moduleId: number, chapId: number) => `${moduleId}:${chapId}`;
  // botones deshabilitados si no hay cambios
  hasChanges = computed(() => {
    const a = this.modules();
    const b = this.original();
    if (this.chaptersDirty()) return true;
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
      const x = a[i], y = b[i];
      if (x.id !== y.id || x.name !== y.name || x.order !== y.order) {
        return true;
      }
    }
    return false;
  });
chapListId = (moduleId: number) => `chap-list-${moduleId}`;
  chapterListIds(): string[] {
    return this.modules().map(m => this.chapListId(m.id));
  }
private getCourseParamFromRoute(): string | null {
    // Busca 'id' en la ruta actual y en el padre (robusto para layouts anidados)
    return this.route.snapshot.paramMap.get('id')
      ?? this.route.parent?.snapshot.paramMap.get('id')
      ?? null;
  }
  // === Helpers de "nuevo" ===
private isNewModule = (m: ModItem) => m.id <= 0;   // id negativo => nuevo (client_id)
private isNewChapter = (c: ChapItem) => c.id <= 0; // id negativo => nuevo

// === Generador de id temporal negativo para módulos ===
private nextTempModuleId(): number {
  const minId = this.modules().reduce((min, m) => Math.min(min, m.id), 0);
  return minId >= 0 ? -1 : (minId - 1);
}

  ngOnInit(): void {
    // lee :course de la ruta (puede ser id o slug)
    const course = this.getCourseParamFromRoute();
    if (!course) {
      this.error.set('No se recibió el parámetro de curso en la ruta.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.moduleSrv.getByCourse(course).subscribe({
      next: (res) => {
        const mapped = this.mapToModItems(res);
        this.modules.set(mapped);
        this.recomputeOrder();                 // asegura orden consecutivo si el backend lo trae mixto
        this.original.set(this.clone(mapped)); // snapshot
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('No se pudieron cargar los módulos.'); // mensaje amigable
        this.loading.set(false);
      }
    });
  }

  // --- Drag & drop ---
  drop(event: CdkDragDrop<ModItem[]>) {
    const arr = this.clone(this.modules());
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.modules.set(arr);
    this.recomputeOrder();
    this.closeMenus();
  }

  // --- Popover + click fuera ---
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    if (!target.closest('.module-item') && !target.closest('.popover-menu')) {
      this.closeMenus();
    }
  }
  toggleMenu(i: number) {
    this.openMenuIndex.set(this.openMenuIndex() === i ? null : i);
  }
  toggleMenuChap(moduleId: number, chapId: number) {
  const key = this.chapKey(moduleId, chapId);
  this.openMenuChapKey.set(this.openMenuChapKey() === key ? null : key);
}
  closeMenus() {
    this.openMenuIndex.set(null);
  }

  // --- Acciones del menú ---
  startRename(i: number) {
    const item = this.modules()[i];
    this.editingId.set(item.id);
    this.nameBuffer.set(item.name);
    this.closeMenus();
    
  }

  startRenameChap(m: ModItem, ch: ChapItem) {
  this.editingChapKey.set(this.chapKey(m.id, ch.id));
  this.chapTitleBuffer.set(ch.title);
  this.openMenuChapKey.set(null);
  ch.edited = true;

}
applyRenameChap(m: ModItem, ch: ChapItem) {
  if (this.editingChapKey() !== this.chapKey(m.id, ch.id)) return;
  const newTitle = this.chapTitleBuffer().trim();
  if (newTitle && newTitle !== ch.title) {
    ch.title = newTitle;
    ch.updated_at = this.todayIso();
    ch.edited = true;
    this.chaptersDirty.set(true);
  }
  this.editingChapKey.set(null);
}

cancelRenameChap() {
  this.editingChapKey.set(null);
}
  applyRename(item: ModItem) {
    if (this.editingId() !== item.id) return;
    const newName = this.nameBuffer().trim();
    if (newName && newName !== item.name) {
      const arr = this.clone(this.modules());
      const idx = arr.findIndex(m => m.id === item.id);
      arr[idx] = { ...arr[idx], name: newName, updated_at: this.todayIso(), edited: true };
      this.modules.set(arr);
    }
    this.editingId.set(null);
  }
  cancelRename() { this.editingId.set(null); }

  addAbove(i: number) {
    const arr = this.clone(this.modules());
    const newId = this.nextId(arr); // id temporal solo para trackBy
    const today = this.todayIso();
    const ref = arr[i];

    const newItem: ModItem = {
      id: newId,
      order: ref.order,
      updated_at: today,
      name: 'nuevo modulo',
      chapters: [],
      new: true,
      edited: false,
      openChapters: false
    };
    arr.splice(i, 0, newItem);
    this.modules.set(arr);
    this.recomputeOrder();
    this.closeMenus();
    this.editingId.set(newId);
    this.nameBuffer.set(newItem.name);
  }
   addBelow(i: number) {
  const arr = this.clone(this.modules());
  const newId = this.nextId(arr);
  const today = this.todayIso();
  const ref = arr[i];

  const newItem: ModItem = {
    id: newId,
    order: ref.order + 1,     // por debajo
    updated_at: today,
    name: 'nuevo modulo',
    chapters: [],
    new: true,
    edited: false,
    openChapters: false
  };

  arr.splice(i + 1, 0, newItem); // <= debajo
  this.modules.set(arr);
  this.recomputeOrder();

  this.closeMenus();
  this.editingId.set(newId);
  this.nameBuffer.set(newItem.name);
}

  add(i: number) {
    const arr = this.clone(this.modules());
    const newId = this.nextId(arr); // id temporal solo para trackBy
    const today = this.todayIso();
    const ref = arr[i];

    const newItem: ModItem = {
      id: newId,
      order: ref.order,
      updated_at: today,
      name: 'nuevo modulo',
      chapters: [],
      new: true,
      edited: false,
      openChapters: false
    };
    arr.splice(i, 0, newItem);
    this.modules.set(arr);
    this.recomputeOrder();
    this.closeMenus();
    this.editingId.set(newId);
    this.nameBuffer.set(newItem.name);
  }
  addAboveChap(m: ModItem, chapIndex: number) {
  const today = this.todayIso();
  const newId = this.nextTempChapterId(m);
  const newChap: ChapItem = {
    id: newId,        // id temporal (solo UI), el backend te dará el real
    order: m.chapters[chapIndex]?.order ?? (chapIndex + 1),
    updated_at: today,
    title: 'nuevo capítulo',
    description: '',
    type_name: 'Sin contenido',
    questions_count: 0,
    _moduleId: m.id,
    _moved: false,
    new: true,
    edited: false,
  };
  const arr = this.clone(m.chapters);
  arr.splice(chapIndex, 0, newChap);
  m.chapters = arr;
  this.recomputeChapterOrder(m);
  this.chaptersDirty.set(true);

  // entra en edición inmediata
  this.startRenameChap(m, newChap);
}
addBelowChap(m: ModItem, chapIndex: number) {
  const today = this.todayIso();
  const newId = this.nextTempChapterId(m);

  const newChap: ChapItem = {
    id: newId,
    order: (m.chapters[chapIndex]?.order ?? chapIndex + 1) + 1,  // debajo
    updated_at: today,
    title: 'nuevo capítulo',
    description: '',
    type_name: 'Sin contenido',
    questions_count: 0,
    _moduleId: m.id,
    _moved: false,
    new: true,
    edited: false,
  };

  const arr = this.clone(m.chapters);
  arr.splice(chapIndex + 1, 0, newChap); // <= debajo
  m.chapters = arr;
  this.recomputeChapterOrder(m);
  this.chaptersDirty.set(true);

  this.startRenameChap(m, newChap);
}

private nextTempChapterId(m: ModItem): number {
  // genera un id temporal negativo único por módulo para no chocar con ids reales
  const minId = m.chapters.reduce((min, c) => Math.min(min, c.id), 0);
  return minId > 0 ? -1 : (minId - 1);
}
addModule() {
  const arr = this.clone(this.modules());
  const newId = this.nextTempModuleId();  // NEGATIVO
  const today = this.todayIso();

  const newItem: ModItem = {
    id: newId,               // <== importante
    order: 1,
    updated_at: today,
    name: 'nuevo modulo',
    chapters: [],
    new: true,
    edited: false,
    openChapters: false
  };

  arr.unshift(newItem);
  this.modules.set(arr);
  this.recomputeOrder();

  this.editingId.set(newId);
  this.nameBuffer.set(newItem.name);
}



  removeAt(i: number) {
    const arr = this.clone(this.modules());
    const item = arr[i];
    if (confirm(`¿Eliminar el módulo: "${item.name}"?`)) {
      arr.splice(i, 1);
      this.modules.set(arr);
      this.recomputeOrder();
      this.closeMenus();
    }
  }
 removeAtChap(m: ModItem, chapIndex: number) {
  const ch = m.chapters[chapIndex];
  if (!ch) return;
  if (confirm(`¿Eliminar el capítulo: "${ch.title}"?`)) {
    const arr = this.clone(m.chapters);
    arr.splice(chapIndex, 1);
    m.chapters = arr;
    this.recomputeChapterOrder(m);
    this.chaptersDirty.set(true);
    // cierra menú/contextos si apuntaban a este cap
    if (this.openMenuChapKey() === this.chapKey(m.id, ch.id)) this.openMenuChapKey.set(null);
    if (this.editingChapKey() === this.chapKey(m.id, ch.id)) this.editingChapKey.set(null);
  }
}
// Limitar largo y marcar como editado mientras el usuario escribe
onDescInput(m: ModItem, ch: ChapItem, value: string) {
  const v = (value ?? '').slice(0, 500); // ejemplo: máximo 500 chars
  if (v !== (ch.description ?? '')) {
    ch.description = v;
    ch.edited = true;
    this.chaptersDirty.set(true);
  }
}

// Al salir del foco, actualiza la fecha (cosmético/UI)
onDescBlur(m: ModItem, ch: ChapItem) {
  ch.updated_at = this.todayIso();
}

addChapter(m: ModItem) {
  const today = this.todayIso();
  const newId = this.nextTempChapterId(m); // id temporal (negativo)

  const newChap: ChapItem = {
    id: newId,
    order: 1,                      // al inicio
    updated_at: today,
    title: 'nuevo capítulo',
    description: '',
    type_name: 'Sin contenido',
    questions_count: 0,
    _moduleId: m.id,
    _moved: false,
    new: true,
    edited: false,
  };

  const arr = this.clone(m.chapters);
  arr.unshift(newChap);            // <= al inicio
  m.chapters = arr;
  this.recomputeChapterOrder(m);   // normaliza 1..n

  this.chaptersDirty.set(true);    // <- habilita Guardar
  this.startRenameChap(m, newChap);
}


  // --- Guardar / Restablecer ---
  // saveChanges() {
  //   const courseStr = this.getCourseParamFromRoute();
  //   if (!courseStr) {
  //     this.error.set('No se recibió el parámetro de curso.');
  //     return;
  //   }
  //   const course_id = Number(courseStr);

  //   const payload = {
  //     course_id,
  //     remove_missing: true,
  //     modules: this.modules().map(m => ({
  //       id: m.new ? null : m.id,     // nuevos => null
  //       name: m.name.trim(),
  //       order: m.order,
  //     })),
  //   };

  //   this.loading.set(true);
  //   /* this.moduleSrv.updateModules(payload).subscribe({
  //     next: (res) => {
  //       // Refresca con lo que devuelve el backend (ids reales + chapters_count)
  //       const mapped = this.mapToModItems(res.modules);
  //       this.modules.set(mapped);
  //       this.original.set(this.clone(mapped));
  //       this.loading.set(false);
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.error.set('No se pudieron guardar los cambios.');
  //       this.loading.set(false);
  //     }
  //   }); */
  // }
  resetChanges() {
  this.modules.set(this.clone(this.original()));
  this.editingId.set(null);

  // limpiar estado de capítulos/menús/flags
  this.openMenuIndex.set(null);
  this.openMenuChapKey.set(null);
  this.editingChapKey.set(null);
  this.nameBuffer.set('');
  this.chapTitleBuffer.set('');
  this.chaptersDirty.set(false);   // <= IMPORTANTÍSIMO

  // opcional: cerrar todos los acordeones
  const arr = this.clone(this.modules());
  arr.forEach(m => (m.openChapters = false));
  this.modules.set(arr);
}

trackByChapter(index: number, item: ChapItem): string {
  return item.id.toString(); // replace 'id' with the unique identifier property of your ChapItem
}
  // --- Utilidades ---
  trackById = (_: number, m: ModItem) => m.id;

  private clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

  private recomputeOrder() {
    const arr = this.clone(this.modules());
    arr.forEach((m, idx) => (m.order = idx + 1));
    this.modules.set(arr);
  }

  private nextId(arr: ModItem[]) {
    return (arr.reduce((a, b) => (b.id > a ? b.id : a), 0) || 0) + 1;
  }

  private todayIso() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private mapToModItems(res: ModuleResponse[]): ModItem[] {
    return (res ?? [])
      .sort((a, b) => a.order - b.order)
      .map(r => ({
        id: r.id,
        order: r.order,
        updated_at: r.updated_at?.slice(0, 10) ?? '',
        name: r.name,
        openChapters: false,
        edited: false,
        new: false,
        chapters: (r.chapters ?? [])
          .sort((c1, c2) => c1.order - c2.order)
          .map(c => ({
            id: c.id,
            order: c.order,
            updated_at: c.updated_at?.slice(0, 10) ?? '',
            title: c.title,
            description: c.description,
            type_name: c.learning_content?.type_learning_content?.name ?? 'Sin contenido',
            questions_count: c.questions_count ?? 0,
            _moduleId: r.id,           // módulo al que pertenece
            _moved: false,
          }))
      }));
  }

  /* openAccordion = false; */
  openChapters(m: ModItem) {
    
    if(m.openChapters){
      m.openChapters = false;
    }else{
      m.openChapters = true;
    }
  } 
  // Drop de capítulos (dentro de un módulo o entre módulos)
  dropChapter(event: CdkDragDrop<ChapItem[]>, targetModule: ModItem) {
    const sameList = event.previousContainer === event.container;

    if (sameList) {
      // Reordenar dentro del mismo módulo
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.recomputeChapterOrder(targetModule);
    } else {
      // Mover capítulo entre módulos
      transferArrayItem(
        event.previousContainer.data, // fuente
        event.container.data,         // destino
        event.previousIndex,
        event.currentIndex
      );
      // Normaliza órdenes en ambos módulos (origen y destino)
      const srcListEl = event.previousContainer.element.nativeElement as HTMLElement;
      const dstListEl = event.container.element.nativeElement as HTMLElement;

      const srcModuleId = this.moduleIdFromListId(srcListEl.id);
      const dstModuleId = this.moduleIdFromListId(dstListEl.id);

      const srcModule = this.modules().find(m => m.id === srcModuleId);
      const dstModule = this.modules().find(m => m.id === dstModuleId);

      if (srcModule) this.recomputeChapterOrder(srcModule);
      if (dstModule) this.recomputeChapterOrder(dstModule);

      // Marca el capítulo movido con su nuevo módulo
      const movedChapter = event.container.data[event.currentIndex];
      movedChapter._moduleId = dstModuleId;
      movedChapter._moved = true;
    }

    this.chaptersDirty.set(true);
  }
    
  private moduleIdFromListId(listId: string): number {
    // listId: "chap-list-<id>"
    const parts = listId.split('chap-list-');
    const idStr = parts[1] ?? '';
    return Number(idStr);
    }

  private recomputeChapterOrder(module: ModItem) {
    module.chapters.forEach((ch, idx) => (ch.order = idx + 1));
  }
 saving  = signal<boolean>(false);
  // Guardar cambios (ejemplo de payload para capítulos)
  saveChanges() {
  const courseStr = this.getCourseParamFromRoute();
  if (!courseStr) { this.error.set('No se recibió el parámetro de curso.'); return; }
  const course_id = Number(courseStr);

  // 1) Modules payload (usar client_id para nuevos)
  const modulesPayload = this.modules().map(m => ({
    id: this.isNewModule(m) ? null : m.id,
    client_id: this.isNewModule(m) ? m.id : null, // si es nuevo, id negativo como client_id
    name: m.name.trim(),
    order: m.order,
  }));

  // 2) Chapters payload
  //    Para cada capítulo calculamos su módulo destino.
  //    - Si el módulo destino es nuevo (id negativo) => client_module_id
  //    - Si es existente (id positivo) => module_id
  const chaptersPayload = this.modules().flatMap(m =>
    m.chapters.map(ch => {
      const destModuleId = ch._moduleId ?? m.id; // mapeas al contenedor real o al movido
      const isDestModuleNew = destModuleId <= 0;

      return {
        id: this.isNewChapter(ch) ? null : ch.id,
        title: ch.title.trim(),
        description: ch.description ?? null,
        order: ch.order,
        module_id: isDestModuleNew ? null : destModuleId,
        client_module_id: isDestModuleNew ? destModuleId : null,
      };
    })
  );

  const payload = {
    course_id,
    remove_missing_modules: true,   // o controla con tu UI
    remove_missing_chapters: true,  // ídem
    modules: modulesPayload,
    chapters: chaptersPayload,
  };

  this.loading.set(true);
  this.saving.set(true);
  this.moduleSrv.updateAll(payload).subscribe({
    next: (res) => {
      // Refresca el estado con lo que devuelve el backend (ids reales, orden ya normalizado)
      const mapped = this.mapToModItems(res.modules);
      this.modules.set(mapped);
      this.original.set(this.clone(mapped));

      // Limpia estado de edición/flags para que [disabled]="!hasChanges()" quede correcto
      this.editingId.set(null);
      this.openMenuIndex.set(null);
      this.openMenuChapKey.set(null);
      this.editingChapKey.set(null);
      this.nameBuffer.set('');
      this.chapTitleBuffer.set('');
      this.chaptersDirty.set(false);

      this.loading.set(false);
      this.saving.set(false);
    },
    error: (err) => {
      console.error(err);
      this.error.set('No se pudieron guardar los cambios.');
      this.loading.set(false);
    }
  });
}
chapterNavigateTo(chapId: number , modId: number) {
  const courseStr = this.getCourseParamFromRoute();
  const course_id = Number(courseStr);
  console.log('Navegando a capítulo', chapId, 'del módulo', modId, 'del curso', course_id);
  this.router.navigate(['/studio', course_id, 'module',  modId, 'chapter', chapId]);
}

}
