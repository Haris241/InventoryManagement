import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { MessageService } from "primeng/api";
import { catchError, Observable, throwError } from "rxjs";

const TOAST_SUPPRESS_WINDOW_MS = 3000;
let lastToastKey = '';
let lastToastTime = 0;

function showOnce(msg: MessageService, key: string, toast: Parameters<MessageService['add']>[0]) {
    const now = Date.now();
    if (key === lastToastKey && now - lastToastTime < TOAST_SUPPRESS_WINDOW_MS) {
        return; // same error type fired again within the window — skip it
    }
    lastToastKey = key;
    lastToastTime = now;
    msg.add(toast);
}

export function globalError(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const msg = inject(MessageService);
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if ((error as any).handled) {
                // already shown a toast for this in another interceptor (e.g. refresh failure)
                return throwError(() => error);
            }

            if (error.status === 0) {
                showOnce(msg, 'network', {
                    severity: 'error',
                    summary: 'Network Error',
                    detail: 'Unable to connect to the server. Please check your internet or try again later.',
                    sticky: false
                });
            } else if (error.status === 403) {
                showOnce(msg, 'forbidden', {
                    severity: 'error',
                    summary: 'Forbidden',
                    detail: 'You do not have Permission to perform this action.',
                    sticky: false
                });
            } else if (error.status >= 500) {
                showOnce(msg, 'server', {
                    severity: 'error',
                    summary: 'Server Error',
                    detail: 'Please try again later.',
                    sticky: false
                });
            }
            return throwError(() => error);
        })
    );
}