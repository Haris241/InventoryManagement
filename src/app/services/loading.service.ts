import { Injectable, signal } from '@angular/core';
import { ThemeProvider } from 'primeng/config';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import Aura from '@primeuix/themes/aura';


@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isDark = signal<boolean>(this.loadFromStorage());
  constructor() {
    this.applyTheme(this.isDark());
  }


  private request: number = 0;
  private loadingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable().pipe(distinctUntilChanged());
  show() {
    this.request++;

    if (this.request === 1) {
      this.loadingSubject.next(true);
    }
  }
  hide() {
    if (this.request > 0) {
      this.request--;
    }
    if (this.request === 0) {
      this.loadingSubject.next(false);
    }
  }


  // For Changing Theme
  toggleTheme() {
    const newValue = !this.isDark();
    this.isDark.set(newValue);
    localStorage.setItem('isDark', JSON.stringify(newValue));
    this.applyTheme(newValue);
  }
  private loadFromStorage(): boolean {
    const value = localStorage.getItem('isDark');

    // Default theme for new users
    if (value === null) {
      return true;
    }

    // Respect the user's previously selected theme
    return value === 'true';
  }
  private applyTheme(isDark: boolean): void {
    const element = document.documentElement;

    if (isDark) {
      element.classList.add('my-app-dark');
    } else {
      element.classList.remove('my-app-dark');
    }
    if (!isDark) {
      document.documentElement.style.setProperty('--divBackgound', '#F2F4F7');
      document.documentElement.style.setProperty('--DivColour', '#FFFFFF');
      document.documentElement.style.setProperty('--MainColour', '#47c4cf');
      document.documentElement.style.setProperty('--White', '#000000ff');
      document.documentElement.style.setProperty('--Outline', '#1a191962');
      document.documentElement.style.setProperty('--InputBackground', '#FFFFFF');
    } else {
      document.documentElement.style.setProperty('--divBackgound', '#09090b');
      document.documentElement.style.setProperty('--DivColour', '#17171a');
      document.documentElement.style.setProperty('--MainColour', '#007bff');
      document.documentElement.style.setProperty('--White', '#ffffffff');
      document.documentElement.style.setProperty('--Outline', '#FFFFFF29');
      document.documentElement.style.setProperty('--InputBackground', '#09090b');
    }
  }
}