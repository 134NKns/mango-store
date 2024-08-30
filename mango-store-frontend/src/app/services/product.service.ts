import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { catchError, map, tap } from 'rxjs/operators';
import { Product } from '../model/product.model';
import { API_URLS } from './api-url';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient, private messageService: MessageService) {}

  addProduct(productData: FormData): Observable<Product> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<Product>(API_URLS.add_product, productData, { headers })
      .pipe(
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product Added',
            detail: 'The product has been successfully added.',
            life: 5000
          });
        }),
        catchError(error => {
          this.handleError('Failed to add product', 'Product addition error', error);
          return throwError(() => new Error('Failed to add product'));
        })
      );
  }

  deleteProduct(productId: number): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const url = `${API_URLS.delete_product}/${productId}`;
    
    return this.http.delete<void>(url, { headers })
      .pipe(
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product Deleted',
            detail: 'The product has been successfully deleted.',
            life: 5000
          });
        }),
        catchError((error) => {
          this.handleError('Failed to delete product', 'Deletion error', error);
          return throwError(() => new Error('Failed to delete the product'));
        })
      );
  }

  editProduct(productId: number, productData: FormData): Observable<Product> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    const url = `${API_URLS.update_product}/${productId}`;
    // Add the _method parameter to spoof PUT request
    productData.append('_method', 'PUT');    
    return this.http.post<Product>(url, productData, { headers })
      .pipe(
        tap(() => {
          console.log('success update product');
          this.messageService.add({
            severity: 'success',
            summary: 'Product Updated',
            detail: 'The product has been successfully updated.',
            life: 5000
          });
        }),
        catchError(error => {
          this.handleError('Failed to update product', 'Update error', error);
          return throwError(() => new Error('Failed to update product'));
        })
      );
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(API_URLS.get_all_products)
      .pipe(
        tap(() => {
          console.log('success get all products');
        }),
        catchError(error => {
          this.handleError('Failed to retrieve products', 'Fetch error', error);
          return throwError(() => new Error('Failed to retrieve products'));
        })
      );
  }

  searchProducts(searchParams: { product_id?: string; vendor_id?: string; name?: string } = {}): Observable<Product[]> {
    let params = new HttpParams();
    if (searchParams.product_id) params = params.append('product_id', searchParams.product_id);
    if (searchParams.vendor_id) params = params.append('vendor_id', searchParams.vendor_id);
    if (searchParams.name) params = params.append('name', `%${searchParams.name}%`);

    return this.http.get<{ message: string, data: Product[] }>(API_URLS.search_products, { params })
      .pipe(
        map(response => response.data),
        tap(() => {
          console.log('found product');
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.messageService.add({
              severity: 'warn', // Use warning severity for not found
              summary: 'No Products Found',
              detail: 'No products match the search criteria.',
              life: 5000
            });
          } else {
            this.handleError('ไม่สามารถค้นหาสินค้าได้', 'เกิดข้อผิดพลาดใ', error);
          }
          return throwError(() => new Error('Failed to search products'));
        })
      );
  }
  
  private handleError(detail: string, summary: string, error: HttpErrorResponse): void {
    console.error('Error:', error); // Logging the error to the console for debugging
    this.messageService.add({
      severity: 'error',
      summary: summary,
      detail: detail,
      life: 5000
    });
  }
}
