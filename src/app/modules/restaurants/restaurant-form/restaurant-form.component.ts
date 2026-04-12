import { Component, inject, OnInit, signal, computed, ViewChild, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../services/restaurant.service';
import { RestaurantModel } from '../../../core/models/restaurant.model';
import { CategoryModel } from '../../../core/models/category.model';
import { MessageService } from 'primeng/api';
import { CountryISO, SearchCountryField, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { AuthService } from '../../../core/services/auth.service';
import { MapComponent } from '../../../shared/components/map/map.component';

@Component({
  selector: 'app-restaurant-form',
  templateUrl: './restaurant-form.component.html',
  standalone: false
})
export class RestaurantFormComponent implements OnInit {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  private fb = inject(FormBuilder);
  private restaurantService = inject(RestaurantService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // Control de pestañas y mapa
  activeTab = signal('0');
  showMap = signal(false);

  deliveryTypes = [
    { label: 'Yango', value: 'yango' },
    { label: 'PedidosYa', value: 'pedidosya' },
    { label: 'Dinki', value: 'dinki' },
    { label: 'Otro', value: 'other' }
  ];

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
    mainCategories: [[]],
    categories: [[]],
    available: [true],
    schedule: [''],
    rating: [3, [Validators.required]],
    contact: this.fb.group({
      mail: ['', [Validators.email]],
      link: [''],
      phone: ['']
    }),
    coverUrl: ['', [Validators.required]],
    gallery: [[]],
    order: [0],
    historyId: [''],
    accessibility: [''],
    isFeatured: [false],
    location: this.fb.group({
      address: ['', [Validators.required]],
      coords: this.fb.group({
        lng: ['', [Validators.required]],
        lat: ['', [Validators.required]]
      })
    }),
    foods: [[]],
    deliveryUrls: this.fb.array([]),
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
  restaurantCategoriesList = signal<CategoryModel[]>([]);
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
  onlyCountries: CountryISO[] = [
    CountryISO.Bolivia,
    CountryISO.Argentina,
    CountryISO.Brazil,
    CountryISO.Chile,
    CountryISO.Paraguay,
    CountryISO.Peru
  ];

  get deliveryUrls() {
    return this.form.get('deliveryUrls') as FormArray;
  }

  ngOnInit() {
    this.loadInitialData();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.id.set(id);
      this.loadRestaurant(id);
    } else {
      this.id.set(this.restaurantService.generateId());
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

  addDeliveryUrl() {
    this.deliveryUrls.push(this.fb.group({
      type: ['yango'],
      name: [''],
      url: ['', [Validators.pattern(/https?:\/\/.+/)]]
    }));
  }

  removeDeliveryUrl(index: number) {
    this.deliveryUrls.removeAt(index);
  }

  processGoogleMapsUrl(url: string) {
    const coordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(coordsRegex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      this.form.get('location.coords.lat')?.setValue(lat);
      this.form.get('location.coords.lng')?.setValue(lng);

      if (!this.showMap()) {
        this.showMap.set(true);
      }

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
    this.restaurantService.getMainCategories().subscribe({
      next: (data) => this.mainCategoriesList.set(data)
    });
    this.restaurantService.getRestaurantCategories().subscribe({
      next: (data) => this.restaurantCategoriesList.set(data)
    });
    this.restaurantService.getFoods().subscribe({
      next: (data) => this.foodsList.set(data)
    });
  }

  loadRestaurant(id: string) {
    this.isLoading.set(true);
    this.restaurantService.getRestaurantById(id).subscribe({
      next: (data) => {
        if (data) {
          // Limpiar el FormArray antes de parchar
          while (this.deliveryUrls.length !== 0) {
            this.deliveryUrls.removeAt(0);
          }
          
          if (data.deliveryUrls) {
            data.deliveryUrls.forEach(url => {
              this.deliveryUrls.push(this.fb.group({
                type: [url.type, Validators.required],
                name: [url.name, Validators.required],
                url: [url.url, [Validators.required, Validators.pattern(/https?:\/\/.+/)]]
              }));
            });
          }

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
    const formData = this.form.value as RestaurantModel;
    try {
      if (this.coverFile()) {
        formData.coverUrl = await this.restaurantService.uploadFile(itemId, this.coverFile()!, 'cover');
      }
      const updatedGallery: string[] = [];
      for (const item of this.galleryPreviews()) {
        if (item.file) {
          const url = await this.restaurantService.uploadFile(itemId, item.file, 'gallery');
          updatedGallery.push(url);
        } else {
          updatedGallery.push(item.url);
        }
      }
      formData.gallery = updatedGallery;
      if (this.isEdit()) {
        await this.restaurantService.updateRestaurant(itemId, formData);
      } else {
        await this.restaurantService.createRestaurant({ ...formData, id: itemId } as any);
      }
      for (const url of this.urlsToDelete) await this.restaurantService.deleteFileByUrl(url);
      this.router.navigate(['/restaurants']);
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar' });
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/restaurants']);
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
