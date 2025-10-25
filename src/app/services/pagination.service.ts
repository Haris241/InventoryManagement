import { inject, Injectable, signal } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged,filter, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {

  constructor() { }
  private api = inject(BaseApiService)
  autoSearchDropdown<T>(endpoint: string){
    const searchterm = signal<string>('');
    const search$ = toObservable(searchterm).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(search=>search.length>2),
      switchMap(search=>{
        return this.api.getById<T[]>(endpoint,search);
      }
      )
    );
    const result= toSignal(search$, { initialValue: [] as T[] });
    return {searchterm, result};
  }
}
