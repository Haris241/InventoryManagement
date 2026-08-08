import { Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataLayerService } from '../../services/data-layer.service';
import { BaseApiService } from '../../services/base-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bulkimport',
  imports: [CommonModule],
  templateUrl: './bulkimport.component.html',
  styleUrl: './bulkimport.component.css',
})
export class BulkimportComponent {
  // Input: API controller name passed from parent component
  controller = input.required<string>();

  // Output: emits when upload succeeds so parent can refresh data
  uploadSuccess = output<void>();

  // Modal visibility
  isOpen = signal<boolean>(false);

  // File state
  selectedFile = signal<File | null>(null);
  fileName = signal<string>('');
  fileSize = signal<string>('');
  uploading = signal<boolean>(false);
  dragOver = signal<boolean>(false);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly dataService = inject(DataLayerService);
  private readonly base = inject(BaseApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];

  private readonly allowedExtensions = ['.xlsx', '.xls', '.csv'];

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
      this.base.globalMessage('error', 'Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are accepted.', false);
      this.resetFile();
      return;
    }

    const maxSizeMB = 10;
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

    this.dataService.create<any>(this.controller() + '/BulkImport', formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.base.globalMessage('success', 'File uploaded and imported successfully!', false);
          this.uploading.set(false);
          this.uploadSuccess.emit();
          this.close();
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
}
