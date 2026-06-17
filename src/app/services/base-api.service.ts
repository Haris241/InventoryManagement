import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, map, Observable, take, tap, throwError } from 'rxjs';
import { LoginResponse } from '../Models/Auth.model';
import { MessageService } from 'primeng/api';
import { DataLayerService } from './data-layer.service';
import { SignalIrService } from './signal-ir.service';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  msg = inject(MessageService);
  dataservice = inject(DataLayerService);

  isLoggedIn = signal<boolean>(this.hasToken());
  private isrefeshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private sinalIr = inject(SignalIrService);
  constructor(private routee: Router) { }

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
      return this.dataservice.createResponse<void, LoginResponse>('Auth/refresh-token').pipe(
        tap(response => {
          this.setToken(response.accessToken);
          this.refreshTokenSubject.next(response.accessToken);
        }), catchError(err => {
          this.refreshTokenSubject.error(err);
          this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
          return throwError(() => err);
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
    this.sinalIr.stopConnection();
    this.isLoggedIn.set(false);
    this.routee.navigate(['/login']);
  }
  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  handleError(error: unknown, fallbackMessage = 'An unexpected error occurred', sticky: boolean = true) {
    const err = error as HttpErrorResponse;
    if ((err as any).handled) return;

    if (err.status !== 0 && err.status < 500) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: fallbackMessage,
        sticky: sticky
      });
    }
  }
  globalMessage(type: 'success' | 'error', message = 'An unexpected error occurred', sticky: boolean = true) {
    this.msg.add({
      severity: type,
      summary: type === 'success' ? 'Success' : 'Error',
      detail: message,
      sticky: sticky
    });
  }


}
