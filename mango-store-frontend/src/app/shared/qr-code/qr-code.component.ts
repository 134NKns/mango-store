import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'; // Import SimpleChanges
import promptpay from 'promptpay-qr';
import * as qrcode from 'qrcode';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SplitterModule } from 'primeng/splitter';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    SplitterModule,
    ImageModule
  ],
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.scss']
})
export class QrCodeComponent implements OnChanges {
  @Input() phoneNumber: string = '';
  @Input() amount: number = 0;
  @Input() userName: string = '';

  qrCodeUrl: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['phoneNumber'] || changes['amount']) {
      this.generateQRCode();
    }
  }

  generateQRCode(): void {
    const amountNumber = this.amount;
    console.log('phone : '+this.phoneNumber);
    console.log('amount : '+amountNumber);
    
    
  
    if (this.phoneNumber && !isNaN(amountNumber) && amountNumber > 0) {
      try {
        const payload = promptpay(this.phoneNumber, { amount: amountNumber });
        qrcode.toDataURL(payload, (err: Error | null | undefined, url: string) => {
          if (!err) {
            this.qrCodeUrl = url;
          } else {
            console.error('Error generating QR Code:', err);
          }
        });
      } catch (error) {
        console.error('Error generating PromptPay payload:', error);
      }
    } else {
      console.error('Phone number or valid amount is missing');
    }
  }
  
}
