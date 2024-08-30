import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { API_URLS } from './api-url'; 
import { UserRegister, UserProfile, VendorDetail } from '../model/user.model';
import { MessageService } from 'primeng/api';
import * as CryptoJS from 'crypto-js';

export interface UserLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    role: string;
    email?: string;
    created_at: string;
    update_at: string;
  };
  user_profile: UserProfile;
}

export interface UserInfoResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    username: string;
    role: string;
    email?: string;
    created_at: string;
    update_at: string;
  };
  profile: UserProfile;
  vendorDetail?: VendorDetail;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token: string | null = null;
  private roleSubject = new BehaviorSubject<string | null>(null);
  role$ = this.roleSubject.asObservable();
  private secretKey: string = 'your-very-secure-secret-key';
  private tokenExpirationTimeout: any;

  constructor(private http: HttpClient, private router: Router, private messageService: MessageService) { 
    this.attemptAutoLogin();  // Attempt auto-login on service initialization
  }

  login(username: string | null, password: string | null): Observable<UserLoginResponse> {
    if (!username) {
      this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'กรุณากรอกชื่อผู้ใช้', life: 5000 });
      return throwError(() => new Error('กรุณากรอกชื่อผู้ใช้'));
    }
    
    if (!password) {
      this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'กรุณากรอกรหัสผ่าน', life: 5000 });
      return throwError(() => new Error('กรุณากรอกรหัสผ่าน'));
    }
  
    return this.http.post<UserLoginResponse>(API_URLS.login, { username, password })
      .pipe(
        map(response => {          
          this.handleAuthentication(response);
          return response;
        }),
        catchError(error => this.handleError(error, 'Login'))
      );
  }  

  register(userDetails: UserRegister): Observable<any> {
    return this.http.post<any>(API_URLS.register, userDetails)
      .pipe(
        map(response => {
          this.handleAuthentication(response);
          return response;
        }),
        catchError(error => this.handleError(error, 'Registration'))
      );
  }

  me(): Observable<UserInfoResponse | undefined> {
    const token = localStorage.getItem('token');
    if (!token) {
      return of(undefined);
    }   
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<UserInfoResponse>(API_URLS.me, {}, { headers });
  }

  private handleAuthentication(response: UserLoginResponse): void {
    this.storeCredentialsInLocalStorage('token', response.access_token);
    this.storeCredentialsInLocalStorage('user_id', response.user.id.toString());
    this.storeCredentialsInLocalStorage('first_name', response.user_profile.firstname);
    this.storeCredentialsInLocalStorage('last_name', response.user_profile.lastname);
    this.storeCredentialsInLocalStorage('address', response.user_profile.address);
    const encryptedRole = this.encrypt(response.user.role.toLowerCase());
    this.storeCredentialsInLocalStorage('role', encryptedRole);

    const expiryTimestamp = Math.floor(Date.now() / 1000) + response.expires_in;
    this.storeCredentialsInLocalStorage('expires_in', expiryTimestamp.toString());

    this.token = response.access_token;
    this.roleSubject.next(response.user.role.toLowerCase());
    this.setTokenExpiration(response.expires_in);
  }

  private storeCredentialsInLocalStorage(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  private setTokenExpiration(secondsUntilExpiry: number): void {
    if (this.tokenExpirationTimeout) {
      clearTimeout(this.tokenExpirationTimeout);
    }
    this.tokenExpirationTimeout = setTimeout(() => {
      this.logout();
      this.messageService.add({ severity: 'error', summary: 'Session Expired', detail: 'Your session has expired. Please log in again.', life: 5000 });
    }, secondsUntilExpiry * 1000);
  }

  private attemptAutoLogin(): void {
    const token = this.getFromLocalStorage('token');
    const expiryTimestamp = parseInt(this.getFromLocalStorage('expires_in') || '0', 10);
    const currentTime = Math.floor(Date.now() / 1000);

    if (token && expiryTimestamp > currentTime) {
      this.token = token;
      const decryptedRole = this.decrypt(this.getFromLocalStorage('role') || '');
      this.roleSubject.next(decryptedRole);
      this.setTokenExpiration(expiryTimestamp - currentTime);
    } else {
      this.logout();  // Automatically logout if token is invalid or expired
    }
  }

  private getFromLocalStorage(key: string): string | null {
    return localStorage.getItem(key);
  }

  logout(): void {
    localStorage.clear();  // Clears all data from local storage
    this.token = null;
    this.roleSubject.next(null);
    if (this.tokenExpirationTimeout) {
      clearTimeout(this.tokenExpirationTimeout);
    }
    this.router.navigate(['/']);
  }

  private handleError(error: HttpErrorResponse, context: string): Observable<never> {
    let message = `${context} เกิดความผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์`;
    if (error.status === 401) {
      message = 'ชื่อผู้ใช้หรือรหัสผ่านผิด';
    } else if (!navigator.onLine) {
      message = 'ไม่สามารถเชื่อมต่อได้';
    }
    this.messageService.add({ severity: 'error', summary: `${context} Error`, detail: message, life: 5000 });
    return throwError(() => new Error(message));
  }

  getRole(): string | null {
    return this.roleSubject.getValue();
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  updateProfile(userProfile: UserProfile, userId: number): Observable<UserProfile> {
    const token = this.getFromLocalStorage('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-HTTP-Method-Override': 'PUT'
    });
  
    const body = {
      firstname: userProfile.firstname,
      lastname: userProfile.lastname,
      email: userProfile.email,
      phone: userProfile.phone,
      address: userProfile.address
    };
  
    const url = `${API_URLS.update_user_profile}/${userId}`;
  
    return this.http.post<UserProfile>(url, body, { headers })
      .pipe(
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Profile Updated',
            detail: 'The profile has been successfully updated.',
            life: 5000
          });
        }),
        catchError(error => this.handleError(error, 'Update Profile'))
      );
  }

  updateVendorDetail(vendorDetail: VendorDetail, userId: number): Observable<VendorDetail> {
    const token = this.getFromLocalStorage('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-HTTP-Method-Override': 'PUT'
    });
  
    const body = {
      store_name: vendorDetail.store_name,
      bank_name: vendorDetail.bank_name,
      promptpay_number: vendorDetail.promptpay_number,
      additional_qr_info: vendorDetail.additional_qr_info
    };
  
    const url = `${API_URLS.update_vendor_detail}/${userId}`;
  
    return this.http.post<VendorDetail>(url, body, { headers })
      .pipe(
        catchError(error => this.handleError(error, 'Update Vendor Detail'))
      );
  }

  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  private decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
