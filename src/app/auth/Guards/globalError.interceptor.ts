import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { MessageService } from "primeng/api";
import { catchError, Observable, throwError } from "rxjs";

export function globalError(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const msg = inject(MessageService)
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let summary = '';
            let detail = '';
            if (error.status === 0) {
                summary = 'Network Error';
                detail = 'Unable to connect to the server. Please check your internet or try again later.';
            } else if (error.status === 403) {
                summary = 'Forbidden';
                detail = 'You do not have Permission to perform this action.';
            } else if (error.status >= 500) {
                summary = 'Server Error';
                detail = 'Please try again later.';
            }
            msg.add({
                severity: 'error',
                summary,
                detail
            })
            return throwError(() =>
                error
            );
        })
    );
}