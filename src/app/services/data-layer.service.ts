import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../Enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class DataLayerService {

  private baseurl = environment.apiUrl
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
}
