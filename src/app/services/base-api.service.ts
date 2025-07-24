import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {

  private baseurl = "https://localhost:7049/api/"
  constructor(private http: HttpClient) { }

  getAll<T>(controller: string): Observable<T[]>{
    return this.http.get<T[]>(`${this.baseurl}${controller}`);
  }
}
