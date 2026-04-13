import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../services/event.service';
import { EventModel } from '../../../core/models/event.model';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  standalone: false
})
export class EventFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  activeTab = signal('0');

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    available: [true],
    isFeatured: [false],
    order: [0],
    color: ['blue', [Validators.required]],
    date: [new Date(), [Validators.required]],
    foods: [[]],
    restaurants: [[]],
    attractions: [[]],
    coverUrl: [''],
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

  // Lists for MultiSelects
  foodsList = signal<any[]>([]);
  restaurantsList = signal<any[]>([]);
  attractionsList = signal<any[]>([]);

  colorOptions = [
    { label: 'Verde', value: 'green' },
    { label: 'Amarillo', value: 'yellow' },
    { label: 'Azul', value: 'blue' },
    { label: 'Rojo', value: 'red' },
    { label: 'Negro Claro', value: 'black-lighten' }
  ];

  isAdmin = computed(() => {
    const role = this.authService.userRole();
    return role === 'superadmin' || role === 'admin';
  });

  ngOnInit() {
    this.loadInitialData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.id.set(id);
      this.loadEvent(id);
    } else {
      this.id.set(this.eventService.generateId());
    }
  }

  loadInitialData() {
    this.eventService.getFoods().subscribe(data => this.foodsList.set(data));
    this.eventService.getRestaurants().subscribe(data => this.restaurantsList.set(data));
    this.eventService.getAttractives().subscribe(data => this.attractionsList.set(data));
  }

  loadEvent(id: string) {
    this.isLoading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (data) => {
        if (data) {
          const formData = {
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date
          };
          this.form.patchValue(formData);
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
    const formData = { ...this.form.value };
    
    // Convert Date to Timestamp
    if (formData.date instanceof Date) {
      formData.date = Timestamp.fromDate(formData.date);
    }

    try {
      if (this.coverFile()) {
        formData.coverUrl = await this.eventService.uploadFile(itemId, this.coverFile()!, 'cover');
      }

      const updatedGallery: string[] = [];
      for (const item of this.galleryPreviews()) {
        if (item.file) {
          const url = await this.eventService.uploadFile(itemId, item.file, 'gallery');
          updatedGallery.push(url);
        } else {
          updatedGallery.push(item.url);
        }
      }
      formData.gallery = updatedGallery;
      
      if (this.isEdit()) {
        await this.eventService.updateEvent(itemId, formData);
      } else {
        await this.eventService.createEvent({ ...formData, id: itemId } as any);
      }
      
      for (const url of this.urlsToDelete) await this.eventService.deleteFileByUrl(url);
      this.router.navigate(['/events']);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar el evento' });
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/events']);
  }
}
