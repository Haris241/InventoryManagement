import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, finalize, map, Observable, take, tap } from 'rxjs';
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
    return this.http.post<T>(`${this.baseurl}${controller}`, object);
  }
  createResponse<TInput, TOutput>(controller: string, object: TInput): Observable<TOutput> {
    return this.http.post<TOutput>(`${this.baseurl}${controller}`, object);
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
      const payload: Token = { token: this.getRereshToken() ?? '' };
      return this.createResponse<Token, LoginResponse>('Auth/refresh-token', payload).pipe(
        tap(response => {
          this.setToken(response.accessToken, response.refreshToken);
          this.refreshTokenSubject.next(response.accessToken);
        }),
        finalize(() => {
          this.isrefeshing = false;
        }),
        map(response => response.accessToken)
      );
    }
  }
  setToken(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    this.isLoggedIn.set(true);
  }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.isLoggedIn.set(false);
    this.routee.navigate(['/login']);
  }
  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }
  getRereshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  handleError(error: unknown, fallbackMessage = 'An unexpected error occurred') {
    const err = error as HttpErrorResponse;

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
