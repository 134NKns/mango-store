import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { UserRegister } from '../../../model/user.model';
import { PasswordModule } from 'primeng/password';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

interface Bank {
  label: string;
  value: string;
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    FormsModule,
    PasswordModule,
    CommonModule,
    DropdownModule,
    ProgressSpinnerModule
  ],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.scss'],
})
export class RegisterPageComponent implements OnChanges {
  @Input() role: 'customer' | 'vendor' | null = null;
  loading: boolean = false;
  usernamePattern: string = '^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};:\'"\\\\|,.<>\\/?]*$';
  passwordPattern: string = '^[a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{};:\'"\\\\|,.<>\\/?]*$';

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

  selectedBank: Bank | null = null;

  passwordMatch: boolean = true;
  userDetails: UserRegister = {
    username: '',
    password: '',
    password_confirmation: '',
    role: null,
    email: '',
    firstname: '',
    lastname: '',
    address: '',
    phone: '',
    store_name: '',
    bank_name:'',
    promptpay_number:''
  };

  constructor(private authService: AuthService,private messageService: MessageService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['role']) {
      this.userDetails.role = this.role;
    }
  }

  onBankChange(bank: Bank) {
    console.log('bank changed');
    
    this.selectedBank = bank;
    if (bank) {
      this.userDetails.bank_name = bank.value;
    } else {
      this.userDetails.bank_name = '';
    }
  }

  isMatchPassword() {
    const password = this.userDetails.password;
    const confirmed_password = this.userDetails.password_confirmation;
    this.passwordMatch = password === confirmed_password;
  }

  registerSubmit(registerForm: NgForm) {
    this.loading = true
    if (!this.passwordMatch || !registerForm.valid) {
      this.loading = false
      this.messageService.add({
        severity:'error', 
        summary: 'Error', 
        detail: 'Password not match', 
        life: 5000
      });
      return;
    }
    if (this.selectedBank) {
      this.userDetails.bank_name = this.selectedBank.value;
    }
    this.authService.register(this.userDetails).subscribe(
      response => {
        this.loading = false
        console.log('Registration successful', response);
      },
      error => {
        this.loading = false
        console.error('Registration failed', error);
      }
    );
  }

  triggerSubmit(registerForm: NgForm){
    this.registerSubmit(registerForm);
  }
}
