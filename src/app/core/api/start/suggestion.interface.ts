
// suggestion.interface.ts

export interface SuggestionItem {
  text: string;
  is_history: boolean;
}

export interface SuggestionResponse {
  suggestions: SuggestionItem[];
}
