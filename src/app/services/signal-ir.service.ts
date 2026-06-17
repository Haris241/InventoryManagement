import { DestroyRef, inject, Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { NotificationService } from './notification.service';
import { NotificationEnvelope } from '../Models/Notification.model';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class SignalIrService {
  private connection?: signalR.HubConnection;
  private readonly auth = inject(BaseApiService);
  private readonly notifState = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // 2. Register your manual teardown callback 
    this.destroyRef.onDestroy(() => {
      this.stopConnection();
    });
  }

  startConnection(): void {
    if (this.connection) return; // already connected

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/notifications', {
        accessTokenFactory: () => this.auth.getAccessToken() ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000]) // retry delays in ms
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Single event listener — all notifications come through here
    this.connection.on('Notification', (envelope: NotificationEnvelope) => {
      this.notifState.handleIncoming(envelope);
    });

    this.connection.onreconnecting(() => console.warn('SignalR reconnecting...'));
    this.connection.onreconnected(() => console.log('SignalR reconnected'));

    this.connection.start().catch(err => {
      console.error('SignalR connection failed:', err);
      this.connection = undefined;
    });
  }

  stopConnection(): void {
    this.connection?.stop();
    this.connection = undefined;
  }


}
