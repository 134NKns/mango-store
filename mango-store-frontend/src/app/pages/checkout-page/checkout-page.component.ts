import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, OrderDetail } from '../../model/order.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { StepsModule } from 'primeng/steps';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { LoadingService } from '../../services/loading.service';
import { CardModule } from 'primeng/card';
import { PromptpayService } from '../../services/promtpay.service';

interface QrPayment {
  store_name: string;
  phoneNumber: string;
  amount: number;
  userName: string;
  vendor_id: string;
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    QrCodeComponent,
    FileUploadModule,
    StepsModule,
    ConfirmDialogModule,
    CardModule
  ],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class CheckoutPageComponent implements OnInit {
  orders: Order[] = [];
  order: Order = {} as Order;
  statuses: string[] = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
  selectedOrder: Order | null = null;
  displayDialog: boolean = false;
  userRole: string = '';
  activeIndex: number = 0;
  selectedFile: File | null = null;
  slipUploaded: boolean = false;
  totalAmount: number = 0;
  centralPayment: QrPayment = {
    store_name: '',
    phoneNumber: '',
    amount: 0,
    userName: '',
    vendor_id: ''
  }; 
  steps: any[] = [
    { label: 'สรุปรายการ' },
    { label: 'ธุรกรรม' },
    { label: 'เสร็จสิ้นการชำระเงิน' }
  ];

  constructor(
    private messageService: MessageService,
    private loadingService: LoadingService,
    private orderService: OrderService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private promptpayService : PromptpayService,
  ) { }

  ngOnInit(): void {
    this.loadingService.show();
    this.getPromptpayInfo();
    const state = history.state as { orders: Order[] };

    if (state && state.orders && state.orders.length > 0) {
      console.log('Order data provided in state:', state.orders);
      this.orders = state.orders;
      this.order = this.orders[0];
      this.calculateTotalAmount();
      this.centralPayment.amount = this.totalAmount; // Set the amount for QR Payment
      this.loadingService.hide();
    } else {
      this.loadingService.hide();
      console.error('No order data provided in state.');
    }
  }

  getPromptpayInfo(): void {
    this.promptpayService.getPromptpayInfo().subscribe(
      (data) => {
        if (data) {
          this.centralPayment.store_name = data.account_name;
          this.centralPayment.phoneNumber = data.promptpay_number;
        }
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error fetching PromptPay info', life: 5000 });
      }
    );  
  }

  calculateTotalAmount(): void {
    this.totalAmount = this.orders.reduce((sum, order) => {
      return sum + order.order_details.reduce((orderSum, detail) => {
        const basePrice = parseFloat(detail.price.toString()) * detail.quantity;
        const discount = parseFloat(detail.discount.toString());
        const total = basePrice - discount;
        console.log(`Product: ${detail.product.name}, Base Price: ${basePrice}, Discount: ${discount}, Total: ${total}`);
        return orderSum + total;
      }, 0);
    }, 0);

    console.log(`Calculated Total Amount: ${this.totalAmount}`);
    this.centralPayment.amount = this.totalAmount; 
  }

  calculateDiscount(detail: OrderDetail): number {
    const promotion = detail.product.promotion;
    console.log(detail);

    if (!promotion) {
      return 0;
    }

    const discountValue = parseFloat(promotion.discount_value.toString());
    console.log('hee');

    console.log(promotion.promotion_type);
    switch (promotion.promotion_type) {
      case 'ส่วนลดเปอร์เซ็นต์': // For percentage discount
        const percentageDiscount = (parseFloat(detail.price.toString()) * detail.quantity) * (discountValue / 100);
        console.log(`Percentage Discount: ${percentageDiscount}`);
        return percentageDiscount;
      case 'ส่วนลดคงที่': // For fixed discount
        const fixedDiscount = discountValue * detail.quantity;
        console.log(`Fixed Discount: ${fixedDiscount}`);
        return fixedDiscount;
      default:
        return 0;
    }
  }

  formatTotal(detail: OrderDetail): string {
    const total = (parseFloat(detail.price.toString()) * detail.quantity) - detail.discount;
    console.log(`Product: ${detail.product.name}, Price: ${detail.price}, Quantity: ${detail.quantity}, Discount: ${detail.discount}, Total: ${total}`);
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(total);
  }

  formatDiscount(detail: OrderDetail): string {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(detail.discount);
  }

  updateStatus(order: Order): void {
    // function implementation
  }

  viewSlip(order: Order): void {
    // function implementation
  }

  closeDialog(): void {
    // function implementation
  }

  deleteOrder(order: Order): void {
    // function implementation
  }

  onNext() {
    if (this.activeIndex === 1 && this.selectedFile) {
      console.log('Uploading file:', this.selectedFile);
      this.loadingService.show();

      let uploadObservables = this.orders.map(order =>
        this.orderService.uploadPaymentSlip(order.id, this.selectedFile!).toPromise()
      );

      Promise.all(uploadObservables)
        .then(() => {
          this.loadingService.hide();
        })
        .catch(error => {
          console.error('Error uploading payment slips:', error);
          this.loadingService.hide();
        });


      forkJoin(uploadObservables).subscribe({
        next: (orders: Order[]) => {
          console.log('All orders created successfully.');
          this.slipUploaded = true;
          this.goToStep(2);
        },
        error: (error: any) => {
          console.error('Error uploading payment slip', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: 'Failed to upload payment slip. Please try again.',
            life: 5000
          });
        }
      });
    } else {
      this.goToStep(this.activeIndex + 1);
    }
  }

  goToStep(stepIndex: number) {
    this.activeIndex = stepIndex;
    if (stepIndex === 2) {
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000);
    }

  }

  onFileSelect(event: any): void {
    this.selectedFile = event.files[0];
  }

  confirmCancel(): void {
    this.confirmationService.confirm({
      message: 'คุณแน่ใจว่าต้องการยกเลิกการทำรายการนี้หรือไม่?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.cancel(); // เรียกฟังก์ชันยกเลิกเมื่อกดยืนยัน
      },
      reject: () => {
        // ทำสิ่งที่ต้องการเมื่อกดยกเลิก
      }
    });
  }

  cancel(): void {
    // ฟังก์ชันสำหรับยกเลิกการทำรายการ
    this.router.navigate(['/']);
  }

  finish(): void {
    // function implementation
  }
}
