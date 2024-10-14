import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, OnChanges } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Order } from '../../../model/order.model';
import { ImageModule } from 'primeng/image';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [
    TableModule,
    CommonModule,
    ImageModule,
    DividerModule,
    PanelModule
  ],
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss']
})
export class OrderDetailsModalComponent implements OnChanges {
  @Input() orders!: Order;

  firstname !: string;
  lastname !: string;
  phone !: string;
  shippingAddress !: string;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orders']) {
      let order = changes['orders'].currentValue;
      if (order) {
        //User Profile
        let userProfile = order.user.user_profile;
        this.firstname = userProfile.firstname;
        this.lastname = userProfile.lastname;
        this.phone = userProfile.phone;
        //Order Details
        let orderDetails = order.order_details[0];
        this.shippingAddress = orderDetails.shipping_address;
      }
    }
  }
}
