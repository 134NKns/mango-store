import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_URLS } from './api-url';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';

export interface PromptpayInfo {
  id?: number;
  account_name: string;
  bank_name: string;
  promptpay_number: string;
  additional_qr_info?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromptpayService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  getPromptpayInfo(): Observable<PromptpayInfo | undefined> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<PromptpayInfo>(`${API_URLS.promptpay_info}/show`, { headers })
      .pipe(
        map((data) => data || undefined),
        catchError((error) => {
          if (error.status === 404) {
            return of(undefined);
          }
          return this.handleError(error);
        })
      );
  }

  createPromptpayInfo(promptpayInfo: PromptpayInfo): Observable<PromptpayInfo> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<PromptpayInfo>(API_URLS.promptpay_info, promptpayInfo, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  updatePromptpayInfo(promptpayInfo: PromptpayInfo): Observable<PromptpayInfo> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-HTTP-Method-Override': 'PUT'
    });

    return this.http.post<PromptpayInfo>(API_URLS.promptpay_info, promptpayInfo, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  deletePromptpayInfo(): Observable<void> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<void>(API_URLS.promptpay_info, { headers })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An error occurred';
    if (error.status === 400) {
      message = 'Bad Request';
    } else if (error.status === 401) {
      message = 'Unauthorized';
    } else if (error.status === 404) {
      message = 'Not Found';
    } else if (error.status === 500) {
      message = 'Internal Server Error';
    } else if (!navigator.onLine) {
      message = 'No internet connection';
    }

    this.messageService.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 });
    return throwError(() => new Error(message));
  }
}
