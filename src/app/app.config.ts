import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { refreshtokenInterceptor } from './auth/Guards/refreshtoken.interceptor';
import { globalError } from './auth/Guards/globalError.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        refreshtokenInterceptor,globalError
      ])
    ),MessageService,provideAnimations(),providePrimeNG({
      theme: {
        preset: Aura,
        options: {
            darkModeSelector: true || 'none'
        }
      }
    })
  ]
};
