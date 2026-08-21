import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { refreshtokenInterceptor } from './auth/Guards/refreshtoken.interceptor';
import { globalError } from './auth/Guards/globalError.interceptor';
import { loadingInterceptor } from './auth/Guards/loading.Interceptor';
import MyPreset from './shared/Utility';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }), ConfirmationService, provideRouter(routes),
  provideHttpClient(
    withInterceptors([
      loadingInterceptor, refreshtokenInterceptor, globalError
    ])
  ), MessageService, providePrimeNG({
    ripple: false,
    theme: {
      preset: MyPreset,
      options: {

        darkModeSelector: '.my-app-dark'
      }
    }
  })
  ]
};
