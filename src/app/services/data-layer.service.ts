import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../Enviroments/enviroment';
import { ReportResponse } from '../shared/Utility';

@Injectable({
  providedIn: 'root',
})
export class DataLayerService {

  baseurl = environment.apiUrl;
  huburl = environment.hubUrl;
  private http = inject(HttpClient)
  getAll<T>(controller: string): Observable<T> {
    return this.http.get<T>(`${this.baseurl}${controller}`, { withCredentials: true });
  }
  getAllPost<TOutput, TInput>(controller: string, object: TInput): Observable<TOutput> {
    return this.http.post<TOutput>(`${this.baseurl}${controller}`, object, { withCredentials: true });
  }
  getAllPostWithoutObject<T>(controller: string): Observable<T> {
    return this.http.post<T>(`${this.baseurl}${controller}`, null, { withCredentials: true });
  }
  getAllSimple<T>(controller: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseurl}${controller}`, { withCredentials: true });
  }
  create<T>(controller: string, object: T | FormData): Observable<T> {
    return this.http.post<T>(`${this.baseurl}${controller}`, object, { withCredentials: true });
  }
  createResponse<TInput, TOutput>(controller: string, object?: TInput): Observable<TOutput> {
    return this.http.post<TOutput>(`${this.baseurl}${controller}`, object ?? {}, { withCredentials: true });
  }
  delete<T>(controller: string, id: string): Observable<T> {
    return this.http.delete<T>(`${this.baseurl}${controller}/${id}`, { withCredentials: true });
  }
  edit<T>(controller: string, id: string, object: T | FormData): Observable<T> {
    return this.http.put<T>(`${this.baseurl}${controller}/${id}`, object, { withCredentials: true });
  }
  editResponse<TInput, TOutput>(controller: string, id: string, object?: TInput): Observable<TOutput> {
    return this.http.put<TOutput>(`${this.baseurl}${controller}/${id}`, object ?? {}, { withCredentials: true });
  }
  getById<T>(controller: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.baseurl}${controller}/${id}`, { withCredentials: true });
  }
  deleteAll<T>(controller: string): Observable<T> {
    return this.http.delete<T>(`${this.baseurl}${controller}`, { withCredentials: true });
  }
  updateAll<T>(controller: string): Observable<T> {
    return this.http.put<T>(`${this.baseurl}${controller}`, { withCredentials: true });
  }
  getReport(controller: string, id: number | string): Observable<Blob> {
    return this.http.get(`${this.baseurl}${controller}/${id}`, { responseType: 'blob', withCredentials: true }).pipe(this.handleBlobError());
  }
  getReportByData(controller: string, object: any): Observable<Blob> {
    return this.http.post(`${this.baseurl}${controller}`, object, { responseType: 'blob', withCredentials: true }).pipe(this.handleBlobError());
  }
  downloadReport(controller: string): Observable<Blob> {
    return this.http.get(`${this.baseurl}${controller}`, { responseType: 'blob', withCredentials: true }).pipe(this.handleBlobError());
  }

  getReportOrJob<TRequest, TJob>(controller: string, data: TRequest): Observable<ReportResponse<TJob>> {

    return this.http.post(`${this.baseurl}${controller}`, data, { observe: 'response', responseType: 'blob', withCredentials: true }).pipe(

      this.handleBlobError(),

      switchMap((response): Observable<ReportResponse<TJob>> => {

        const contentType = response.headers.get('content-type') ?? '';

        // JSON => Background Job
        if (contentType.includes('application/json')) {

          return from(response.body!.text()).pipe(
            map((text): ReportResponse<TJob> => ({
              type: 'job',
              job: JSON.parse(text) as TJob
            }))
          );
        }

        // Everything else is treated as a downloadable file
        return of<ReportResponse<TJob>>({ type: 'file', blob: response.body! });
      })
    );
  }

  /**
   * RxJS operator that converts Blob error responses to parsed JSON.
   * When responseType is 'blob', Angular returns error bodies as Blobs,
   * making err.error?.message undefined. This reads the Blob, parses it
   * as JSON, and re-throws a proper HttpErrorResponse.
   */
  private handleBlobError<T>() {
    return (source: Observable<T>) =>
      source.pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.error instanceof Blob) {
            return from(error.error.text()).pipe(
              switchMap((text) => {
                let parsed: any;
                try {
                  parsed = JSON.parse(text);
                } catch {
                  parsed = { message: text };
                }
                return throwError(() => new HttpErrorResponse({
                  error: parsed,
                  headers: error.headers,
                  status: error.status,
                  statusText: error.statusText,
                  url: error.url ?? undefined,
                }));
              })
            );
          }
          return throwError(() => error);
        })
      );
  }
}
