import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { OrderService } from '../../services/order.service';
import { Order } from '../../model/order.model';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChangeDetectorRef } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PrimeNGConfig, MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-order-customer-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ButtonModule, TagModule, DialogModule, TableModule, ConfirmDialogModule, PaginatorModule],
  templateUrl: './order-customer-page.component.html',
  styleUrls: ['./order-customer-page.component.scss'],
  providers: [OrderService, MessageService, ConfirmationService]
})
export class OrderCustomerPageComponent implements OnInit {
  orders: Order[] = [];
  paginatedOrders: Order[] = [];
  rows: number = 5;
  userId: number | null = null;
  selectedOrder: Order | null = null;
  displayDialog: boolean = false;

  constructor(
    private orderService: OrderService,
    private primengConfig: PrimeNGConfig,
    private cdr: ChangeDetectorRef,
    private loadingService: LoadingService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    const userIdString = localStorage.getItem('user_id');
    this.userId = userIdString ? +userIdString : null;

    if (this.userId) {
      this.primengConfig.ripple = true;
      this.loadingService.show();
      this.orderService.getOrdersByUserId(this.userId).subscribe({
        next: (orders) => {
          this.orders = orders;
          this.paginatedOrders = this.orders.slice(0, this.rows);
          this.cdr.markForCheck();
          this.loadingService.hide();
          console.log(orders);
          
        },
        error: (error) => {
          console.error('Error fetching orders for user', error);
          this.loadingService.hide();
        }
      });
    } else {
      console.error('User ID not found in localStorage');
    }
  }

  paginate(event: any) {
    this.paginatedOrders = this.orders.slice(event.first, event.first + event.rows);
  }

  getSeverity(status: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'pending':
        return 'info';
      case 'paid':
        return 'success';
      case 'shipped':
        return 'warning';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }

  translateOrderStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'รอดำเนินการ';
      case 'paid':
        return 'ชำระเงินแล้ว';
      case 'shipped':
        return 'จัดส่งแล้ว';
      case 'delivered':
        return 'ส่งถึงแล้ว';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      default:
        return 'สถานะไม่ถูกต้อง';
    }
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.displayDialog = true;
  }

  confirmCancelOrder(order: Order): void {
    this.selectedOrder = order;
    this.confirmationService.confirm({
      message: 'คุณแน่ใจว่าต้องการยกเลิกคำสั่งซื้อนี้หรือไม่?',
      accept: () => {
        this.cancelOrder(order);
      }
    });
  }

  cancelOrder(order: Order): void {
    this.loadingService.show();
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'ยกเลิกคำสั่งซื้อสำเร็จ', detail: 'คำสั่งซื้อถูกยกเลิกแล้ว' });
        this.orders = this.orders.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o);
        this.displayDialog = false;
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error cancelling order', error);
        this.messageService.add({ severity: 'error', summary: 'ยกเลิกคำสั่งซื้อไม่สำเร็จ', detail: 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ' });
        this.loadingService.hide();
      }
    });
  }

  payOrder(order: Order): void {
    this.router.navigate(['/checkout'], { state: { orders: [order] } });
  }

  calculateDiscountedTotal(order: Order): number {
    return order.order_details.reduce((total, detail) => {
      const basePrice = parseFloat(detail.price.toString()) * detail.quantity;
      const discount = parseFloat(detail.discount.toString());
      return total + (basePrice - discount);
    }, 0);
  }
}

