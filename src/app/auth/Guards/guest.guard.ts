import { CanActivateChildFn, Router } from '@angular/router';
import { BaseApiService } from '../../services/base-api.service';
import { inject } from '@angular/core';

export const guestGuard: CanActivateChildFn = (childRoute, state) => {
  const auth = inject(BaseApiService);
  const router = inject(Router)
  if(!auth.isLoggedIn()){
    return true;
  }else{
    return router.createUrlTree(['/Inventory/dashboard']);
  }
};
