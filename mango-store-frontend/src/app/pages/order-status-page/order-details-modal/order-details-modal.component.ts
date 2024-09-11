import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Order } from '../../../model/order.model';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [
    TableModule,
    CommonModule,
    ImageModule
  ],
  templateUrl: './order-details-modal.component.html',
  styleUrl: './order-details-modal.component.scss'
})
export class OrderDetailsModalComponent {
  @Input() orders! : Order;
}
