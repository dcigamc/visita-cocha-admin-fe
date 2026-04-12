import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AttractiveService } from '../services/attractive.service';
import { AttractiveModel } from '../../../core/models/attractive.model';
import { CategoryModel } from '../../../core/models/category.model';
import { MessageService } from 'primeng/api';
import { CountryISO, SearchCountryField, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-attractive-form',
  templateUrl: './attractive-form.component.html',
  standalone: false
})
export class AttractiveFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private attractiveService = inject(AttractiveService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    description: ['', [Validators.required]],
    type: [''], // Opcional, mantener si es necesario
    mainCategories: [[]],
    categories: [[]],
    available: [true],
    schedule: [''],
    rating: [3, [Validators.required]],
    accessibility: [''],
    contact: this.fb.group({
      mail: ['', [Validators.email]],
      link: [''],
      phone: ['']
    }),
    coverUrl: ['', [Validators.required]],
    gallery: [[]],
    order: [0],
    historyId: [''],
    isFeatured: [false],
    location: this.fb.group({
      address: ['', [Validators.required]],
      coords: this.fb.group({
        lng: ['', [Validators.required]],
        lat: ['', [Validators.required]]
      })
    }),
    foods: [[]],
    isActive: [true]
  });

  isEdit = signal(false);
  isLoading = signal(false);
  id = signal<string | null>(null);
  updatedAt = signal<any>(null);

  // Multimedia management
  coverFile = signal<File | null>(null);
  coverPreview = signal<string | null>(null);
  galleryFiles = signal<File[]>([]);
  galleryPreviews = signal<{url: string, file?: File}[]>([]);
  urlsToDelete: string[] = [];

  // Image viewer
  displayImageModal = signal(false);
  selectedImageUrl = signal<string | null>(null);

  isAdmin = computed(() => {
    const role = this.authService.userRole();
    return role === 'superadmin' || role === 'admin';
  });

  // Lists for MultiSelects
  mainCategoriesList = signal<CategoryModel[]>([]);
  attractionCategoriesList = signal<CategoryModel[]>([]);
  foodsList = signal<any[]>([]);
  ratingOptions = [
    { label: '1 - Muy mal', value: 1 },
    { label: '2 - Mal', value: 2 },
    { label: '3 - Regular', value: 3 },
    { label: '4 - Bueno', value: 4 },
    { label: '5 - Excelente', value: 5 }
  ];

  // ngx-intl-tel-input config
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.Bolivia, CountryISO.Argentina];

  ngOnInit() {
    this.loadInitialData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.id.set(id);
      this.loadAttractive(id);
    } else {
      // Si es nuevo, generamos un ID de una vez para las carpetas del storage
      this.id.set(this.attractiveService.generateId());
    }

    // Asegurar que si el teléfono se limpia, se guarde como string vacío y no null
    this.form.get('contact.phone')?.valueChanges.subscribe((value) => {
      if (value === null) {
        this.form.get('contact.phone')?.patchValue('', { emitEvent: false });
      }
    });
  }

  loadInitialData() {
    // Cargar Categorías Principales
    this.attractiveService.getMainCategories().subscribe({
      next: (data) => this.mainCategoriesList.set(data),
      error: (err) => console.error('Error loading main categories:', err)
    });

    // Cargar Categorías de Atractivos
    this.attractiveService.getAttractionCategories().subscribe({
      next: (data) => this.attractionCategoriesList.set(data),
      error: (err) => console.error('Error loading attraction categories:', err)
    });

    // Cargar Comidas
    this.attractiveService.getFoods().subscribe({
      next: (data) => this.foodsList.set(data),
      error: (err) => console.error('Error loading foods:', err)
    });
  }

  loadAttractive(id: string) {
    this.isLoading.set(true);
    this.attractiveService.getAttractiveById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue(data);
          if (data.updatedAt) {
            this.updatedAt.set(data.updatedAt);
          }
          if (data.coverUrl) {
            this.coverPreview.set(data.coverUrl);
          }
          if (data.gallery) {
            this.galleryPreviews.set(data.gallery.map(url => ({ url })));
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el atractivo' });
        this.isLoading.set(false);
      }
    });
  }

  // --- Multimedia Handlers ---

  onCoverSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.coverFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => this.coverPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);

      // Si había una URL previa (de Firestore), la marcamos para borrar
      const currentUrl = this.form.get('coverUrl')?.value;
      if (currentUrl && currentUrl.startsWith('http')) {
        this.urlsToDelete.push(currentUrl);
      }
      this.form.get('coverUrl')?.setValue('pending_upload'); // Marcamos que habrá algo
    }
  }

  onGallerySelected(event: any) {
    const files: FileList = event.target.files;
    const currentCount = this.galleryPreviews().length;
    const remaining = 10 - currentCount;

    if (remaining <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'Máximo 10 imágenes en galería' });
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
    if (image.url.startsWith('http')) {
      this.urlsToDelete.push(image.url);
    }
    this.galleryPreviews.update(prev => prev.filter((_, i) => i !== index));
  }

  removeCover() {
    const currentUrl = this.form.get('coverUrl')?.value;
    if (currentUrl && currentUrl.startsWith('http')) {
      this.urlsToDelete.push(currentUrl);
    }
    this.coverFile.set(null);
    this.coverPreview.set(null);
    this.form.get('coverUrl')?.setValue(null);
  }

  openImagePreview(url: string) {
    this.selectedImageUrl.set(url);
    this.displayImageModal.set(true);
  }

  async onSubmit() {
    if (this.form.invalid) {
      // Validar portada
      if (!this.coverPreview()) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La imagen de portada es obligatoria' });
      }
      return;
    }

    this.isLoading.set(true);
    const itemId = this.id()!;
    const formData = this.form.value as AttractiveModel;

    try {
      // 1. Subir portada si cambió
      if (this.coverFile()) {
        formData.coverUrl = await this.attractiveService.uploadFile(itemId, this.coverFile()!, 'cover');
      }

      // 2. Subir nuevas imágenes de galería
      const updatedGallery: string[] = [];
      for (const item of this.galleryPreviews()) {
        if (item.file) {
          const url = await this.attractiveService.uploadFile(itemId, item.file, 'gallery');
          updatedGallery.push(url);
        } else {
          updatedGallery.push(item.url); // Mantener las que ya eran URLs
        }
      }
      formData.gallery = updatedGallery;

      // 3. Guardar en Firestore
      if (this.isEdit()) {
        await this.attractiveService.updateAttractive(itemId, formData);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Atractivo actualizado' });
      } else {
        await this.attractiveService.createAttractive({ ...formData, id: itemId } as any);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Atractivo creado' });
      }

      // 4. Limpiar storage (solo después de guardar éxito)
      for (const url of this.urlsToDelete) {
        await this.attractiveService.deleteFileByUrl(url);
      }

      this.router.navigate(['/attractives']);
    } catch (error) {
      console.error('Error in onSubmit:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la solicitud' });
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/attractives']);
  }

  // Helper para generar slug automáticamente
  generateSlug() {
    const name = this.form.get('name')?.value;
    if (name && !this.isEdit()) {
      const slug = name.toLowerCase()
        .trim()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      this.form.get('slug')?.setValue(slug);
    }
  }
}
