import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, map, Observable, take, tap, throwError } from 'rxjs';
import { LoginResponse, Token } from '../Models/Auth.model';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  msg = inject(MessageService);

  isLoggedIn = signal<boolean>(this.hasToken());
  private isrefeshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private baseurl = "https://localhost:7049/api/"
  constructor(private http: HttpClient, private routee: Router) { }

  getAll<T>(controller: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseurl}${controller}`);
  }
  create<T>(controller: string, object: T): Observable<T> {
    return this.http.post<T>(`${this.baseurl}${controller}`, object,{ withCredentials: true });
  }
createResponse<TInput, TOutput>(controller: string, object?: TInput): Observable<TOutput> {
  return this.http.post<TOutput>(`${this.baseurl}${controller}`,object ?? {},{ withCredentials: true });
}


  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }
  refreshtoken(): Observable<string> {
    if (this.isrefeshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1)
      );
    } else {
      this.isrefeshing = true;
      this.refreshTokenSubject.next(null);
      return this.createResponse<void,LoginResponse>('Auth/refresh-token').pipe(
        tap(response => {
          this.setToken(response.accessToken);
          this.refreshTokenSubject.next(response.accessToken);
        }),catchError(err=>{
          this.refreshTokenSubject.error(err);
          this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
          return throwError(()=>err);
        }),
        finalize(() => {
          this.isrefeshing = false;
        }),
        map(response => response.accessToken)
      );
    }
  }
  setToken(accessToken: string) {
    localStorage.setItem('access_token', accessToken)
    this.isLoggedIn.set(true);
  }
  logout() {
    localStorage.removeItem('access_token');
    this.isLoggedIn.set(false);
    this.routee.navigate(['/login']);
  }
  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  handleError(error: unknown, fallbackMessage = 'An unexpected error occurred') {
    const err = error as HttpErrorResponse;
    if ((err as any).handled) return; 

    if (err.status !== 0 && err.status < 500) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: fallbackMessage,
        sticky: true
      });
    }
  }


}
