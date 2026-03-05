import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, Observable, switchMap, throwError } from "rxjs";
import { BaseApiService } from "../../services/base-api.service";
import { MessageService } from "primeng/api";
export function refreshtokenInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const auth = inject(BaseApiService);
    const msg = inject(MessageService);
    const token = auth.getAccessToken();
    console.log("token, ",token);
    let authreq = req;
    if (token) {
        authreq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    return next(authreq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                return auth.refreshtoken().pipe(
                    switchMap(newtoken => {
                        const retryReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newtoken}`
                            }
                        });
                        return next(retryReq);
                    }),
                    catchError(err => {
                        (err as any).handled = true; 
                        auth.logout();
                        msg.add({
                            severity: 'error',
                            summary: 'UnAuthorized',
                            detail: 'UnAuthorized or Token Expired - Login Again!',
                            sticky: true
                        });
                        return throwError(() => err);
                    })
                );
            }
            return throwError(() => error);
        })
    );
}