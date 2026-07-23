import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../Enviroments/enviroment';
import { ReportResponse } from '../shared/Utility';

@Injectable({
  providedIn: 'root',
})
export class DataLayerService {

  baseurl = environment.apiUrl
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
    return this.http.get(`${this.baseurl}${controller}/${id}`, { responseType: 'blob', withCredentials: true });
  }
  getReportByData(controller: string, object: any): Observable<Blob> {
    return this.http.post(`${this.baseurl}${controller}`, object, { responseType: 'blob', withCredentials: true });
  }
  downloadReport(controller: string): Observable<Blob> {
    return this.http.get(`${this.baseurl}${controller}`, { responseType: 'blob', withCredentials: true });
  }


  getReportOrJob<TRequest, TJob>(controller: string, data: TRequest): Observable<ReportResponse<TJob>> {

    return this.http.post(`${this.baseurl}${controller}`, data, { observe: 'response', responseType: 'blob', withCredentials: true }).pipe(

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
}
