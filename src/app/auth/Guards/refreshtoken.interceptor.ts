import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from "rxjs";
import { BaseApiService } from "../../services/base-api.service";
import { MessageService } from "primeng/api";

const EXCLUDED_URLS = ['/login', '/register', '/refresh'];

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function isExcludedRoute(url: string): boolean {
    return EXCLUDED_URLS.some(path => url.toLowerCase().includes(path));
}

function attachToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handleRefreshFailure(auth: BaseApiService, msg: MessageService, err: unknown): Observable<never> {
    isRefreshing = false;
    refreshTokenSubject.next(null);
    (err as any).handled = true;
    auth.logout();
    msg.add({
        severity: 'error',
        summary: 'UnAuthorized',
        detail: 'UnAuthorized or Token Expired - Login Again!',
        sticky: false
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
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return auth.refreshtoken().pipe(
                        switchMap(res => {
                            const newTokenString = typeof res === 'string' ? res : (res as any)?.accessToken;
                            isRefreshing = false;
                            refreshTokenSubject.next(newTokenString);
                            return next(attachToken(req, newTokenString));
                        }),
                        catchError(err => handleRefreshFailure(auth, msg, err))
                    );
                } else {
                    // A refresh is already in flight — wait for it instead of firing another one
                    return refreshTokenSubject.pipe(
                        filter(t => t !== null),
                        take(1),
                        switchMap(newToken => next(attachToken(req, newToken as string)))
                    );
                }
            }
            return throwError(() => error);
        })
    );
}