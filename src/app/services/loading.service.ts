import { Injectable, signal } from '@angular/core';
import { ThemeProvider } from 'primeng/config';
import { BehaviorSubject } from 'rxjs';
import  Aura  from '@primeuix/themes/aura'; 


@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  isDark = signal<boolean>(this.loadFromStorage());
  constructor(private themeProvider: ThemeProvider) {
    this.applyTheme(this.isDark());
   }


  private request: number = 0;
  private loadingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();
  show(){
    this.request++;
    
    if(this.request===1){
      this.loadingSubject.next(true);
    }  
  }
  hide(){
    if(this.request>0){
      this.request--;
    }
    if(this.request===0){
      this.loadingSubject.next(false);
    }
  }


  // For Changing Theme
  toggleTheme(){
    const newValue = !this.isDark();
    this.isDark.set(newValue);
    localStorage.setItem('isDark', JSON.stringify(newValue));
    this.applyTheme(newValue);
  }
  private loadFromStorage(): boolean{
    const value = localStorage.getItem('isDark');
    return value === 'true';
  }
  private applyTheme(isDark: boolean): void{
    this.themeProvider.setThemeConfig({
      theme:{
          preset: Aura,
          options:{
            darkModeSelector: isDark
          }
        }
    });

    if(!isDark){
      document.documentElement.style.setProperty('--divBackgound','#F8FAFC');
      document.documentElement.style.setProperty('--DivColour','#ffffffff');
      document.documentElement.style.setProperty('--MainColour','#4b49ac');
      document.documentElement.style.setProperty('--White','#000000ff');
      document.documentElement.style.setProperty('--Outline','#1a191962');
    }else{
      document.documentElement.style.setProperty('--divBackgound','#09090b');
      document.documentElement.style.setProperty('--DivColour','#17171a');
      document.documentElement.style.setProperty('--MainColour','#007bff');
      document.documentElement.style.setProperty('--White','#ffffffff');
      document.documentElement.style.setProperty('--Outline','#FFFFFF29');
    }
  }
}