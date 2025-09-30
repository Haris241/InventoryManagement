import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize, Observable } from "rxjs";
import { LoadingService } from "../../services/loading.service";

export function loadingInterceptor(req:HttpRequest<unknown>, next : HttpHandlerFn):Observable<HttpEvent<unknown>>{
    const loader = inject(LoadingService);
    loader.show();
    return next(req).pipe(
        finalize(()=>
        loader.hide()
        )
    );

}