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

import { TypeService } from '../../../../../../../core/api/type/type.service';
import { TypeQuestionResponse } from '../../../../../../../core/api/type/type.interface';
import { LoadingBarComponent } from '../../../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';
import { DialogComponent } from '../../../../../../../shared/UI/components/overlay/dialog/dialog.component';

type AnswerForm = FormGroup<{
  id: FormControl<number | null>;
  option: FormControl<string>;
  is_correct: FormControl<boolean>;
}>;

type QEditForm = FormGroup<{
  id: FormControl<number | null>;
  statement: FormControl<string>;
  type_questions_id: FormControl<number | null>;
  single: FormControl<number | null>; // índice seleccionado (ÚNICA)
  spot: FormControl<number>;          // puntaje
  answers: FormArray<AnswerForm>;
}>;

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule, 
    DialogComponent,
    ReactiveFormsModule, DragDropModule, ButtonComponent, IconComponent, LoadingBarComponent],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css'],
})
export class QuestionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly chapterApi = inject(ChapterService);
  private readonly typeApi = inject(TypeService);
  private readonly fb = inject(FormBuilder);
  dialogVisible = false;
  expandedState = signal<boolean[]>([]);
  trackById = (_: number, t: TypeQuestionResponse) => t.id;
  comparePrimitive = (a: any, b: any) =>
    a != null && b != null ? String(a) === String(b) : a === b;

  loading = signal<boolean>(false);
  loadingError = signal<string | null>(null);
  submitted = signal<boolean>(false);
  saved = signal<boolean>(false);
  // estado de arrastre de pregunta
isDraggingQuestion = signal(false);
// antes: trackByIndex = (i: number) => i;
trackByControl = (_: number, ctrl: QEditForm) => ctrl;
// agrega esto a tu componente
trackByAnswerControl = (_: number, ctrl: AnswerForm) => ctrl;

  typeOptions = signal<TypeQuestionResponse[]>([]);
  private originalQuestions = signal<Question[]>([]);
  testForm = this.fb.group({
  random: this.fb.control<boolean>(false, { nonNullable: true }),
  incorrect: this.fb.control<boolean>(true,  { nonNullable: true }),
  score: this.fb.control<boolean>(false, { nonNullable: true }),
  split: this.fb.control<number>(1, { nonNullable: true }),   // 1..2
  limited: this.fb.control<number>(0, { nonNullable: true }), // 0..2 (0 = ilimitado)
});
  form = this.fb.group({
    questions: this.fb.array<QEditForm>([]),
  });

  get qArray(): FormArray<QEditForm> {
    return this.form.get('questions') as FormArray<QEditForm>;
  }

  total = computed(() => this.qArray.length);

  answeredAll = computed(() => {
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
        order_by: 'order',      // ← orden por 'order'
        order_dir: 'asc',
        include_correct: true,
      })
      .subscribe({
        next: (res: QuestionResponse) => {
  // answers ordenadas
  const list = (res.questions ?? []).map(q => ({
    ...q,
    answers: (q.answers ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));

  // NUEVO: patch settings del test con defaults si no existen
  const t = res.test ?? {
    id: 0, chapter_id: 0,
    random: false, incorrect: true, score: false,
    split: 1, limited: 0,
    questions_count: list.length,
    updated_at: null, created_at: null,
  };
  // Coerce split y limited
  const split = Math.min(2, Math.max(1, Number(t.split ?? 1)));
  const limited = Math.min(2, Math.max(0, Number(t.limited ?? 0)));
  this.testForm.patchValue({
    random: !!t.random,
    incorrect: !!t.incorrect,
    score: !!t.score,
    split,
    limited,
  }, { emitEvent: false });
  this.testForm.markAsPristine();

  this.originalQuestions.set(list);
  this.qArray.clear();
  list.forEach(q => this.qArray.push(this.createQForm(q)));

  // NUEVO: todas expandidas por defecto
  this.expandedState.set(Array.from({ length: this.qArray.length }, () => true));

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

  // Tipos
  private typeIsMultiple(t: TypeQuestionResponse | undefined): boolean {
    if (!t) return false;
    const name = (t.nombre || '').toLowerCase();
    return /múltiple|multiple|checkbox|casilla/.test(name);
  }

  onTypeChange(i: number, raw: string | number) {
    const typeId = Number(raw);
    this.qArray.at(i).get('type_questions_id')!.setValue(typeId);
    this.reconcileCorrectness(this.qArray.at(i));
  }

  onAnswerFocusSelectCorrect(i: number, j: number) {
    if (!this.isMultiple(i)) {
      this.markCorrectSingle(i, j);
    }
  }

  markCorrectSingle(i: number, j: number) {
    const qf = this.qArray.at(i);
    this.singleCtrl(i).setValue(j);
    const answers = this.answersArray(i);
    answers.controls.forEach((a, idx) => {
      a.get('is_correct')!.setValue(idx === j);
    });
  }

  toggleCorrectMulti(i: number, j: number, checked: boolean) {
    const a = this.ansCtrl(i, j);
    a.get('is_correct')!.setValue(checked);
    this.form.markAsDirty();
  }

  // ====== CRUD de preguntas ======
  addQuestion() {
    const qForm = this.createQForm({
      statement: 'Nueva pregunta',
      spot: 1, // ← número, no string
      answers: [
        { option: 'Opción A', is_correct: 1 } as any,
        { option: 'Opción B', is_correct: 0 } as any,
      ] as Answer[],
    });
    this.qArray.push(qForm);
    this.reconcileCorrectness(qForm);
    this.form.markAsDirty();
    this.insertExpandState(this.qArray.length - 1, true);

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
    this.insertExpandState(i + 1, this.expandedState()[i] ?? true);
    this.form.markAsDirty();
  }

  removeQuestion(i: number) {
    this.qArray.removeAt(i);
    this.removeExpandState(i);
    this.form.markAsDirty();
  }

  // ====== CRUD de respuestas ======
  addAnswer(i: number) {
    const a = this.createAnswerForm({ option: 'Nueva opción', is_correct: 0 });
    this.answersArray(i).push(a);
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
      const sel = this.singleCtrl(i).value;
      answers.controls.forEach((a, idx) => a.get('is_correct')!.setValue(sel === idx));
    }

    this.form.markAsDirty();
  }

  // ====== Drag & Drop de respuestas ======
  listId(i: number) { return `answersList-${i}`; }
  connectedTo(i: number) {
    // Permite mover entre preguntas; si la respuesta tiene id y cambia de pregunta, le ponemos id=null
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

    // Si se mueve a otra pregunta y la respuesta ya existía en BD, forzar creación en destino
    if (srcIdx !== dstIdx) {
      const idCtrl = item.get('id')!;
      if (idCtrl.value !== null && idCtrl.value !== undefined) {
        idCtrl.setValue(null); // evitar 422 en backend (pertenencia a otra pregunta)
      }
    }

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
          let newSel = sel;
          if (sel === prev) newSel = curr;
          else if (sel > prev && sel <= curr) newSel = sel - 1;
          else if (sel < prev && sel >= curr) newSel = sel + 1;
          this.singleCtrl(srcIdx).setValue(newSel);
        } else {
          if (sel === prev) this.singleCtrl(srcIdx).setValue(null);
          else if (sel > prev) this.singleCtrl(srcIdx).setValue(sel - 1);
          const selSrc = this.singleCtrl(srcIdx).value;
          this.answersArray(srcIdx).controls.forEach((a, idx) => a.get('is_correct')!.setValue(selSrc === idx));
        }
      }
    }

    if (!this.isMultiple(dstIdx)) {
      if (item.get('is_correct')!.value === true) {
        this.markCorrectSingle(dstIdx, curr);
      } else {
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
       

        const list = (res.questions ?? []).map(q => ({
          ...q,
          answers: (q.answers ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        }));

        this.originalQuestions.set(list);

        const rebuilt = this.fb.array<QEditForm>([]);
        list.forEach(q => rebuilt.push(this.createQForm(q)));
        this.form.setControl('questions', rebuilt);

        this.submitted.set(true);
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.loading.set(false);
        this.saved.set(false);
         this.testForm.markAsPristine();
      },
      error: (err) => {
        console.error(err);
        this.loadingError.set('No se pudieron guardar los cambios.');
        this.loading.set(false);
      },
    });
  }

  reset() {
    this.submitted.set(false);
    const rebuilt = this.fb.array<QEditForm>([]);
    this.originalQuestions().forEach(q => rebuilt.push(this.createQForm(q)));
    this.form.setControl('questions', rebuilt);
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    this.expandedState.set(Array.from({ length: this.qArray.length }, () => true));

  }

  // Construye payload con orden por índice
  private buildPayload(): QuestionUpdateRequest {
  const questions = this.qArray.controls.map((qf, idxQ) => {
    const typeId = qf.get('type_questions_id')!.value!;
    const answers = (qf.get('answers') as FormArray<AnswerForm>).controls.map((af, idxA) => ({
      id: af.get('id')!.value,
      option: af.get('option')!.value,
      is_correct: af.get('is_correct')!.value === true,
      order: idxA + 1,
    }));
    return {
      id: qf.get('id')!.value,
      statement: qf.get('statement')!.value,
      type_questions_id: typeId,
      spot: qf.get('spot')!.value,
      order: idxQ + 1,
      answers,
    };
  });

  const test = {
    random: !!this.testForm.value.random,
    incorrect: !!this.testForm.value.incorrect,
    score: !!this.testForm.value.score,
    split: Math.min(2, Math.max(1, Number(this.testForm.value.split ?? 1))),
    limited: Math.min(2, Math.max(0, Number(this.testForm.value.limited ?? 0))),
  };

  return { test, questions };
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
    return typeId === 1; // Multiple con UI tipo radio
  }
  isTypeCheckbox(i: number): boolean {
    const typeId = this.qArray.at(i).get('type_questions_id')!.value;
    return typeId === 2; // Checkbox nativo
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
      qf.get('single')!.setValue(null);
    } else {
      let firstIdx = -1;
      answers.controls.forEach((a, i) => {
        if (firstIdx === -1 && a.get('is_correct')!.value === true) firstIdx = i;
      });
      qf.get('single')!.setValue(firstIdx >= 0 ? firstIdx : null);
      answers.controls.forEach((a, i) => {
        a.get('is_correct')!.setValue(i === firstIdx && firstIdx >= 0);
      });
    }
  }
  showSetting(){
    this.dialogVisible = !this.dialogVisible;
    
  }

  // ====== Expand/Collapse ======
toggleCollapse(index: number) {
  const arr = this.expandedState().slice();
  arr[index] = !arr[index];
  this.expandedState.set(arr);
}

collapseAll() {
  this.expandedState.set(Array.from({ length: this.qArray.length }, () => false));
}

expandAll() {
  this.expandedState.set(Array.from({ length: this.qArray.length }, () => true));
}

isCollapsed(i: number): boolean {
  return this.expandedState()[i] === false;
}

// Si agregas/duplicas/borras preguntas, también ajusta expandedState:
private insertExpandState(at: number, value = true) {
  const arr = this.expandedState().slice();
  arr.splice(at, 0, value);
  this.expandedState.set(arr);
}
private removeExpandState(at: number) {
  const arr = this.expandedState().slice();
  arr.splice(at, 1);
  this.expandedState.set(arr);
}
private moveExpandState(from: number, to: number) {
  if (from === to) return;
  const arr = this.expandedState().slice();
  const [it] = arr.splice(from, 1);
  arr.splice(to, 0, it);
  this.expandedState.set(arr);
}

dropQuestion(event: CdkDragDrop<any[]>) {
  const prev = event.previousIndex;
  const curr = event.currentIndex;
  if (prev === curr) return;

  const ctrl = this.qArray.at(prev);
  this.qArray.removeAt(prev);
  this.qArray.insert(curr, ctrl);

  // Mueve también el estado expandido
  this.moveExpandState(prev, curr);

  this.form.markAsDirty(); // para que el botón Guardar se habilite
}

coerceSplit() {
  const c = this.testForm.get('split')!;
  const n = Math.min(2, Math.max(1, Math.trunc(Number(c.value ?? 1))));
  if (c.value !== n) c.setValue(n);
}
coerceLimited() {
  const c = this.testForm.get('limited')!;
  const n = Math.min(2, Math.max(0, Math.trunc(Number(c.value ?? 0))));
  if (c.value !== n) c.setValue(n);
}
saveSettingsFromDialog() {
  // Reutilizamos submit() para persistir test + preguntas
  if (!this.answeredAll()) {
    // si no quieres bloquear por validez de preguntas, podrías quitar este check solo para settings
  }
  this.submit();
  this.showSetting();
}



}
