import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { Banner } from '../../model/banner';
import { BannerService } from '../../services/banner.service';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';


@Component({
  selector: 'app-banner-management-page',
  standalone: true,
  imports: [
    CommonModule,
    DataViewModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    FileUploadModule,
    FloatLabelModule,
    InputTextModule,
    InputNumberModule,
    ProgressSpinnerModule
  ],
  templateUrl: './banner-management-page.component.html',
  styleUrls: ['./banner-management-page.component.scss']
})
export class BannerManagementPageComponent implements OnChanges {
  @Input() isVisibleBannerModal: boolean = false;
  @Output() isVisibleBannerModalChange = new EventEmitter<boolean>();

  banners: Banner[] = [];
  banner: Banner = { name: '', banner_order: 0, url: '' }; // กำหนดค่าเริ่มต้นให้ banner
  visible: boolean = false;
  bannerImagePreview: string | null = null; // สำหรับแสดง preview รูป
  uploadedFile: File | null = null; // เก็บไฟล์ที่อัปโหลด
  uploadedFileName: string | null = null; // เพิ่มตัวแปรสำหรับเก็บชื่อไฟล์ที่อัปโหลด
  loading: boolean = false;


  constructor(private bannerService: BannerService,private messageService: MessageService) { }

  // ตรวจจับการเปลี่ยนแปลงของ @Input isVisibleBannerModal
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisibleBannerModal']) {
      if (this.isVisibleBannerModal) {
        this.loadBanners();
      }
    }
  }

  onFileSelect(event: any) {
    const file = event.files[0];
    this.uploadedFile = file; // เก็บไฟล์ที่อัปโหลด
    this.uploadedFileName = file.name; // เซ็ตชื่อไฟล์ที่อัปโหลด

    const reader = new FileReader();
    reader.onload = () => {
      this.bannerImagePreview = reader.result as string; // แสดง preview รูปภาพ
    };
    reader.readAsDataURL(file);
  }


  removeImage(fileUploader: any) {
    this.uploadedFile = null;
    this.uploadedFileName = null; // รีเซ็ตชื่อไฟล์ที่อัปโหลด
    this.bannerImagePreview = null; // ลบ preview รูปภาพ
    fileUploader.clear(); // ล้างไฟล์ที่อัปโหลดใน p-fileUpload
  }

  onSave(fileUploader: any) {
    if (!this.banner.name) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
      return;
    }
  
    if (this.banner.id) {
      const formData = new FormData();
      formData.append('name', this.banner.name);
  
      if (this.banner.banner_order) {
        formData.append('banner_order', String(this.banner.banner_order));
      }
  
      // เช็คว่ามีไฟล์ใหม่ถูกอัปโหลดหรือไม่ ถ้ามีก็ใส่เข้าไปใน FormData
      if (this.uploadedFile) {
        formData.append('url', this.uploadedFile as File);
      }
  
      this.bannerService.updateBanner(this.banner.id, formData).subscribe({
        next: (updatedBanner: Banner) => {
          const index = this.banners.findIndex(b => b.id === updatedBanner.id);
          if (index !== -1) {
            this.banners[index] = updatedBanner;
          }
          this.banners = this.banners.sort((a, b) => (a.banner_order || 0) - (b.banner_order || 0)); // เรียงตาม banner_order
          this.visible = false;
          fileUploader.clear();
          // this.messageService.add({ 
          //   severity: 'success', 
          //   summary: 'Success', 
          //   detail: 'Banner updated successfully' 
          // });
        },
        error: (error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Error updating banner: ' + error 
          });
        }
      });
    } else {
      if (!this.uploadedFile) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'กรุณาอัพโหลดรูปภาพ' 
        });
        return;
      }
  
      const formData = new FormData();
      formData.append('name', this.banner.name);
  
      if (this.banner.banner_order) {
        formData.append('banner_order', String(this.banner.banner_order));
      }
  
      formData.append('url', this.uploadedFile as File);
  
      this.bannerService.addBanner(formData).subscribe({
        next: (newBanner: Banner) => {
          this.banners.push(newBanner);
          this.banners = this.banners.sort((a, b) => (a.banner_order || 0) - (b.banner_order || 0)); // เรียงตาม banner_order
          this.visible = false;
          fileUploader.clear();
          // this.messageService.add({ 
          //   severity: 'success', 
          //   summary: 'Success', 
          //   detail: 'Banner added successfully' 
          // });
        },
        error: (error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Error adding banner: ' + error 
          });
        }
      });
    }
  }
  
  
  onCancel(fileUploader: any) {
    this.visible = false;
    this.banner = { name: '', banner_order: 0, url: '' };
    this.bannerImagePreview = null;
    this.uploadedFile = null; // รีเซ็ตไฟล์ที่อัปโหลด
    fileUploader.clear(); // เคลียร์ค่าจาก p-fileUpload
  }

  // ฟังก์ชันโหลดแบนเนอร์ทั้งหมด
  loadBanners(): void {
    this.loading = true;
    this.bannerService.getAllBanners().subscribe({
      next: (banners: Banner[]) => {
        // จัดเรียง banners โดยเช็คค่า banner_order ถ้าไม่มีจะใช้ 0
        this.banners = banners.sort((a, b) => (a.banner_order || 0) - (b.banner_order || 0));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching banners:', error);
        this.loading = false;
      }
    });
  }
  
  

  onAddBanner(): void {
    this.banner = { name: '', banner_order: 0, url: '' }; // กำหนดค่าเริ่มต้นสำหรับเพิ่มแบนเนอร์ใหม่
    this.bannerImagePreview = null; // ล้าง preview รูปภาพ
    this.uploadedFile = null; // ล้างไฟล์ที่อัปโหลด
    this.visible = true; // เปิด modal
  }

  // ฟังก์ชันแก้ไขแบนเนอร์
  onEditBanner(banner: Banner): void {
    this.banner = { ...banner }; // คัดลอกข้อมูลแบนเนอร์ที่จะทำการแก้ไข

    // ตรวจสอบว่ามี Base64 ใน url หรือไม่แล้วแสดงรูป preview
    if (banner.url) {
      this.bannerImagePreview = 'data:image/png;base64,' + banner.url; // เซ็ต preview รูป
      this.uploadedFileName = 'รูปที่ถูกอัพโหลดก่อนหน้านี้'; // ตั้งค่าให้เป็นชื่อไฟล์เดิม (ใช้ข้อความแทนชื่อไฟล์จริง)
    }

    this.visible = true; // เปิด modal สำหรับแก้ไขแบนเนอร์
  }


  // ฟังก์ชันลบแบนเนอร์
  onDeleteBanner(id: number | undefined): void {
    if (id !== undefined) {
      this.bannerService.deleteBanner(id).subscribe({
        next: () => {
          this.banners = this.banners.filter(banner => banner.id !== id);
          this.banners = this.banners.sort((a, b) => (a.banner_order || 0) - (b.banner_order || 0)); // เรียงตาม banner_order หลังจากลบ
          // this.messageService.add({ 
          //   severity: 'success', 
          //   summary: 'Success', 
          //   detail: 'Banner deleted successfully' 
          // });
        },
        error: (error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Error deleting banner: ' + error 
          });
        }
      });
    } else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Invalid ID: Cannot delete banner with undefined ID' 
      });
    }
  }
  
  
}
