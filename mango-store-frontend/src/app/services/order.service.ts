import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Order } from '../model/order.model';
import { API_URLS } from './api-url';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private http: HttpClient, private messageService: MessageService) {}

  getOrdersByUserId(userId: number): Observable<Order[]> {
    const url = `${API_URLS.get_order_by_user}/${userId}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });    
    return this.http.get<Order[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getAllOrders(): Observable<Order[]> {
    const url = API_URLS.get_all_orders;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Order[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getOrdersForVendor(): Observable<Order[]> {
    const url = API_URLS.get_vendor_orders;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Order[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  cancelOrder(orderId: number): Observable<void> {
    const url = `${API_URLS.cancel_order}/${orderId}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<void>(url, {}, { headers }).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Order Cancelled',
          detail: 'The order has been successfully cancelled.',
          life: 5000
        });
      }),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancellation Failed',
          detail: 'Failed to cancel the order. Please try again.',
          life: 5000
        });
        return throwError(() => new Error('Failed to cancel order'));
      })
    );
  }

  uploadPaymentSlip(orderId: number, file: File): Observable<any> {
    const url = `${API_URLS.upload_slip}/${orderId}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    const formData = new FormData();
    formData.append('payment_slip', file);

    console.log('Uploading to URL:', url);
    console.log('Authorization header:', headers);
    console.log('Form Data:', formData);

    return this.http.post<any>(url, formData, { headers }).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Payment Slip Uploaded',
          detail: 'Your payment slip has been successfully uploaded.',
          life: 5000
        });
      }),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Failed to upload payment slip. Please try again.',
          life: 5000
        });
        return throwError(() => new Error('Failed to upload payment slip'));
      })
    );
  }

  updateOrderStatus(orderId: number, status: string): Observable<void> {
    const url = `${API_URLS.update_order_status}/${orderId}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-HTTP-Method-Override': 'PUT'
    });
    const body = { status }; // Only send status in the request body
    console.log('Updating order status', { orderId, status }); // Log request data
    return this.http.post<void>(url, body, { headers }).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'อัปเดตสถานะคำสั่งซื้อ',
          detail: 'สถานะคำสั่งซื้อถูกอัปเดตเรียบร้อยแล้ว',
          life: 5000
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to update order status', error); // Log error
        this.messageService.add({
          severity: 'error',
          summary: 'การอัปเดตล้มเหลว',
          detail: 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง',
          life: 5000
        });
        return throwError(() => new Error('Failed to update order status'));
      })
    );
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error occurred:', error);
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }
}
