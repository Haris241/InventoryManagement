import { Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataLayerService } from '../../services/data-layer.service';
import { BaseApiService } from '../../services/base-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../services/notification.service';
import { BackgroundJobResponse } from '../../Models/Accouting/FiscalYear.model';
import { NotificationType } from '../../Models/Notification.model';

@Component({
  selector: 'app-bulkimport',
  imports: [CommonModule],
  templateUrl: './bulkimport.component.html',
  styleUrl: './bulkimport.component.css',
})
export class BulkimportComponent {
  // Input: API controller name passed from parent component
  controller = input.required<string>();
  // Input: Import Type name passed from parent component
  importType = input.required<string>();

  // Output: emits when upload succeeds so parent can refresh data
  uploadSuccess = output<void>();
  // Output: emits when upload succeeds so parent can refresh data
  importComplete = output<void>();



  // Modal visibility
  isOpen = signal<boolean>(false);

  // File state
  selectedFile = signal<File | null>(null);
  fileName = signal<string>('');
  fileSize = signal<string>('');
  uploading = signal<boolean>(false);
  dragOver = signal<boolean>(false);
  backgroundJobId = signal<string | null>(null);


  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly dataService = inject(DataLayerService);
  private readonly base = inject(BaseApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifState = inject(NotificationService);


  private readonly allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
  ];

  private readonly allowedExtensions = ['.xlsx', '.csv'];

  // Open / Close modal
  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    if (this.uploading()) return;
    this.isOpen.set(false);
    this.resetFile();
  }

  // Drag and Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  // File input change handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  // Browse button click
  browseFiles(): void {
    this.fileInput()?.nativeElement.click();
  }

  // Validate and set the file
  private processFile(file: File): void {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!this.allowedExtensions.includes(extension)) {
      this.base.globalMessage('error', 'Invalid file type. Only Excel (.xlsx) and CSV (.csv) files are accepted.', false);
      this.resetFile();
      return;
    }

    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.base.globalMessage('error', `File size must be less than ${maxSizeMB} MB.`, false);
      this.resetFile();
      return;
    }

    this.selectedFile.set(file);
    this.fileName.set(file.name);
    this.fileSize.set(this.formatFileSize(file.size));
  }

  // Remove selected file
  resetFile(): void {
    this.selectedFile.set(null);
    this.fileName.set('');
    this.fileSize.set('');
    const input = this.fileInput();
    if (input) {
      input.nativeElement.value = '';
    }
  }

  // Upload the file
  upload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.dataService.create<BackgroundJobResponse>(this.controller(), formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.uploadSuccess.emit();
          this.close();

          //On error Return the File to User 
          this.backgroundJobId.set(res.jobId);
          const sub = this.notifState.onJobComplete(res.jobId, (envelope) => {
            if (envelope.type === NotificationType.Info) {
              const url = `AccountsReports/DownloadBulkErrorSheet/${res.jobId}/${this.importType()}`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  this.downloadBlob(blob, `${this.importType()}_Errors.xlsx`);
                },
                error: (err) => {
                  this.base.handleError(err, err.error?.message);
                }
              });
            }
            //if sucess tell the parent
            if (envelope.type === NotificationType.Success) {
              this.importComplete.emit();
            }
            sub.unsubscribe();
          });
        },
        error: (err) => {
          if (err.error?.message) {
            this.base.handleError(err, err.error.message);
          } else {
            this.base.handleError(err, 'Upload failed. Please check your file and try again.');
          }
          this.uploading.set(false);
        }
      });
  }

  // Format bytes to readable size
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Close modal on backdrop click
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('bulk-import-overlay')) {
      this.close();
    }
  }
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
