import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { CartService } from '../../services/cart.service';
import { Cart, CartItem, Promotion } from '../../model/cart';
import { PrimeNGConfig } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChangeDetectorRef } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { TagModule } from 'primeng/tag';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule, TableModule, FormsModule, ButtonModule, TagModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
  providers: [CartService, MessageService]
})
export class CartPageComponent implements OnInit {
  carts: Cart[] = [];
  role: string = 'customer';

  constructor(
    private cartService: CartService,
    private primengConfig: PrimeNGConfig,
    private cdr: ChangeDetectorRef,
    private loadingService: LoadingService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.loadingService.show();
    if (this.role === 'admin') {
      this.cartService.getAllCartsForAdmin().subscribe({
        next: (carts) => {
          this.carts = carts;
          this.cdr.markForCheck();
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error fetching carts for admin', error);
          this.loadingService.hide();
        }
      });
    } else {
      this.cartService.getCart().subscribe({
        next: (cart) => {
          this.carts = [cart];
          this.cdr.markForCheck();
          this.loadingService.hide();
          console.log(cart);
        },
        error: (error) => {
          console.error('Error fetching cart for user', error);
          this.loadingService.hide();
        }
      });
    }
  }

  removeItem(itemId: number) {
    this.cartService.removeItemFromCart(itemId).subscribe({
      next: () => {
        this.ngOnInit(); // Refresh the cart
      },
      error: (error) => {
        console.error('Error removing item', error);
      }
    });
  }

  updateItemQuantity(item: CartItem) {
    if (item.quantity === 0) {
      this.removeItem(item.id);
    } else {
      this.cartService.updateCartItem(item).subscribe({
        next: () => {
          this.cdr.markForCheck(); // Force change detection
        },
        error: (error) => {
          console.error('Error updating item quantity', error);
        }
      });
    }
  }

  calculateDiscount(item: CartItem): number {
    const basePrice = parseFloat(item.product?.price.toString() ?? '0');
    if (item.promotion) {
      const discountValue = parseFloat(item.promotion.discount_value.toString());
      switch (item.promotion.promotion_type) {
        case 'ส่วนลดเปอร์เซ็นต์':
          return basePrice * item.quantity * (discountValue / 100);
        case 'ส่วนลดคงที่':
          return discountValue * item.quantity;
      }
    }
    return 0;
  }

  calculateDiscountedPrice(item: CartItem): number {
    const basePrice = parseFloat(item.product?.price?.toString() ?? '0');
    const discount = this.calculateDiscount(item);
    return (basePrice * item.quantity) - discount;
  }
  
  getTotalAmount(): number {
    return this.carts.reduce((total, cart) => {
      return total + cart.items.reduce((cartTotal, item) => {
        return cartTotal + this.calculateDiscountedPrice(item);
      }, 0);
    }, 0);
  }

  isCartEmpty(): boolean {
    return this.carts.every(cart => cart.items.length === 0);
  }

  checkout() {
    this.loadingService.show();
    this.cartService.checkoutCart().subscribe({
      next: (response) => {
        console.log('Checkout successful', response);
        this.loadingService.hide();
        this.messageService.add({
          severity: 'success',
          summary: 'Checkout Successful',
          detail: 'Your order has been successfully placed.',
          life: 5000
        });
        if (response.orders && response.orders.length > 0) {
          this.loadingService.hide();
          this.router.navigate(['/checkout'], { state: { orders: response.orders } });
        } else {
          this.loadingService.hide();
          console.error('No orders found in the response');
        }
      },
      error: (error) => {
        console.error('Error during checkout', error);
        this.loadingService.hide();
        this.messageService.add({
          severity: 'error',
          summary: 'Checkout Failed',
          detail: 'There was an error processing your order. Please try again.',
          life: 5000
        });
      }
    });
  }

  getPromotionDescription(promotion: Promotion): string {
    console.log(promotion.promotion_type);
    switch (promotion.promotion_type) {
      case 'ส่วนลดเปอร์เซ็นต์':
        return `ส่วนลด ${promotion.discount_value}%`;
      case 'ส่วนลดคงที่':
        return `ลดราคา ${promotion.discount_value} บาท`;
      default:
        return `โปรโมชั่น`;
    }
  }
}
