import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FieldsetModule } from 'primeng/fieldset';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProductService } from './../../services/product.service';
import { PromotionService } from './../../services/promotion.service';
import { DividerModule } from 'primeng/divider';
import { Product } from './../../model/product.model';
import { Promotion, PromotionTypeResponse } from '../../model/promotion.model';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FileUploadModule } from 'primeng/fileupload';
import { FileUpload } from 'primeng/fileupload';
import { finalize } from 'rxjs/operators';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ImageModule } from 'primeng/image';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { AuthService } from '../../services/auth.service';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { LoadingService } from '../../services/loading.service';


@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DataViewModule,
    ButtonModule,
    TagModule,
    FieldsetModule,
    PaginatorModule,
    DialogModule,
    ReactiveFormsModule,
    DividerModule,
    HttpClientModule,
    FloatLabelModule,
    InputTextModule,
    InputTextareaModule,
    FileUploadModule,
    ConfirmDialogModule,
    ImageModule,
    InputNumberModule,
    InputSwitchModule,
    CheckboxModule,
    DropdownModule,
    CalendarModule
  ],
  providers: [
    ProductService,
    PromotionService,
    ConfirmationService,
    MessageService
  ],
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.scss']
})
export class VendorDashboardComponent implements OnInit {
  displayAddProductDialog: boolean = false;
  displayEditProductDialog: boolean = false;
  displayAddPromotionDialog: boolean = false;
  displayEditPromotionDialog: boolean = false;

  addProductForm: FormGroup;
  editProductForm: FormGroup;
  addPromotionForm: FormGroup;
  editPromotionForm: FormGroup;

  products: Product[] = [];
  paginatedProducts: Product[] = [];
  selectedProducts: Product[] = [];
  first: number = 0;
  rows: number = 10;
  editingProduct: Product | null = null;
  deleteImageFlag: boolean = false;
  selectedFile: File | null = null;
  vendor_id: string | null = null;
  imagePreview: string | null = null;
  promotionTypes: any[] = [];

  @ViewChild('fileUploadAdd', { static: false }) fileUploadAdd!: FileUpload;
  @ViewChild('fileUploadEdit', { static: false }) fileUploadEdit!: FileUpload;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private promotionService: PromotionService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private authService: AuthService,
    private loadingService: LoadingService
  ) {
    this.vendor_id = localStorage.getItem('user_id');
    this.addProductForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      vendor_id: [this.vendor_id, Validators.required],
      stock: [0, Validators.required],
      is_available: [false, Validators.required],
      image: [null]
    });

    this.editProductForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, Validators.required],
      is_available: [false, Validators.required],
      image: [null]
    });

    this.addPromotionForm = this.fb.group({
      promotion_type_id: [null, Validators.required],
      discount_value: [0, [Validators.required, Validators.min(0)]],
      start_date: [null, Validators.required],
      end_date: [null, Validators.required],
      min_quantity: [0, Validators.min(0)],
      min_price: [0, Validators.min(0)],
      description: ['']
    });

    this.editPromotionForm = this.fb.group({
      promotion_type_id: [null, Validators.required],
      discount_value: [0, [Validators.required, Validators.min(0)]],
      start_date: [null, Validators.required],
      end_date: [null, Validators.required],
      min_quantity: [0, Validators.min(0)],
      min_price: [0, Validators.min(0)],
      description: ['']
    });
  }

  ngOnInit() {
    if (this.vendor_id) {
      this.loadProducts();
    } else {
      this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'ไม่พบ Vendor ID', life: 3000});
    }
    this.loadPromotionTypes();
  }

  loadProducts() {
    const vendorId = this.vendor_id ?? undefined;
    const role = this.authService.getRole();
    this.loadingService.show();
    if (role === 'admin') {
      this.productService.searchProducts({}).subscribe({
        next: (products) => {
          this.products = Array.isArray(products) ? products : [];
          this.updatePaginatedProducts();
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.products = [];
          this.updatePaginatedProducts();
        }
      });
    } else if (vendorId) {
      this.productService.searchProducts({ vendor_id: vendorId }).subscribe({
        next: (products) => {
          this.products = Array.isArray(products) ? products : [];
          this.updatePaginatedProducts();
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.products = [];
          this.updatePaginatedProducts();
        }
      });
    } else {
      this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'ไม่พบ Vendor ID', life: 3000});
    }
  }

  loadPromotionTypes() {
    this.promotionService.getPromotionTypes().subscribe({
      next: (response) => {
        this.promotionTypes = response.data.map((type: { id: number, name: string }) => ({
          id: type.id,
          name: type.name
        }));
      },
      error: (error) => {
        console.error('Error fetching promotion types:', error);
      }
    });
  }

  showAddProductDialog() {
    this.displayAddProductDialog = true;
  }

  showEditProductDialog(product: Product) {
    this.editingProduct = product;
    let is_available_converted = product.is_available ? true : false;
    this.editProductForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      is_available: is_available_converted,
      image: null
    });
    this.imagePreview = product.images && product.images.length > 0 ? product.images[0].image_data : null;
    this.displayEditProductDialog = true;
  }

  showAddPromotionDialog() {
    if (this.selectedProducts.length === 0) {
      this.messageService.add({severity: 'warn', summary: 'คำเตือน', detail: 'กรุณาเลือกสินค้าที่ต้องการเพิ่มโปรโมชั่นอย่างน้อยหนึ่งรายการ', life: 3000});
      return;
    }
    this.displayAddPromotionDialog = true;
  }

  showEditPromotionDialog(product: Product) {
    if (product?.promotion) {
        const promotionType = this.promotionTypes.find(type => type.id === product.promotion?.promotion_type_id) ?? null;
        
        this.editPromotionForm.patchValue({
            promotion_type_id: promotionType,
            discount_value: product.promotion?.discount_value,
            start_date: product.promotion?.start_date,
            end_date: product.promotion?.end_date,
            min_quantity: product.promotion?.min_quantity,
            min_price: product.promotion?.min_price,
            description: product.promotion?.description
        });
        
        this.selectedProducts = [product];  // Ensure selectedProduct is set
        this.displayEditPromotionDialog = true;
    } else {
        this.messageService.add({ severity: 'warn', summary: 'คำเตือน', detail: 'สินค้านี้ไม่มีโปรโมชั่นให้แก้ไข', life: 3000 });
    }
  }



  getSeverity(product: Product) {
    return product.promotion ? 'info' : 'success';
  }

  onFileChange(event: any) {
    const file: File = event.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        console.error('Invalid file type. Allowed types are JPEG, PNG, JPG, GIF, SVG.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        console.error('File size should be no more than 2 MB.');
        return;
      }
      this.imagePreview = URL.createObjectURL(file);
      this.selectedFile = file;
      this.addProductForm.patchValue({ image: file });
      this.editProductForm.patchValue({ image: file });
    }
  }

  onAddProduct() {
    if (this.addProductForm.valid) {
      const formData = new FormData();
      formData.append('name', this.addProductForm.get('name')?.value);
      formData.append('description', this.addProductForm.get('description')?.value);
      formData.append('price', this.addProductForm.get('price')?.value);
      formData.append('stock', this.addProductForm.get('stock')?.value);
      formData.append('is_available', this.addProductForm.get('is_available')?.value);

      if (this.vendor_id) {
        formData.append('vendor_id', this.vendor_id);
      } else {
        this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'Vendor ID เป็นค่าว่าง', life: 3000});
        return;
      }

      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }

      this.productService.addProduct(formData).subscribe({
        next: (newProduct) => {
          this.refreshProductList();
          this.displayAddProductDialog = false;
          this.resetForm(this.addProductForm);
          this.clearFileSelection('add');
          this.messageService.add({severity: 'success', summary: 'สำเร็จ', detail: 'เพิ่มสินค้าสำเร็จ', life: 3000});
        },
        error: (error) => {
          console.error('Error adding product:', error);
          this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า', life: 3000});
        }
      });
    } else {
      this.logFormErrors(this.addProductForm);
    }
  }

  onEditProduct() {
    if (this.editProductForm.valid && this.editingProduct) {
      const formData = new FormData();
      formData.append('name', this.editProductForm.get('name')?.value);
      formData.append('description', this.editProductForm.get('description')?.value);
      formData.append('price', this.editProductForm.get('price')?.value);
      formData.append('stock', this.editProductForm.get('stock')?.value);
      formData.append('is_available', this.editProductForm.get('is_available')?.value);
      formData.append('delete_image', this.deleteImageFlag ? 'true' : 'false');

      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
        formData.append('delete_image', 'false');
      }

      this.productService.editProduct(this.editingProduct.id, formData).subscribe({
        next: (updatedProduct) => {
          this.refreshProductList();
          this.displayEditProductDialog = false;
          this.deleteImageFlag = false;
          this.resetForm(this.editProductForm);
          this.clearFileSelection('edit');
          this.messageService.add({severity: 'success', summary: 'สำเร็จ', detail: 'แก้ไขสินค้าสำเร็จ', life: 3000});
        },
        error: (error) => {
          this.deleteImageFlag = false;
          console.error('Error updating product:', error);
          this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า', life: 3000});
        }
      });
    } else {
      this.logFormErrors(this.editProductForm);
    }
  }

  onAddPromotion() {
    if (this.addPromotionForm.valid) {
      const promotionData = {
        ...this.addPromotionForm.value,
        promotion_type_id: this.addPromotionForm.value.promotion_type_id.id // Extracting only the id
      };
      this.selectedProducts.forEach(product => {
        const promotion: Promotion = {
          ...promotionData,
          product_id: product.id
        };
        this.promotionService.addPromotion(promotion).subscribe({
          next: () => {
            this.refreshProductList();
            this.messageService.add({severity: 'success', summary: 'สำเร็จ', detail: 'เพิ่มโปรโมชั่นสำเร็จ', life: 3000});
          },
          error: (error) => {
            console.error('Error adding promotion:', error);
            this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'เกิดข้อผิดพลาดในการเพิ่มโปรโมชั่น', life: 3000});
          }
        });
      });
      this.displayAddPromotionDialog = false;
      this.addPromotionForm.reset();
    }
  }

  onEditPromotion() {
    if (this.editPromotionForm.valid) {
        const promotionType = this.editPromotionForm.value.promotion_type_id;
        
        if (!promotionType || !promotionType.id) {
            this.messageService.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'ไม่สามารถอ่านค่า ID ของประเภทโปรโมชั่นได้', life: 3000 });
            return;
        }

        const promotionData = { 
            ...this.editPromotionForm.value, 
            promotion_type_id: promotionType.id 
        };
        const selectedProduct = this.selectedProducts[0];

        if (!selectedProduct || !selectedProduct.promotion) {
            this.messageService.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'ไม่พบโปรโมชั่นสำหรับสินค้านี้', life: 3000 });
            return;
        }

        const promotion: Promotion = {
            ...promotionData,
            product_id: selectedProduct.id,
            id: selectedProduct.promotion.id
        };

        this.promotionService.updatePromotion(promotion).subscribe({
            next: () => {
                this.loadProducts();
                this.messageService.add({ severity: 'success', summary: 'สำเร็จ', detail: 'แก้ไขโปรโมชั่นสำเร็จ', life: 3000 });
            },
            error: (error) => {
                console.error('Error updating promotion:', error);
                this.messageService.add({ severity: 'error', summary: 'ข้อผิดพลาด', detail: 'เกิดข้อผิดพลาดในการแก้ไขโปรโมชั่น', life: 3000 });
            }
        });
        this.displayEditPromotionDialog = false;
    } else {
        this.messageService.add({ severity: 'warn', summary: 'คำเตือน', detail: 'กรุณากรอกข้อมูลให้ครบถ้วน', life: 3000 });
    }
  }

  onDeletePromotion(product: Product) {
    if (product.promotion) {
      this.confirmationService.confirm({
        message: 'คุณยืนยันที่จะลบโปรโมชั่นนี้ใช่หรือไม่?',
        accept: () => {
          const promotionId = product.promotion ? product.promotion.id : null;
          if (promotionId !== null) {
            this.promotionService.deletePromotion(promotionId).subscribe({
              next: () => {
                this.loadProducts();
                this.messageService.add({severity: 'success', summary: 'สำเร็จ', detail: 'ลบโปรโมชั่นสำเร็จ', life: 3000});
              },
              error: (error) => {
                console.error('Error deleting promotion:', error);
                this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'เกิดข้อผิดพลาดในการลบโปรโมชั่น', life: 3000});
              }
            });
          }
        }
      });
    } else {
      this.messageService.add({severity: 'warn', summary: 'คำเตือน', detail: 'สินค้านี้ไม่มีโปรโมชั่นให้ลบ', life: 3000});
    }
  }

  logFormErrors(form: FormGroup) {
    Object.keys(form.controls).forEach(key => {
      const controlErrors = form.get(key)?.errors;
      if (controlErrors != null) {
        console.error(`Key control: ${key}, Errors: `, controlErrors);
      }
    });
  }

  updatePaginatedProducts() {
    const startIndex = this.first;
    const endIndex = this.first + this.rows;
    this.paginatedProducts = this.products.slice(startIndex, endIndex);
    this.loadingService.hide();
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.updatePaginatedProducts();
  }

  closeAddProductDialog() {
    this.displayAddProductDialog = false;
    this.resetForm(this.addProductForm);
    this.clearFileSelection('add');
  }

  closeEditProductDialog() {
    this.displayEditProductDialog = false;
    this.resetForm(this.editProductForm);
    this.clearFileSelection('edit');
  }

  closeAddPromotionDialog() {
    this.displayAddPromotionDialog = false;
    this.addPromotionForm.reset();
  }

  closeEditPromotionDialog() {
    this.displayEditPromotionDialog = false;
    this.editPromotionForm.reset();
  }

  clearFileSelection(dialogType: string) {
    this.selectedFile = null;
    this.imagePreview = null;
    this.addProductForm.patchValue({ image: null });
    this.editProductForm.patchValue({ image: null });
    if (dialogType === 'add' && this.fileUploadAdd) {
      this.fileUploadAdd.clear();
    } else if (dialogType === 'edit' && this.fileUploadEdit) {
      this.fileUploadEdit.clear();
    }
  }

  setDeleteImageFlag() {
    this.deleteImageFlag = true;
  }

  resetForm(form: FormGroup) {
    form.reset();
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.setErrors(null);
    });
    this.clearFileSelection('add');
    this.clearFileSelection('edit');
  }

  confirmToDelete(productId: number): void {
    this.confirmationService.confirm({
      message: 'คุณยืนยันที่จะลบสินค้าใช่หรือไม่?',
      accept: () => this.deleteProduct(productId)
    });
  }

  deleteProduct(productId: number): void {
    this.productService.deleteProduct(productId).pipe(
      finalize(() => {
        this.refreshProductList();
        if (this.paginatedProducts.length === 0 && this.first > 0) {
          this.first = Math.max(this.first - this.rows, 0);
        }
        this.updatePaginatedProducts();
      })
    ).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'สำเร็จ', detail: 'ลบสินค้าสำเร็จ', life: 3000});
      },
      error: (err) => {
        console.error('Error deleting product:', err);
        this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'เกิดข้อผิดพลาดในการลบสินค้า', life: 3000});
      }
    });
  }

  refreshProductList() {
    const vendorId = this.vendor_id ?? undefined;
    const role = this.authService.getRole();
    if (role === 'admin') {
      this.productService.searchProducts().subscribe({
        next: (products) => {
          this.products = Array.isArray(products) ? products : [];
          this.updatePaginatedProducts();
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.products = [];
          this.updatePaginatedProducts();
        }
      });
    } else if (vendorId) {
      this.productService.searchProducts({ vendor_id: vendorId }).subscribe({
        next: (products) => {
          this.products = Array.isArray(products) ? products : [];
          this.updatePaginatedProducts();
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.products = [];
          this.updatePaginatedProducts();
        }
      });
    } else {
      this.messageService.add({severity: 'error', summary: 'ข้อผิดพลาด', detail: 'ไม่พบ Vendor ID ในการรีเฟรช', life: 3000});
    }
  }

  onProductSelect(product: Product) {
    const index = this.selectedProducts.indexOf(product);
    if (index >= 0) {
      this.selectedProducts.splice(index, 1);
    } else {
      this.selectedProducts.push(product);
    }
  }

  toggleAllProducts() {
    if (this.selectedProducts.length === this.paginatedProducts.length) {
      this.selectedProducts = [];
    } else {
      this.selectedProducts = [...this.paginatedProducts];
    }
  }
}
