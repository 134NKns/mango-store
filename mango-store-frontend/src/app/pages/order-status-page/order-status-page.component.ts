import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Order } from '../../model/order.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';
import { CardModule } from 'primeng/card';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-order-status-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    CardModule,
    ConfirmDialogModule,
    ImageModule,
    OrderDetailsModalComponent
  ],
  templateUrl: './order-status-page.component.html',
  styleUrls: ['./order-status-page.component.scss'],
  providers: [MessageService,ConfirmationService]
})
export class OrderStatusPageComponent implements OnInit {
  orders: Order[] = [];
  statuses: { label: string, value: string, disabled?: boolean }[] = [
    { label: 'รอดำเนินการ', value: 'pending' },
    { label: 'ชำระเงินแล้ว', value: 'paid' },
    { label: 'จัดส่งแล้ว', value: 'shipped' },
    { label: 'จัดส่งสำเร็จ', value: 'delivered' },
    { label: 'ยกเลิกแล้ว', value: 'cancelled', disabled: true }
];

  selectedOrder: Order | null = null;
  displaySlipDialog : boolean = false;
  displayOrderDetailsModal : boolean = false;
  userRole: string = ''; 
  ordersDetail!: Order;
  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private messageService: MessageService,
    private loadingService: LoadingService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getRole() || ''; 
    this.loadOrders();
  }

  loadOrders(): void {
    this.loadingService.show();
    
    const handleError = (error: any) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load orders',
      });
      console.error('Failed to load orders', error);
      this.loadingService.hide();
    };
  
    if (this.userRole === 'admin') {
      this.orderService.getAllOrders().subscribe({
        next: (orders) => {
          this.orders = orders;
          this.loadingService.hide();
          console.log(orders);
          
        },
        error: handleError,
      });
    } else if (this.userRole === 'vendor') {
      this.orderService.getOrdersForVendor().subscribe({
        next: (orders) => {
          console.log(orders);
          this.orders = orders;
          this.loadingService.hide();
        },
        error: handleError,
      });
    } else if (this.userRole === 'customer') {
      const userId = localStorage.getItem('user_id');
      this.orderService.getOrdersByUserId(Number(userId)).subscribe({
        next: (orders) => {
          this.orders = orders;
          console.log(orders);
          
          this.loadingService.hide();
        },
        error: handleError,
      });
    }    
  }
  

  updateStatus(order: Order): void {
    console.log('Updating order status', order); // Log order data
    this.loadingService.show();
    this.orderService.updateOrderStatus(order.id, order.status).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'สำเร็จ',
          detail: 'อัปเดตสถานะคำสั่งซื้อเรียบร้อยแล้ว',
        });
        this.loadingService.hide();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'ข้อผิดพลาด',
          detail: 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้',
        });
        console.error('Failed to update order status', error);
        this
      },
    });
  }

  
  viewSlip(order: Order): void {
    this.selectedOrder = order; // Ensure the selectedOrder is set
    this.displaySlipDialog = true; // Show the dialog
  }

  closeDialog(): void {
    this.displaySlipDialog = false;
    this.selectedOrder = null;
  }

  confirmCancel(order: Order) {
    this.confirmationService.confirm({
      message: 'คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่',
      header: 'ยืนยันการยกเลิกออเดอร์',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteOrder(order)
    });
  }

  deleteOrder(order: Order): void {
    this.orderService.cancelOrder(order.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'ยกเลิกออเดอร์สมบูรณ์',
        });
        this.loadOrders(); 
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'ไม่สามารถยกเลิกออเดอร์นี้ได้',
        });
        console.error('Failed to cancel order', error);
      }
    });
  }

  viewOrderDetails(order : Order){
    console.log(order);
    this.displayOrderDetailsModal = true;
    this.ordersDetail = order;
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
  
}
