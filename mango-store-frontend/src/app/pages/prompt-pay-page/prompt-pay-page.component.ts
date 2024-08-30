import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PromptpayService, PromptpayInfo } from '../../services/promtpay.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FloatLabelModule } from 'primeng/floatlabel';

interface Bank {
  label: string;
  value: string;
}

@Component({
  selector: 'app-prompt-pay-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ProgressSpinnerModule,
    FloatLabelModule
  ],
  templateUrl: './prompt-pay-page.component.html',
  styleUrls: ['./prompt-pay-page.component.scss']
})
export class PromptPayPageComponent implements OnChanges {
  @Input() isVisiblePromptPaySettingModal: boolean = false;
  isUpdateMode: boolean = false;
  selectedBank: Bank | null = null;
  loading:boolean = false;
  promptpayData: PromptpayInfo = {
    bank_name: '',
    promptpay_number: '',
    additional_qr_info: ''
  };
  banks: Bank[] = [
    { label: 'ธนาคารกรุงเทพ', value: 'BBL' },
    { label: 'ธนาคารกรุงไทย', value: 'KTB' },
    { label: 'ธนาคารกรุงศรีอยุธยา', value: 'BAY' },
    { label: 'ธนาคารกสิกรไทย', value: 'KBANK' },
    { label: 'ธนาคารไทยพาณิชย์', value: 'SCB' },
    { label: 'ธนาคารทหารไทยธนชาต', value: 'TTB' },
    { label: 'ธนาคารยูโอบี', value: 'UOBT' },
    { label: 'ธนาคารเกียรตินาคินภัทร', value: 'KKP' },
    { label: 'ธนาคารซีไอเอ็มบี ไทย', value: 'CIMBT' },
    { label: 'ธนาคารทิสโก้', value: 'TISCO' },
    { label: 'ธนาคารธนชาต', value: 'TBANK' },
    { label: 'ธนาคารสแตนดาร์ดชาร์เตอร์ด', value: 'SCBT' },
    { label: 'ธนาคารออมสิน', value: 'GSB' },
    { label: 'ธนาคารอาคารสงเคราะห์', value: 'GHBANK' },
    { label: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', value: 'BAAC' },
    { label: 'ธนาคารเอ็กซิมประเทศไทย', value: 'EXIM' }
  ];

  constructor(
    private promptpayService: PromptpayService,
    private authService: AuthService,
    private messageService: MessageService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisiblePromptPaySettingModal'] && this.isVisiblePromptPaySettingModal) {
      this.checkPromptpayRecord(); // เรียกเมธอดนี้เมื่อ Modal ถูกเปิด
    }
  }

  checkPromptpayRecord(): void {
    this.loading = true;
    this.promptpayService.getPromptpayInfo().subscribe(
      (data) => {
        if (data) {
          this.isUpdateMode = true;
          this.promptpayData = data;
  
          // ค้นหา bank ที่ตรงกับค่า bank_name ใน promptpayData และตั้งค่า selectedBank
          const matchingBank = this.banks.find(bank => bank.value === this.promptpayData.bank_name);
          if (matchingBank) {
            this.selectedBank = matchingBank;
          }
        } else {
          this.isUpdateMode = false;
          this.selectedBank = null;
        }
        this.loading = false;
      },
      (error) => {
        this.isUpdateMode = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error fetching PromptPay info', life: 5000 });
      }
    );
  }
  

  onSubmit(promptpayForm: NgForm): void {
    if (promptpayForm.invalid) {
        return;
    }
  
    // ตรวจสอบว่า selectedBank มีค่า และตั้งค่า bank_name ใน promptpayData
    this.promptpayData.bank_name = this.selectedBank ? this.selectedBank.value : '';
  
    if (this.isUpdateMode) {
        this.promptpayService.updatePromptpayInfo(this.promptpayData).subscribe(
            (data) => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'PromptPay info updated successfully', life: 5000 });
            },
            (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error updating PromptPay info', life: 5000 });
            }
        );
    } else {
        this.promptpayService.createPromptpayInfo(this.promptpayData).subscribe(
            (data) => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'PromptPay info added successfully', life: 5000 });
                this.isUpdateMode = true;
                this.promptpayData = data;
            },
            (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error adding PromptPay info', life: 5000 });
            }
        );
    }
  }
  
  

}
