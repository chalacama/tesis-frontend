import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

import { ButtonComponent } from '../../../../../../../shared/UI/components/button/button/button.component';
import { IconComponent } from '../../../../../../../shared/UI/components/button/icon/icon.component';

import { ChapterService } from '../../../../../../../core/api/chapter/chapter.service';
import {
  Answer,
  Question,
  QuestionResponse,
  QuestionUpdateRequest,
  QuestionUpdateResponse,
} from '../../../../../../../core/api/chapter/chapter.interface';

// ⚠️ Ajusta estos imports si tu TypeService vive en otra ruta
import { TypeService } from '../../../../../../../core/api/type/type.service';
import { TypeQuestionResponse } from '../../../../../../../core/api/type/type.interface';
import { LoadingBarComponent } from '../../../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

type AnswerForm = FormGroup<{
  id: FormControl<number | null>;
  option: FormControl<string>;
  is_correct: FormControl<boolean>;
}>;

type QEditForm = FormGroup<{
  id: FormControl<number | null>;
  statement: FormControl<string>;
  type_questions_id: FormControl<number | null>;
  single: FormControl<number | null>; // índice seleccionado (para ÚNICA)
  spot: FormControl<number>;        
  answers: FormArray<AnswerForm>;
}>;

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, ButtonComponent, IconComponent, LoadingBarComponent],
  templateUrl: './question.component.html',
  styleUrl: './question.component.css',
})
export class QuestionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly chapterApi = inject(ChapterService);
  private readonly typeApi = inject(TypeService);
  private readonly fb = inject(FormBuilder);
  trackById = (_: number, t: TypeQuestionResponse) => t.id;
comparePrimitive = (a: any, b: any) =>
  a != null && b != null ? String(a) === String(b) : a === b;

  loading = signal<boolean>(false);
  loadingError = signal<string | null>(null);
  submitted = signal<boolean>(false);
  saved = signal<boolean>(false);
  // Catálogo de tipos de pregunta
  typeOptions = signal<TypeQuestionResponse[]>([]);

  // Datos originales por si quieres comparar cambios
  private originalQuestions = signal<Question[]>([]);

  // Form principal
  form = this.fb.group({
    questions: this.fb.array<QEditForm>([]),
  });

  get qArray(): FormArray<QEditForm> {
    return this.form.get('questions') as FormArray<QEditForm>;
  }

  total = computed(() => this.qArray.length);

  answeredAll = computed(() => {
    // Reglas mínimas: enunciado no vacío, >= 2 respuestas, al menos 1 correcta
    for (let i = 0; i < this.qArray.length; i++) {
      const qf = this.qArray.at(i);
      const hasStatement = (qf.get('statement')!.value || '').trim().length > 0;
      const answers = this.answersArray(i);
      if (answers.length < 2 || !hasStatement) return false;

      if (this.isMultiple(i)) {
        const anyCorrect = answers.controls.some(a => a.get('is_correct')!.value === true);
        if (!anyCorrect) return false;
      } else {
        const sel = this.singleCtrl(i).value;
        if (sel === null || sel === undefined) return false;
      }
    }
    return this.qArray.length > 0;
  });

  ngOnInit(): void {
    const chapterId = this.getChapterParamFromRoute();
    if (!chapterId) {
      this.loadingError.set('No se encontró el ID del capítulo en la ruta.');
      return;
    }
    this.fetchTypes();
    this.fetchQuestions(chapterId);
  }

  // ====== Carga de tipos ======
  private fetchTypes() {
    this.typeApi.getTypeQuestionAll().subscribe({
      next: (types) => this.typeOptions.set(types ?? []),
      error: () => this.typeOptions.set([]),
    });
  }

  // ====== Carga de preguntas ======
  private fetchQuestions(chapterId: string): void {
    this.loading.set(true);
    this.loadingError.set(null);
    this.submitted.set(false);
    this.qArray.clear();

    this.chapterApi
      .getQuestions(chapterId, {
        per_page: 1000,
        order_by: 'spot',
        order_dir: 'asc',
        include_correct: true,
      })
      .subscribe({
        next: (res: QuestionResponse) => {
          const list = res.questions ?? [];
          this.originalQuestions.set(list);
          list.forEach(q => this.qArray.push(this.createQForm(q)));
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loadingError.set('No se pudieron cargar las preguntas.');
          this.loading.set(false);
        },
      });
  }

  // ====== Builders ======
  private createAnswerForm(a?: Partial<Answer>): AnswerForm {
    return this.fb.group({
      id: this.fb.control<number | null>(a?.id ?? null),
      option: this.fb.control<string>(a?.option ?? '', { nonNullable: true }),
      is_correct: this.fb.control<boolean>((a?.is_correct ?? 0) === 1, { nonNullable: true }),
    });
  }

  // private createQForm(q?: Partial<Question>): QEditForm {
  //   const answers = (q?.answers ?? []).map(a => this.createAnswerForm(a));
  //   const form = this.fb.group({
  //     id: this.fb.control<number | null>(q?.id ?? null),
  //     statement: this.fb.control<string>(q?.statement ?? '', { nonNullable: true }),
  //     type_questions_id: this.fb.control<number | null>(q?.type_questions_id ?? this.defaultTypeId()),
  //     single: this.fb.control<number | null>(null),
  //     answers: this.fb.array<AnswerForm>(answers),
  //   });

  //   // Ajusta selección inicial según tipo
  //   const qIndex = this.qArray.length; // aún no insertado, pero no dependemos de él
  //   this.reconcileCorrectness(form);

  //   return form;
  // }
  private createQForm(q?: Partial<Question>): QEditForm {
  const typeId = q?.type_questions_id != null
    ? Number(q.type_questions_id)
    : this.defaultTypeId();

  const answers = (q?.answers ?? []).map(a => this.createAnswerForm(a));
  const form = this.fb.group({
    id: this.fb.control<number | null>(q?.id ?? null),
    statement: this.fb.control<string>(q?.statement ?? '', { nonNullable: true }),
    type_questions_id: this.fb.control<number | null>(typeId),
    single: this.fb.control<number | null>(null),
    spot: this.fb.control<number>(Number.isFinite(q?.spot as any) ? Number(q!.spot) : 1, { nonNullable: true }),
    answers: this.fb.array<AnswerForm>(answers),
  });

  this.reconcileCorrectness(form);
  return form;
}


  /* private defaultTypeId(): number | null {
    const opts = this.typeOptions();
    if (!opts.length) return null;
    // Por defecto: si existe un tipo que NO sea múltiple, usamos ese; sino el primero.
    const single = opts.find(t => !this.typeIsMultiple(t));
    return (single ?? opts[0]).id;
  } */
private defaultTypeId(): number | null {
  const opts = this.typeOptions();
  if (!opts.length) return 1;
  const prefer1 = opts.find(o => o.id === 1);
  return (prefer1 ?? opts[0]).id;
}

  // ====== Helpers de forma ======
  answersArray(i: number): FormArray<AnswerForm> {
    return this.qArray.at(i).get('answers') as FormArray<AnswerForm>;
  }
  ansCtrl(i: number, j: number): AnswerForm {
    return this.answersArray(i).at(j);
  }
  singleCtrl(i: number): FormControl<number | null> {
    return this.qArray.at(i).get('single') as FormControl<number | null>;
  }

  // Tipo múltiple según catálogo
  private typeIsMultiple(t: TypeQuestionResponse | undefined): boolean {
    if (!t) return false;
    const name = (t.nombre || '').toLowerCase();
    return /múltiple|multiple|checkbox|casilla/.test(name);
  }
  /* isMultiple(i: number): boolean {
    const typeId = this.qArray.at(i).get('type_questions_id')!.value;
    const t = this.typeOptions().find(x => x.id === typeId!);
    return this.typeIsMultiple(t);
  } */

  // ====== Eventos UI ======
  /* onTypeChange(i: number, raw: string | number) {
    const typeId = typeof raw === 'string' ? Number(raw) : raw;
    this.qArray.at(i).get('type_questions_id')!.setValue(typeId);
    this.reconcileCorrectness(this.qArray.at(i));
  } */
//   onTypeChange(i: number, raw: string | number) {
//   const typeId = typeof raw === 'string' ? Number(raw) : raw;
//   this.qArray.at(i).get('type_questions_id')!.setValue(typeId);
//   this.reconcileCorrectness(this.qArray.at(i));
// }
onTypeChange(i: number, raw: string | number) {
  const typeId = Number(raw);
  this.qArray.at(i).get('type_questions_id')!.setValue(typeId);
  this.reconcileCorrectness(this.qArray.at(i));
}


  // Cuando se edita una opción en preguntas de ÚNICA, marcarla como correcta con focus/click
  onAnswerFocusSelectCorrect(i: number, j: number) {
    if (!this.isMultiple(i)) {
      this.markCorrectSingle(i, j);
    }
  }

  // Radio
  markCorrectSingle(i: number, j: number) {
    const qf = this.qArray.at(i);
    this.singleCtrl(i).setValue(j);
    const answers = this.answersArray(i);
    answers.controls.forEach((a, idx) => {
      a.get('is_correct')!.setValue(idx === j);
    });
  }

  // Checkbox
  toggleCorrectMulti(i: number, j: number, checked: boolean) {
    const a = this.ansCtrl(i, j);
    a.get('is_correct')!.setValue(checked);
    this.form.markAsDirty();
  }

  // Mantiene coherencia entre controles de corrección para el tipo actual
  /* private reconcileCorrectness(qf: QEditForm) {
    const answers = qf.get('answers') as FormArray<AnswerForm>;
    const typeId = qf.get('type_questions_id')!.value;
    const t = this.typeOptions().find(x => x.id === typeId!);
    const multiple = this.typeIsMultiple(t);

    if (multiple) {
      // Dejar flags por respuesta; limpiar índice single
      qf.get('single')!.setValue(null);
      // Si ninguna marcada, no forzamos nada (validación lo detecta con answeredAll)
    } else {
      // Tomar el primer "is_correct" como índice; si no hay, dejar null
      let firstIdx = -1;
      answers.controls.forEach((a, i) => {
        if (firstIdx === -1 && a.get('is_correct')!.value === true) firstIdx = i;
      });
      qf.get('single')!.setValue(firstIdx >= 0 ? firstIdx : null);

      // En única, solo una puede quedar en true
      answers.controls.forEach((a, i) => {
        a.get('is_correct')!.setValue(i === firstIdx && firstIdx >= 0);
      });
    }
  } */

  // ====== CRUD de preguntas ======
  addQuestion() {
    const qForm = this.createQForm({
      statement: '',
      spot: '1',
      answers: [
        { option: 'Opción A', is_correct: 1 } as any,
        { option: 'Opción B', is_correct: 0 } as any,
      ] as Answer[],
    });
    this.qArray.push(qForm);
    // Si es única, marcar índice 0
    this.reconcileCorrectness(qForm);
    this.form.markAsDirty();
  }
coerceSpot(i: number) {
  const ctrl = this.qArray.at(i).get('spot') as FormControl<number>;
  const n = Math.max(0, Math.trunc(Number(ctrl.value ?? 0)));
  if (ctrl.value !== n) ctrl.setValue(n);
  this.form.markAsDirty();
}

  duplicateQuestion(i: number) {
    const src = this.qArray.at(i);
    const dup = this.fb.group({
      id: this.fb.control<number | null>(null),
      statement: this.fb.control<string>(src.get('statement')!.value, { nonNullable: true }),
      type_questions_id: this.fb.control<number | null>(src.get('type_questions_id')!.value),
      single: this.fb.control<number | null>(src.get('single')!.value),
      spot: this.fb.control<number>(src.get('spot')!.value, { nonNullable: true }),
      answers: this.fb.array<AnswerForm>(
        (src.get('answers') as FormArray<AnswerForm>).controls.map(a =>
          this.createAnswerForm({
            id: null as any,
            option: a.get('option')!.value,
            is_correct: a.get('is_correct')!.value ? 1 : 0,
            
          }),
        ),
      ),
    }) as QEditForm;

    this.qArray.insert(i + 1, dup);
    this.form.markAsDirty();
  }

  removeQuestion(i: number) {
    this.qArray.removeAt(i);
    this.form.markAsDirty();
  }

  // ====== CRUD de respuestas ======
  addAnswer(i: number) {
    const a = this.createAnswerForm({ option: 'Nueva opción', is_correct: 0 });
    this.answersArray(i).push(a);
    // Si única y no hay seleccionada, seleccionar esta recién agregada como correcta
    if (!this.isMultiple(i) && this.singleCtrl(i).value == null) {
      this.markCorrectSingle(i, this.answersArray(i).length - 1);
    }
    this.form.markAsDirty();
  }

  duplicateAnswer(i: number, j: number) {
    const src = this.ansCtrl(i, j);
    const dup = this.createAnswerForm({
      id: null as any,
      option: src.get('option')!.value,
      is_correct: src.get('is_correct')!.value ? 1 : 0,
    });
    this.answersArray(i).insert(j + 1, dup);
    // En única, la duplicada no se marca por defecto
    if (!this.isMultiple(i)) dup.get('is_correct')!.setValue(false);
    this.form.markAsDirty();
  }

  removeAnswer(i: number, j: number) {
    const answers = this.answersArray(i);
    const wasSelected = !this.isMultiple(i) && this.singleCtrl(i).value === j;

    answers.removeAt(j);

    if (!this.isMultiple(i)) {
      const current = this.singleCtrl(i).value;
      if (wasSelected) {
        this.singleCtrl(i).setValue(null);
      } else if (current !== null && current! > j) {
        this.singleCtrl(i).setValue(current! - 1);
      }
      // Garantizar coherencia con flags
      const sel = this.singleCtrl(i).value;
      answers.controls.forEach((a, idx) => a.get('is_correct')!.setValue(sel === idx));
    }

    this.form.markAsDirty();
  }

  // ====== Drag & Drop entre opciones ======
  listId(i: number) {
    return `answersList-${i}`;
  }
  connectedTo(i: number) {
    // Todas las listas se conectan entre sí
    return Array.from({ length: this.qArray.length }, (_, idx) => this.listId(idx));
  }
  private indexFromListId(id: string): number {
    return Number(id.replace('answersList-', ''));
  }

  dropAnswer(event: CdkDragDrop<AnswerForm[]>) {
    const srcIdx = this.indexFromListId(event.previousContainer.id);
    const dstIdx = this.indexFromListId(event.container.id);
    const prev = event.previousIndex;
    const curr = event.currentIndex;

    const srcAnswers = this.answersArray(srcIdx);
    const item = srcAnswers.at(prev);

    // Quitar del origen
    srcAnswers.removeAt(prev);

    // Insertar en destino
    const dstAnswers = this.answersArray(dstIdx);
    dstAnswers.insert(curr, item);

    // Ajustes de selección única
    if (!this.isMultiple(srcIdx)) {
      const sel = this.singleCtrl(srcIdx).value;
      if (sel !== null) {
        if (srcIdx === dstIdx) {
          // Reorden en misma lista
          let newSel = sel;
          if (sel === prev) newSel = curr;
          else if (sel > prev && sel <= curr) newSel = sel - 1;
          else if (sel < prev && sel >= curr) newSel = sel + 1;
          this.singleCtrl(srcIdx).setValue(newSel);
        } else {
          // Se movió a otra pregunta: limpiar selección si apuntaba al índice removido
          if (sel === prev) this.singleCtrl(srcIdx).setValue(null);
          else if (sel > prev) this.singleCtrl(srcIdx).setValue(sel - 1);
          // Reconciliar flags
          const selSrc = this.singleCtrl(srcIdx).value;
          this.answersArray(srcIdx).controls.forEach((a, idx) => a.get('is_correct')!.setValue(selSrc === idx));
        }
      }
    }

    // En destino, si es única y el ítem movido estaba en true, seleccionarlo
    if (!this.isMultiple(dstIdx)) {
      if (item.get('is_correct')!.value === true) {
        this.markCorrectSingle(dstIdx, curr);
      } else {
        // Mantener coherencia
        const selDst = this.singleCtrl(dstIdx).value;
        this.answersArray(dstIdx).controls.forEach((a, idx) => a.get('is_correct')!.setValue(selDst === idx));
      }
    }

    this.form.markAsDirty();
  }

  // ====== Guardar / Reset ======
  submit() {
  if (!this.answeredAll()) return;

  const chapterId = this.getChapterParamFromRoute();
  if (!chapterId) {
    this.loadingError.set('No se encontró el ID del capítulo en la ruta.');
    return;
  }

  const payload: QuestionUpdateRequest = this.buildPayload() as QuestionUpdateRequest;

  this.loading.set(true);
  this.loadingError.set(null);
  this.saved.set(true);

  this.chapterApi.updateQuestions(chapterId, payload).subscribe({
    next: (res: QuestionUpdateResponse) => {
      const list = res.questions ?? [];

      // Actualiza el snapshot original
      this.originalQuestions.set(list);

      // Reconstruye el FormArray con la data fresca del backend
      const rebuilt = this.fb.array<QEditForm>([]);
      list.forEach(q => rebuilt.push(this.createQForm(q)));
      this.form.setControl('questions', rebuilt);

      this.submitted.set(true);
      this.form.markAsPristine();
      this.form.markAsUntouched();
      this.loading.set(false);
      this.saved.set(false);
    },
    error: (err) => {
      console.error(err);
      this.loadingError.set('No se pudieron guardar los cambios.');
      this.loading.set(false);
    },
  });
}


  /* reset() {
    this.submitted.set(false);
    this.form.reset();
    this.qArray.clear();
    // Reconstruir desde originales
    this.originalQuestions().forEach(q => this.qArray.push(this.createQForm(q)));
    this.form.markAsPristine();
    
    
  } */
 reset() {
  this.submitted.set(false);

  const rebuilt = this.fb.array<QEditForm>([]);
  this.originalQuestions().forEach(q => rebuilt.push(this.createQForm(q)));

  this.form.setControl('questions', rebuilt);
  this.form.markAsPristine();
  this.form.markAsUntouched();
  this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
}


  // Construye payload ordenado por posición (spot)
  private buildPayload() {
    const questions = this.qArray.controls.map((qf, idxQ) => {
      const typeId = qf.get('type_questions_id')!.value!;
      const answers = (qf.get('answers') as FormArray<AnswerForm>).controls.map((af, idxA) => ({
        id: af.get('id')!.value,
        option: af.get('option')!.value,
        is_correct: af.get('is_correct')!.value ? 1 : 0,
        spot: idxA + 1,
      }));

      return {
        id: qf.get('id')!.value,
        statement: qf.get('statement')!.value,
        type_questions_id: typeId,
        spot: qf.get('spot')!.value,
        answers,
      };
    });

    return { questions };
  }

  // ====== Utilidades ======
  trackByIndex = (i: number) => i;
  letters(idx: number): string {
    return String.fromCharCode(65 + idx);
  }

  private getChapterParamFromRoute(): string | null {
    return (
      this.route.snapshot.paramMap.get('chapter') ??
      this.route.parent?.snapshot.paramMap.get('chapter') ??
      null
    );
  }
// ====== Tipos por ID ======
private isMultipleById = (typeId: number | null) => typeId === 1 || typeId === 2;

isTypeRadioMulti(i: number): boolean {
  const typeId = this.qArray.at(i).get('type_questions_id')!.value;
  return typeId === 1; // "Opción múltiple" visual radio pero comportamiento múltiple
}

isTypeCheckbox(i: number): boolean {
  const typeId = this.qArray.at(i).get('type_questions_id')!.value;
  return typeId === 2; // "Casilla de verificación" checkbox nativo
}

isMultiple(i: number): boolean {
  const typeId = this.qArray.at(i).get('type_questions_id')!.value;
  return this.isMultipleById(typeId);
}

  private reconcileCorrectness(qf: QEditForm) {
  const answers = qf.get('answers') as FormArray<AnswerForm>;
  const typeId = qf.get('type_questions_id')!.value;
  const multiple = this.isMultipleById(typeId);

  if (multiple) {
    // En múltiple no usamos índice 'single'
    qf.get('single')!.setValue(null);
    // No forzamos ninguna en true; la validación 'answeredAll' exige al menos una correcta
  } else {
    // Selección única: tomar la primera marcada o dejar null
    let firstIdx = -1;
    answers.controls.forEach((a, i) => {
      if (firstIdx === -1 && a.get('is_correct')!.value === true) firstIdx = i;
    });
    qf.get('single')!.setValue(firstIdx >= 0 ? firstIdx : null);

    // En única, solo una en true
    answers.controls.forEach((a, i) => {
      a.get('is_correct')!.setValue(i === firstIdx && firstIdx >= 0);
    });
  }
}

  
}
