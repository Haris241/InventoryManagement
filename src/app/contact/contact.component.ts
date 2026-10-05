import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '../services/loading.service';
import { DataLayerService } from '../services/data-layer.service';
import { ContactDto, ContactResponseDto } from '../Models/Contact.model';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {

  themeService = inject(LoadingService);
  dataService  = inject(DataLayerService);

  menuOpen = false;

  toggleMenu()  { this.menuOpen = !this.menuOpen; }
  toggleTheme() { this.themeService.toggleTheme(); }

  currentYear = new Date().getFullYear();

  /** Reactive signals for UI state */
  isSubmitting = signal(false);
  submitted    = signal(false);
  errorMsg     = signal('');

  /** Form model bound directly to the DTO */
  form: ContactDto = {
    fullName : '',
    email    : '',
    phone    : '',
    company  : '',
    subject  : '',
    message  : ''
  };

  readonly subjectOptions = [
    'General Enquiry',
    'Sales & Pricing',
    'Technical Support',
    'Partnership / Integration',
    'Feature Request',
    'Other',
  ];

  onSubmit() {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMsg.set('');

    this.dataService.createResponse<ContactDto, ContactResponseDto>('Contact/send', this.form).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMsg.set(
          err?.error?.message ?? 'Something went wrong. Please try again or email us directly.'
        );
      }
    });
  }

  resetForm() {
    this.submitted.set(false);
    this.errorMsg.set('');
    this.form = { fullName: '', email: '', phone: '', company: '', subject: '', message: '' };
  }
}
