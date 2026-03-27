import { inject, Injectable, linkedSignal, signal } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map, Observable, of, switchMap } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { CursorPaginationResult, CursorResponse, PaginationResult } from '../Models/Pagination.model';
import { DataLayerService } from './data-layer.service';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {

  constructor() { }
  private dataService = inject(DataLayerService)
  autoSearchDropdown<T>(endpoint: string) {
    const searchterm = signal<string>('');
    const search$ = toObservable(searchterm).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(search => search.length > 2),
      switchMap(search => this.dataService.getById<T[]>(endpoint, search))
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

  getData<TOutput, TInput>(endpoint: string, event: TableLazyLoadEvent, object: TInput): Observable<{ data: TOutput[], total: number }> {
    const pageNumber = event.first && event.rows ? Math.floor(event.first / event.rows) + 1 : 1;
    return this.dataService.getAllPost<PaginationResult<TOutput>, TInput>(`${endpoint}?pageNumber=${pageNumber}`, object).pipe(
      map(res => {
        const currentTotal = (res.pageNumber - 1) * res.pageSize + res.items.length;
        const totalrecords = res.hasNextPage ? currentTotal + 1 : currentTotal;
        return {
          data: res.items,
          total: totalrecords
        };
      })
    );
  }

  getDataCursor<TOutput, TInput>(endpoint: string, object: TInput): Observable<CursorResponse<TOutput>> {
    return this.dataService.getAllPost<CursorPaginationResult<TOutput>, TInput>(`${endpoint}`, object).pipe(
      map(res => {
        return {
          data: res.items,
          nextCursor: res.nextCursor,
          previousCursor: res.previousCursor,
          hasNextPage: res.hasNextPage,
          hasPreviousPage: res.hasPreviousPage
        };
      })
    );
  }
  getDataWithoutForm<T>(endpoint: string, event: TableLazyLoadEvent): Observable<{ data: T[], total: number }> {
    const pageNumber = event.first && event.rows ? Math.floor(event.first / event.rows) + 1 : 1;
    return this.dataService.getAllPostWithoutObject<PaginationResult<T>>(`${endpoint}?pageNumber=${pageNumber}`).pipe(
      map(res => {
        const currentTotal = (res.pageNumber - 1) * res.pageSize + res.items.length;
        const totalrecords = res.hasNextPage ? currentTotal + 1 : currentTotal;
        return {
          data: res.items,
          total: totalrecords
        };
      })
    );
  }
}
