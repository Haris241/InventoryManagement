import { inject, Injectable, linkedSignal, signal } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged,filter, map, Observable, of, switchMap } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { PaginationResult } from '../Models/Pagination.model';

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
      filter(search => search.length > 2),
      switchMap(search => this.api.getById<T[]>(endpoint, search))
    );
    
    const searchResults = toSignal(search$, { initialValue: [] as T[] });
    
    const result = linkedSignal({
      source: searchResults,
      computation: (searched) => searched
    });
    
    return { 
      searchterm, 
      result: result.asReadonly(),
      setInitialValue: (items: T[]) => result.set(items)
    };
  }

  getData<TOutput,TInput>(endpoint:string,event: TableLazyLoadEvent,object: TInput):Observable<{data:TOutput[],total:number}>{
    const pageNumber= event.first && event.rows? Math.floor(event.first/event.rows) + 1 : 1;
    return this.api.getAllPost<PaginationResult<TOutput>,TInput>(`${endpoint}?pageNumber=${pageNumber}`,object).pipe(
        map(res=>{
          const currentTotal= (res.pageNumber-1)*res.pageSize + res.items.length;
          const totalrecords= res.hasNextPage?currentTotal + 1 : currentTotal;
          return{
            data: res.items,
            total: totalrecords
          };
        })
    );
  }
}
