import { Component, inject, OnInit, signal, computed, ViewChild, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AttractiveService } from '../services/attractive.service';
import { AttractiveModel } from '../../../core/models/attractive.model';
import { CategoryModel } from '../../../core/models/category.model';
import { MessageService } from 'primeng/api';
import { CountryISO, SearchCountryField, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { AuthService } from '../../../core/services/auth.service';
import { MapComponent } from '../../../shared/components/map/map.component';

@Component({
  selector: 'app-attractive-form',
  templateUrl: './attractive-form.component.html',
  standalone: false
})
export class AttractiveFormComponent implements OnInit {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  private fb = inject(FormBuilder);
  private attractiveService = inject(AttractiveService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // Control de pestañas y mapa
  activeTab = signal('0');
  showMap = signal(false);

  constructor() {
    // Efecto para reaccionar al cambio de pestaña y refrescar el mapa
    effect(() => {
      if (this.activeTab() === '2') {
        if (!this.showMap()) {
          this.showMap.set(true);
        }
        // Retraso para permitir que la animación de la pestaña termine y ResizeObserver actúe
        setTimeout(() => {
          this.mapComponent?.refresh();
        }, 300);
      }
    });
  }

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['', [Validators.required]],
    type: [''],
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
      this.id.set(this.attractiveService.generateId());
    }

    // Listener para el teléfono
    this.form.get('contact.phone')?.valueChanges.subscribe((value) => {
      if (value === null) {
        this.form.get('contact.phone')?.patchValue('', { emitEvent: false });
      }
    });

    // Listener para Google Maps
    this.form.get('location.address')?.valueChanges.subscribe((value: string) => {
      if (value && (value.includes('google.com/maps') || value.includes('maps.app.goo.gl'))) {
        this.processGoogleMapsUrl(value);
      }
    });
  }

  processGoogleMapsUrl(url: string) {
    const coordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(coordsRegex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      // 1. Actualizar coordenadas en el formulario
      this.form.get('location.coords.lat')?.setValue(lat);
      this.form.get('location.coords.lng')?.setValue(lng);

      // 2. Asegurar que el mapa sea visible
      if (!this.showMap()) {
        this.showMap.set(true);
      }

      // 3. Usar Leaflet (Nominatim) para obtener la calle exacta basándose en esas coordenadas
      setTimeout(() => {
        this.mapComponent?.reverseGeocode(lat, lng);
      }, 350);
      
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Ubicación detectada', 
        detail: 'Sincronizando dirección con el mapa...' 
      });
    }
  }

  onMapLocationChange(event: {lat: number, lng: number, address?: string}) {
    this.form.get('location.coords.lat')?.setValue(event.lat);
    this.form.get('location.coords.lng')?.setValue(event.lng);
    if (event.address) {
      this.form.get('location.address')?.setValue(event.address, { emitEvent: false });
    }
  }

  loadInitialData() {
    this.attractiveService.getMainCategories().subscribe({
      next: (data) => this.mainCategoriesList.set(data)
    });
    this.attractiveService.getAttractionCategories().subscribe({
      next: (data) => this.attractionCategoriesList.set(data)
    });
    this.attractiveService.getFoods().subscribe({
      next: (data) => this.foodsList.set(data)
    });
  }

  loadAttractive(id: string) {
    this.isLoading.set(true);
    this.attractiveService.getAttractiveById(id).subscribe({
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
    const formData = this.form.value as AttractiveModel;
    try {
      if (this.coverFile()) {
        formData.coverUrl = await this.attractiveService.uploadFile(itemId, this.coverFile()!, 'cover');
      }
      const updatedGallery: string[] = [];
      for (const item of this.galleryPreviews()) {
        if (item.file) {
          const url = await this.attractiveService.uploadFile(itemId, item.file, 'gallery');
          updatedGallery.push(url);
        } else {
          updatedGallery.push(item.url);
        }
      }
      formData.gallery = updatedGallery;
      if (this.isEdit()) {
        await this.attractiveService.updateAttractive(itemId, formData);
      } else {
        await this.attractiveService.createAttractive({ ...formData, id: itemId } as any);
      }
      for (const url of this.urlsToDelete) await this.attractiveService.deleteFileByUrl(url);
      this.router.navigate(['/attractives']);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar' });
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/attractives']);
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
