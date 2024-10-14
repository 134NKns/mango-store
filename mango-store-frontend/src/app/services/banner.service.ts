import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_URLS } from './api-url';
import { Banner } from '../model/banner';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class BannerService {

  private bannersSubject = new BehaviorSubject<Banner[]>([]);
  public banners$ = this.bannersSubject.asObservable();

  constructor(private http: HttpClient, private messageService: MessageService) { }

  // ดึงแบนเนอร์ทั้งหมดและอัปเดต BehaviorSubject
  getAllBanners(): Observable<Banner[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Banner[]>(API_URLS.get_all_banners, { headers })
      .pipe(
        tap((banners: Banner[]) => {
          this.bannersSubject.next(banners); // อัปเดต BehaviorSubject
          // this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Fetched banners successfully' });
        }),
        catchError(error => this.handleError(error, 'Fetch Banners'))
      );
  }

  // เพิ่มแบนเนอร์ใหม่
  addBanner(banner: Banner | FormData): Observable<Banner> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Banner>(API_URLS.add_banner, banner, { headers })
      .pipe(
        tap((newBanner: Banner) => {
          this.getAllBanners().subscribe(); // รีเฟรชรายการแบนเนอร์หลังเพิ่มสำเร็จ
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Banner added successfully' });
        }),
        catchError(error => this.handleError(error, 'Add Banner'))
      );
  }

  // อัปเดตแบนเนอร์
  updateBanner(id: number, banner: Banner | FormData): Observable<Banner> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-HTTP-Method-Override': 'PUT'
    });

    return this.http.post<Banner>(`${API_URLS.update_banner}/${id}`, banner, { headers })
      .pipe(
        tap((updatedBanner: Banner) => {
          this.getAllBanners().subscribe(); // รีเฟรชรายการแบนเนอร์หลังอัปเดตสำเร็จ
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Banner updated successfully' });
        }),
        catchError(error => this.handleError(error, 'Update Banner'))
      );
  }

  // ลบแบนเนอร์
  deleteBanner(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${API_URLS.delete_banner}/${id}`, { headers })
      .pipe(
        tap(() => {
          this.getAllBanners().subscribe(); // รีเฟรชรายการแบนเนอร์หลังจากลบสำเร็จ
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Banner deleted successfully' });
        }),
        catchError(error => this.handleError(error, 'Delete Banner'))
      );
  }

  // จัดการข้อผิดพลาด
  private handleError(error: any, operation: string): Observable<never> {
    this.messageService.add({ severity: 'error', summary: `${operation} Error`, detail: `Failed to ${operation.toLowerCase()}. Please try again.` });
    throw error;
  }
}
