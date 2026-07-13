import { inject, Injectable } from "@angular/core";
import { WritableSignal } from "@angular/core";
import { BaseApiService } from "./base-api.service";

@Injectable({
  providedIn: 'root'
})
export class FormDataService {
    private base = inject(BaseApiService);

    private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    buildFormData(formvalue: any, image?: File): FormData {
        const formdata = new FormData();
        Object.keys(formvalue).forEach(Key => {
            const value = formvalue[Key];
            if (value === null || value === undefined) {
                return;
            }
            if (typeof value === 'object' && !(value instanceof File)) {
                formdata.append(Key, JSON.stringify(value));
            } else if (value instanceof File) {
                formdata.append(Key, value);
            } else {
                formdata.append(Key, value.toString());
            }
        });
        if (image) {
            formdata.append('image', image);
        }
        return formdata;
    }

    /**
     * Validates and processes an image file selection.
     * Returns the selected File on success, or null on validation failure.
     */
    onImageSelected(event: Event, imagePreview: WritableSignal<string>, maxSizeMB: number = 3): File | null {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            imagePreview.set('');
            return null;
        }

        if (!this.allowedImageTypes.includes(file.type)) {
            this.base.globalMessage('error', 'Invalid file type. Please select JPEG, PNG or WebP Only');
            input.value = '';
            return null;
        }

        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            this.base.globalMessage('error', `File Must be Less than ${maxSizeMB} MB.`);
            input.value = '';
            return null;
        }

        const reader = new FileReader();
        reader.onload = (e) => { imagePreview.set(e.target?.result as string); };
        reader.readAsDataURL(file);

        return file;
    }

    /**
     * Clears the image preview and resets the file input.
     */
    removeImage(imagePreview: WritableSignal<string>, fileInputId: string): null {
        imagePreview.set('');
        const input = document.getElementById(fileInputId) as HTMLInputElement;
        if (input) {
            input.value = '';
        }
        return null;
    }
}