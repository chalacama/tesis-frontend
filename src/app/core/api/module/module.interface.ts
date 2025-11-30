// module.interface.ts
export interface ModuleResponse {
    id:         number;
    name:       string;
    order:      number;
    course_id:  number;
    created_at: string;
    updated_at: string;
    /* deleted_at:  string | null; */
    chapters: Chapters[];
}
export interface Chapters {
    id:         number;
    title:       string;
    description: string;
    order:      number;
    module_id:  number;
    created_at: string;
    updated_at: string;
    
    questions_count: number;
    learning_content:LearningContent
}
export interface LearningContent {
    id: number;
    type_content_id: number;
    chapter_id: number;
    type_learning_content: TypeLearningContent
}
export interface TypeLearningContent {
    id: number;
    name: string;
}


/** ============ NUEVO: payload unificado Módulos+Capítulos ============ **/
export interface UpdateAllRequest {
  course_id: number;

  // flags independientes
  remove_missing_modules?: boolean;
  remove_missing_chapters?: boolean;

  // módulos y capítulos (unificado)
  modules: ModuleUpsert[];
  chapters?: ChapterUpsert[];
}

export interface ModuleUpsert {
  id:        number | null;  // existente => id, nuevo => null
  client_id?: number | null; // si es nuevo, id temporal negativo del front
  name:      string;
  order:     number;
}

export interface ChapterUpsert {
  id:        number | null;    // existente => id, nuevo => null
  title:     string;
  description: string | null;
  order:     number;

  // destino:
  module_id?: number | null;        // si apunta a módulo existente (id positivo)
  client_module_id?: number | null; // si apunta a módulo nuevo (id temporal negativo)
}

/** respuesta del update unificado (módulos con capítulos completos) */
export interface UpdateAllResponse {
  ok: boolean;
  modules: ModuleResponse[];
}



