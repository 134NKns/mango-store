import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { LoginPageComponent } from '../../pages/auth-ui/login-page/login-page.component';
import { RegisterPageComponent } from '../../pages/auth-ui/register-page/register-page.component';
import { EditPageComponent } from '../../pages/auth-ui/edit-page/edit-page.component';
import { PromptPayPageComponent } from '../../pages/prompt-pay-page/prompt-pay-page.component';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TabMenuModule } from 'primeng/tabmenu';

@Component({
  selector: 'app-main-navbar',
  standalone: true,
  imports: [
    MenubarModule,
    DialogModule,
    LoginPageComponent,
    RegisterPageComponent,
    PromptPayPageComponent,
    EditPageComponent,
    ButtonModule,
    CommonModule,
    TabMenuModule
  ],
  templateUrl: './main-navbar.component.html',
  styleUrls: ['./main-navbar.component.scss'],
})
export class MainNavbarComponent implements OnInit, OnDestroy,AfterViewInit {
  currentRole: string | null = null;
  loginHeader: string = 'เข้าสู่ระบบ';
  editHeader: string = 'แก้ไขข้อมูลส่วนตัว';
  promtPaySettingHeader: string = 'จัดการ PromptPay';
  registerRole: 'customer' | 'vendor' | null = null;
  registerHeader!: string;
  registerHeaderForCustomer: string = 'สมัครสมาชิกลูกค้า';
  registerHeaderForVendor: string = 'สมัครสมาชิกร้านค้า';
  isVisibleLoginModal: boolean = false;
  isVisibleRegisterModal: boolean = false;
  isVisiblePromptPaySettingModal: boolean = false;
  isVisibleEditModal: boolean = false;
  items!: MenuItem[];
  private roleSubscription: Subscription;

  @ViewChild(EditPageComponent) editPageComponent!: EditPageComponent;

  constructor(private authService: AuthService) {
    this.roleSubscription = this.authService.role$.subscribe(role => {
      console.log('role subscription : ' + role);
      this.currentRole = role;
      this.updateMenuItems();
    });
  }

  ngOnInit(): void {
    this.updateMenuItems();
  }

  ngAfterViewInit() {
    this.setActiveMenuItemFromStorage();
  }

  ngOnDestroy(): void {
    this.roleSubscription.unsubscribe();
  }

  updateMenuItems(): void {
    this.removeActiveMenuitem();
    if (this.currentRole === 'admin') {
      this.menuItemsSettings(this.adminItems());
    } else if (this.currentRole === 'customer') {
      this.menuItemsSettings(this.customerItems());
    } else if (this.currentRole === 'vendor') {
      this.menuItemsSettings(this.vendorItems());
    } else {
      this.menuItemsSettings(this.defaultItems());
    }
    
    this.isVisibleLoginModal = false;
    this.isVisibleRegisterModal = false;
  }

  menuItemsSettings(items: MenuItem[]) {
    this.items = items;
  }

  openLoginModal() {
    this.isVisibleLoginModal = true;
  }

  openRegisterModal(type: 'customer' | 'vendor') {
    try {
      this.registerRole = type;
      this.registerHeader =
        type === 'customer'
          ? this.registerHeaderForCustomer
          : this.registerHeaderForVendor;
      this.isVisibleRegisterModal = true;
    } catch (error) {
      console.log(error);
    }
  }

  openEditModal() {
    this.isVisibleEditModal = true;
    if (this.editPageComponent) {
      this.editPageComponent.me();
    }
  }

  openPromptPaySettingModal() {
    this.isVisiblePromptPaySettingModal = true;
  }

  handleUpdateComplete(success: boolean) {
    if (success) {
      console.log('Update succeeded');
    } else {
      console.log('Update failed');
    }
    this.isVisibleEditModal = false;
  }

  logout() {
    this.authService.logout();
  }

  defaultItems() {
    return [
      {
        label: 'สมัครสมาชิก',
        icon: 'pi pi-fw pi-user-plus',
        items: [
          {
            label: 'สมัครสมาชิกลูกค้า',
            icon: 'pi pi-fw pi-user-edit',
            command: () => this.openRegisterModal('customer'),
            isRouterLink : false,
          },
          {
            separator: true,
          },
          {
            label: 'สมัครสมาชิกร้านค้า',
            icon: 'pi pi-fw pi-user-plus',
            command: () => this.openRegisterModal('vendor'),
            isRouterLink : false,
          },
        ],
        isRouterLink : false
      },
      {
        label: 'เข้าสู่ระบบ',
        icon: 'pi pi-fw pi-sign-in',
        isRouterLink : false,
        command: () => this.openLoginModal(),
      },
    ];
  }
  
  customerItems() {
    return [
      {
        label: 'หน้าแรก',
        icon: 'pi pi-fw pi-home',
        routerLink : '/',
      },
      {
        label: 'ตะกร้าสินค้า',
        icon: 'pi pi-fw pi-shopping-cart',
        routerLink : 'cart',
        isRouterLink : true,
      },
      {
        label: 'คำสั่งซื้อของฉัน',
        icon: 'pi pi-fw pi-list',
        routerLink : '/order-customer',
        isRouterLink : true,
      },
      {
        label: 'แก้ไขข้อมูลส่วนตัว',
        icon: 'pi pi-fw pi-user-edit',
        command: () => this.openEditModal(),
        isRouterLink : false,
      }
    ];
  }
  
  vendorItems() {
    return [
      {
        label: 'หน้าแรก',
        icon: 'pi pi-fw pi-home',
        routerLink : '/',
        isRouterLink : true,
      }, 
      {
        label: 'รายการขาย',
        icon: 'pi pi-fw pi-dollar',
        routerLink : '/order-status',
        isRouterLink : true,
      },
      {
        label: 'จัดการสินค้า',
        icon: 'pi pi-fw pi-cog',
        routerLink : 'vendor-dashboard',
        isRouterLink : true,
      },
      {
        label: 'แก้ไขข้อมูลส่วนตัว',
        icon: 'pi pi-fw pi-user-edit',
        command: () => this.openEditModal(),
        isRouterLink : false,
      },
    ];
  }
  
  adminItems() {
    return [
      {
        label: 'หน้าแรก',
        icon: 'pi pi-fw pi-home',
        routerLink : '/',
        isRouterLink : true,
      },
      {
        label: 'คำสั่งซื้อและขายสินค้าในระบบ',
        icon: 'pi pi-fw pi-list',
        routerLink : '/order-status',
        isRouterLink : true,
      },
      {
        label: 'จัดการสินค้าในระบบ',
        icon: 'pi pi-fw pi-cog',
        routerLink : 'vendor-dashboard',
        isRouterLink : true,
      },
      {
        label: 'แก้ไขข้อมูลส่วนตัว',
        icon: 'pi pi-fw pi-user-edit',
        command: () => this.openEditModal(),
        isRouterLink : false
      },
      {
        label: 'จัดการ PromptPay ระบบ',
        icon: 'pi pi-fw pi-qrcode',
        command: () => this.openPromptPaySettingModal(), 
        isRouterLink : false
      }
    ];
  } 
  
  activeMenu(event: any) {
    const label = event?.target?.innerText?.trim(); 
    
    if (!label) {
      return; // ถ้า label เป็น undefined หรือ null ให้หยุดการทำงาน
    }
  
    const findItem = (items: any[], label: string): any => {
      for (let item of items) {
        if (item.label === label) {
          return item;
        }
        if (item.items) {
          const found = findItem(item.items, label);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };
    
    const item = findItem(this.items, label);
  
    if (!item || item.isRouterLink === false) {
      return;
    }
  
    let node;
    if (event.target.tagName === "A") {
      node = event.target;
    } else {
      node = event.target.parentNode;
    }
  
    let menuitem = document.getElementsByClassName("p-menuitem-link");
    for (let i = 0; i < menuitem.length; i++) {
      menuitem[i].classList.remove("active");
    }
  
    node.classList.add("active");
  
    // เก็บสถานะปุ่มที่ active ลงใน localStorage
    localStorage.setItem('activeMenuItem', label);
  }
  
  
  removeActiveMenuitem() {
    let menuitem = document.getElementsByClassName("p-menuitem-link");
    for (let i = 0; i < menuitem.length; i++) {
      menuitem[i].classList.remove("active");
    }
  
    // ลบข้อมูล activeMenuItem จาก localStorage
    localStorage.removeItem('activeMenuItem');
  }

  setActiveMenuItemFromStorage(): void {
    let activeLabel: any = localStorage.getItem('activeMenuItem');
  
    const menuitems = document.getElementsByClassName("p-menuitem-link") as HTMLCollectionOf<HTMLElement>;
  
    console.log(menuitems);
    console.log(menuitems.length);

    
    if (!activeLabel) {
      console.log('Meta');
      const homeItem = this.items.find(item => item.routerLink === '/');
      if (homeItem) {
        console.log('HomeItem');
        activeLabel = homeItem.label;
        localStorage.setItem('activeMenuItem', activeLabel);
        // เพิ่มคลาส active ให้กับเมนู Home ทันที
        for (let i = 0; i < menuitems.length; i++) {
          console.log('jungle');
          
          if (menuitems[i].innerText.trim() === activeLabel) {
            menuitems[i].classList.add("active");
            break;
          }
        }
      }
    } else {
      console.log('activeLabel');
      // ถ้ามี activeLabel อยู่แล้ว จะวนลูปเพื่อเพิ่มคลาส active ให้กับเมนูที่ตรงกัน
      for (let i = 0; i < menuitems.length; i++) {
        if (menuitems[i].innerText.trim() === activeLabel) {
          menuitems[i].classList.add("active");
          break;
        }
      }
    }
  }
  
  
  
}
