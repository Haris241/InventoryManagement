import { Signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { AutoDropdown } from '../Pagination.model';

export interface SearchDropdown<T = AutoDropdown> {
  searchterm: WritableSignal<string>;
  result: Signal<T[]>;
  setInitialValue?: (items: T[]) => void;
}

export interface SourceModuleConfig<TLine> {
  label: string;
  search: SearchDropdown<AutoDropdown>;
  fetchLines: (id: string) => Observable<TLine[]>;
  duplicateError: string;
  isPriceReadonly?: (line: TLine) => boolean;
}

export function filterNewSourceLines<T extends { sourceRowId?: string | null }>(
  existingLines: T[],
  incomingLines: T[]
): { newLines: T[]; hasDuplicates: boolean } {
  const existingIds = new Set(
    existingLines.map(l => l.sourceRowId).filter((id): id is string => !!id)
  );
  const newLines = incomingLines.filter(l => l.sourceRowId && !existingIds.has(l.sourceRowId));
  const hasDuplicates = incomingLines.length > 0 && newLines.length === 0;

  return { newLines, hasDuplicates };
}
