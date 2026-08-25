import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, Observable, switchMap, throwError } from "rxjs";
import { BaseApiService } from "../../services/base-api.service";
import { MessageService } from "primeng/api";

const EXCLUDED_URLS = ['/login', '/register', '/refresh'];

function isExcludedRoute(url: string): boolean {
    return EXCLUDED_URLS.some(path => url.toLowerCase().includes(path));
}

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
    });
}

function handleRefreshFailure(auth: BaseApiService, msg: MessageService, err: unknown): Observable<never> {
    (err as any).handled = true;
    auth.logout();
    msg.add({
        severity: 'error',
        summary: 'UnAuthorized',
        detail: 'UnAuthorized or Token Expired - Login Again!',
        sticky: true
    });
    return throwError(() => err);
}

export function refreshtokenInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const auth = inject(BaseApiService);
    const msg = inject(MessageService);

    if (isExcludedRoute(req.url)) {
        return next(req);
    }

    const token = auth.getAccessToken();
    const authReq = token ? attachToken(req, token) : req;

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                return auth.refreshtoken().pipe(
                    switchMap(res => {
                        // Extract token string if refreshtoken() returns an object like { accessToken: string }
                        const newTokenString = typeof res === 'string' ? res : (res as any)?.accessToken;
                        return next(attachToken(req, newTokenString));
                    }),
                    catchError(err => handleRefreshFailure(auth, msg, err))
                );
            }
            return throwError(() => error);
        })
    );
}