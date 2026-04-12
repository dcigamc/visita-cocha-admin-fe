import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FoodService } from '../services/food.service';
import { FoodModel } from '../../../core/models/food.model';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-food-form',
  templateUrl: './food-form.component.html',
  standalone: false
})
export class FoodFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private foodService = inject(FoodService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  activeTab = signal('0');

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', [Validators.required]],
    available: [true],
    isFeatured: [false],
    order: [0],
    rating: [3, [Validators.required]],
    ingredients: [[]],
    coverUrl: ['', [Validators.required]],
    gallery: [[]],
    isActive: [true]
  });

  isEdit = signal(false);
  isLoading = signal(false);
  id = signal<string | null>(null);
  updatedAt = signal<any>(null);

  // Multimedia management
  coverFile = signal<File | null>(null);
  coverPreview = signal<string | null>(null);
  galleryPreviews = signal<{url: string, file?: File}[]>([]);
  urlsToDelete: string[] = [];

  // Image viewer
  displayImageModal = signal(false);
  selectedImageUrl = signal<string | null>(null);

  isAdmin = computed(() => {
    const role = this.authService.userRole();
    return role === 'superadmin' || role === 'admin';
  });

  ratingOptions = [
    { label: '1 - Muy mal', value: 1 },
    { label: '2 - Mal', value: 2 },
    { label: '3 - Regular', value: 3 },
    { label: '4 - Bueno', value: 4 },
    { label: '5 - Excelente', value: 5 }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.id.set(id);
      this.loadFood(id);
    } else {
      this.id.set(this.foodService.generateId());
    }
  }

  loadFood(id: string) {
    this.isLoading.set(true);
    this.foodService.getFoodById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue(data);
          if (data.updatedAt) this.updatedAt.set(data.updatedAt);
          if (data.coverUrl) this.coverPreview.set(data.coverUrl);
          if (data.gallery) this.galleryPreviews.set(data.gallery.map(url => ({ url })));
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onCoverSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.coverFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => this.coverPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
      const currentUrl = this.form.get('coverUrl')?.value;
      if (currentUrl && currentUrl.startsWith('http')) this.urlsToDelete.push(currentUrl);
      this.form.get('coverUrl')?.setValue('pending_upload');
    }
  }

  onGallerySelected(event: any) {
    const files: FileList = event.target.files;
    const currentCount = this.galleryPreviews().length;
    const remaining = 10 - currentCount;
    if (remaining <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'Máximo 10 imágenes' });
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remaining);
    filesToUpload.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.galleryPreviews.update(prev => [...prev, { url: e.target?.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number) {
    const image = this.galleryPreviews()[index];
    if (image.url.startsWith('http')) this.urlsToDelete.push(image.url);
    this.galleryPreviews.update(prev => prev.filter((_, i) => i !== index));
  }

  removeCover() {
    const currentUrl = this.form.get('coverUrl')?.value;
    if (currentUrl && currentUrl.startsWith('http')) this.urlsToDelete.push(currentUrl);
    this.coverFile.set(null);
    this.coverPreview.set(null);
    this.form.get('coverUrl')?.setValue(null);
  }

  openImagePreview(url: string) {
    this.selectedImageUrl.set(url);
    this.displayImageModal.set(true);
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    const itemId = this.id()!;
    const formData = this.form.value as FoodModel;
    try {
      if (this.coverFile()) {
        formData.coverUrl = await this.foodService.uploadFile(itemId, this.coverFile()!, 'cover');
      }
      const updatedGallery: string[] = [];
      for (const item of this.galleryPreviews()) {
        if (item.file) {
          const url = await this.foodService.uploadFile(itemId, item.file, 'gallery');
          updatedGallery.push(url);
        } else {
          updatedGallery.push(item.url);
        }
      }
      formData.gallery = updatedGallery;
      if (this.isEdit()) {
        await this.foodService.updateFood(itemId, formData);
      } else {
        await this.foodService.createFood({ ...formData, id: itemId } as any);
      }
      for (const url of this.urlsToDelete) await this.foodService.deleteFileByUrl(url);
      this.router.navigate(['/foods']);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar' });
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/foods']);
  }

  generateSlug() {
    const name = this.form.get('name')?.value;
    const currentSlug = this.form.get('slug')?.value;
    if (name && !currentSlug) {
      const slug = name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w ]+/g, '').replace(/ +/g, '-');
      this.form.get('slug')?.setValue(slug);
    }
  }
}
