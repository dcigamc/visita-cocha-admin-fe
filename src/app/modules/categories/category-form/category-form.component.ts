import { Component, inject, signal, input, output, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, CategoryType } from '../services/category.service';
import { CategoryModel } from '../../../core/models/category.model';
import { MessageService } from 'primeng/api';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  standalone: false
})
export class CategoryFormComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);
  private storage = inject(Storage);

  categoryToEdit = input<CategoryModel | null>(null);
  type = input.required<CategoryType>();
  
  onSave = output<void>();
  onCancel = output<void>();

  isLoading = signal(false);
  photoPreview = signal<string | null>(null);
  selectedFile: File | null = null;

  // Lista extensa de iconos de IonIcons (Outline)
  ionIcons = [
    { label: 'Accesibilidad', value: 'accessibility-outline' },
    { label: 'Agregar', value: 'add-circle-outline' },
    { label: 'Avión', value: 'airplane-outline' },
    { label: 'Alarma', value: 'alarm-outline' },
    { label: 'Álbumes', value: 'albums-outline' },
    { label: 'Alerta', value: 'alert-circle-outline' },
    { label: 'Métrica', value: 'analytics-outline' },
    { label: 'Apps', value: 'apps-outline' },
    { label: 'Archivo', value: 'archive-outline' },
    { label: 'Atrás', value: 'arrow-back-outline' },
    { label: 'Arroba', value: 'at-outline' },
    { label: 'Adjunto', value: 'attach-outline' },
    { label: 'Bolsa', value: 'bag-handle-outline' },
    { label: 'Globo', value: 'balloon-outline' },
    { label: 'Prohibido', value: 'ban-outline' },
    { label: 'Venda', value: 'bandage-outline' },
    { label: 'Gráfico Barras', value: 'bar-chart-outline' },
    { label: 'Pesas', value: 'barbell-outline' },
    { label: 'Código Barras', value: 'barcode-outline' },
    { label: 'Béisbol', value: 'baseball-outline' },
    { label: 'Cesta', value: 'basket-outline' },
    { label: 'Básquet', value: 'basketball-outline' },
    { label: 'Batería', value: 'battery-charging-outline' },
    { label: 'Cama', value: 'bed-outline' },
    { label: 'Cerveza', value: 'beer-outline' },
    { label: 'Bicicleta', value: 'bicycle-outline' },
    { label: 'Bluetooth', value: 'bluetooth-outline' },
    { label: 'Bote', value: 'boat-outline' },
    { label: 'Cuerpo', value: 'body-outline' },
    { label: 'Fogata', value: 'bonfire-outline' },
    { label: 'Libro', value: 'book-outline' },
    { label: 'Marcador libro', value: 'bookmark-outline' },
    { label: 'Bolos', value: 'bowling-ball-outline' },
    { label: 'Maletín', value: 'briefcase-outline' },
    { label: 'Pincel', value: 'brush-outline' },
    { label: 'Bug', value: 'bug-outline' },
    { label: 'Construir', value: 'build-outline' },
    { label: 'Foco', value: 'bulb-outline' },
    { label: 'Bus', value: 'bus-outline' },
    { label: 'Negocios', value: 'business-outline' },
    { label: 'Café', value: 'cafe-outline' },
    { label: 'Calculadora', value: 'calculator-outline' },
    { label: 'Calendario', value: 'calendar-outline' },
    { label: 'Llamada', value: 'call-outline' },
    { label: 'Cámara', value: 'camera-outline' },
    { label: 'Auto', value: 'car-outline' },
    { label: 'Auto Deportivo', value: 'car-sport-outline' },
    { label: 'Tarjeta', value: 'card-outline' },
    { label: 'Carrito', value: 'cart-outline' },
    { label: 'Efectivo', value: 'cash-outline' },
    { label: 'Chat', value: 'chatbox-outline' },
    { label: 'Burbuja Chat', value: 'chatbubble-outline' },
    { label: 'Check', value: 'checkbox-outline' },
    { label: 'Portapapeles', value: 'clipboard-outline' },
    { label: 'Cerrar', value: 'close-circle-outline' },
    { label: 'Nube', value: 'cloud-outline' },
    { label: 'Clima', value: 'cloudy-outline' },
    { label: 'Código', value: 'code-outline' },
    { label: 'Ajustes', value: 'cog-outline' },
    { label: 'Paleta Color', value: 'color-palette-outline' },
    { label: 'Brújula', value: 'compass-outline' },
    { label: 'Construcción', value: 'construct-outline' },
    { label: 'Copiar', value: 'copy-outline' },
    { label: 'Crear', value: 'create-outline' },
    { label: 'Recortar', value: 'crop-outline' },
    { label: 'Cubo', value: 'cube-outline' },
    { label: 'Tijeras', value: 'cut-outline' },
    { label: 'Escritorio', value: 'desktop-outline' },
    { label: 'Diamante', value: 'diamond-outline' },
    { label: 'Dados', value: 'dice-outline' },
    { label: 'Disco', value: 'disc-outline' },
    { label: 'Documento', value: 'document-outline' },
    { label: 'Descarga', value: 'download-outline' },
    { label: 'Duplicar', value: 'duplicate-outline' },
    { label: 'Tierra', value: 'earth-outline' },
    { label: 'Caballete', value: 'easel-outline' },
    { label: 'Huevo', value: 'egg-outline' },
    { label: 'Ojo', value: 'eye-outline' },
    { label: 'Comida Rápida', value: 'fast-food-outline' },
    { label: 'Femenino', value: 'female-outline' },
    { label: 'Película', value: 'film-outline' },
    { label: 'Filtro', value: 'filter-outline' },
    { label: 'Huella', value: 'finger-print-outline' },
    { label: 'Pez', value: 'fish-outline' },
    { label: 'Fitness', value: 'fitness-outline' },
    { label: 'Bandera', value: 'flag-outline' },
    { label: 'Fuego', value: 'flame-outline' },
    { label: 'Flash', value: 'flash-outline' },
    { label: 'Flor', value: 'flower-outline' },
    { label: 'Carpeta', value: 'folder-outline' },
    { label: 'Fútbol', value: 'football-outline' },
    { label: 'Consola', value: 'game-controller-outline' },
    { label: 'Regalo', value: 'gift-outline' },
    { label: 'Git', value: 'git-branch-outline' },
    { label: 'Copa', value: 'glass-outline' },
    { label: 'Globo Terraqueo', value: 'globe-outline' },
    { label: 'Golf', value: 'golf-outline' },
    { label: 'Cuadrícula', value: 'grid-outline' },
    { label: 'Martillo', value: 'hammer-outline' },
    { label: 'Mano', value: 'hand-left-outline' },
    { label: 'Feliz', value: 'happy-outline' },
    { label: 'Chip', value: 'hardware-chip-outline' },
    { label: 'Audífonos', value: 'headset-outline' },
    { label: 'Corazón', value: 'heart-outline' },
    { label: 'Ayuda', value: 'help-circle-outline' },
    { label: 'Hogar', value: 'home-outline' },
    { label: 'Reloj Arena', value: 'hourglass-outline' },
    { label: 'Helado', value: 'ice-cream-outline' },
    { label: 'ID', value: 'id-card-outline' },
    { label: 'Imagen', value: 'image-outline' },
    { label: 'Infinito', value: 'infinite-outline' },
    { label: 'Info', value: 'information-circle-outline' },
    { label: 'Diario', value: 'journal-outline' },
    { label: 'Llave', value: 'key-outline' },
    { label: 'Teclado', value: 'keypad-outline' },
    { label: 'Idioma', value: 'language-outline' },
    { label: 'Laptop', value: 'laptop-outline' },
    { label: 'Capas', value: 'layers-outline' },
    { label: 'Hoja', value: 'leaf-outline' },
    { label: 'Librería', value: 'library-outline' },
    { label: 'Enlace', value: 'link-outline' },
    { label: 'Lista', value: 'list-outline' },
    { label: 'Ubicación', value: 'location-outline' },
    { label: 'Candado', value: 'lock-closed-outline' },
    { label: 'Entrar', value: 'log-in-outline' },
    { label: 'Imán', value: 'magnet-outline' },
    { label: 'Correo', value: 'mail-outline' },
    { label: 'Masculino', value: 'male-outline' },
    { label: 'Hombre', value: 'man-outline' },
    { label: 'Mapa', value: 'map-outline' },
    { label: 'Medalla', value: 'medal-outline' },
    { label: 'Médico', value: 'medical-outline' },
    { label: 'Megáfono', value: 'megaphone-outline' },
    { label: 'Menú', value: 'menu-outline' },
    { label: 'Micrófono', value: 'mic-outline' },
    { label: 'Luna', value: 'moon-outline' },
    { label: 'Música', value: 'musical-notes-outline' },
    { label: 'Noticias', value: 'newspaper-outline' },
    { label: 'Notificaciones', value: 'notifications-outline' },
    { label: 'Nutrición', value: 'nutrition-outline' },
    { label: 'Abrir', value: 'open-outline' },
    { label: 'Opciones', value: 'options-outline' },
    { label: 'Avión Papel', value: 'paper-plane-outline' },
    { label: 'Pausa', value: 'pause-outline' },
    { label: 'Huella Animal', value: 'paw-outline' },
    { label: 'Lápiz', value: 'pencil-outline' },
    { label: 'Personas', value: 'people-outline' },
    { label: 'Persona', value: 'person-outline' },
    { label: 'Celular', value: 'phone-portrait-outline' },
    { label: 'Gráfico Torta', value: 'pie-chart-outline' },
    { label: 'Pin', value: 'pin-outline' },
    { label: 'Pinta', value: 'pint-outline' },
    { label: 'Pizza', value: 'pizza-outline' },
    { label: 'Planeta', value: 'planet-outline' },
    { label: 'Reproducir', value: 'play-outline' },
    { label: 'Podio', value: 'podium-outline' },
    { label: 'Etiqueta Precio', value: 'pricetag-outline' },
    { label: 'Imprimir', value: 'print-outline' },
    { label: 'Pulso', value: 'pulse-outline' },
    { label: 'QR', value: 'qr-code-outline' },
    { label: 'Radio', value: 'radio-outline' },
    { label: 'Lluvia', value: 'rainy-outline' },
    { label: 'Recibo', value: 'receipt-outline' },
    { label: 'Refrescar', value: 'refresh-outline' },
    { label: 'Restaurante', value: 'restaurant-outline' },
    { label: 'Cohete', value: 'rocket-outline' },
    { label: 'Rosa', value: 'rose-outline' },
    { label: 'Guardar', value: 'save-outline' },
    { label: 'Escanear', value: 'scan-outline' },
    { label: 'Escuela', value: 'school-outline' },
    { label: 'Buscar', value: 'search-outline' },
    { label: 'Enviar', value: 'send-outline' },
    { label: 'Servidor', value: 'server-outline' },
    { label: 'Compartir', value: 'share-outline' },
    { label: 'Escudo', value: 'shield-outline' },
    { label: 'Camisa', value: 'shirt-outline' },
    { label: 'Calavera', value: 'skull-outline' },
    { label: 'Nieve', value: 'snow-outline' },
    { label: 'Velocímetro', value: 'speedometer-outline' },
    { label: 'Estrella', value: 'star-outline' },
    { label: 'Cronómetro', value: 'stopwatch-outline' },
    { label: 'Tienda fachada', value: 'storefront-outline' },
    { label: 'Sol', value: 'sunny-outline' },
    { label: 'Sincronizar', value: 'sync-outline' },
    { label: 'Tablet', value: 'tablet-portrait-outline' },
    { label: 'Etiqueta', value: 'tag-outline' },
    { label: 'Terminal', value: 'terminal-outline' },
    { label: 'Texto', value: 'text-outline' },
    { label: 'Termómetro', value: 'thermometer-outline' },
    { label: 'Ticket', value: 'ticket-outline' },
    { label: 'Tiempo', value: 'time-outline' },
    { label: 'Hoy', value: 'today-outline' },
    { label: 'Tren', value: 'train-outline' },
    { label: 'Basurero', value: 'trash-outline' },
    { label: 'Trofeo', value: 'trophy-outline' },
    { label: 'TV', value: 'tv-outline' },
    { label: 'Paraguas', value: 'umbrella-outline' },
    { label: 'Video', value: 'videocam-outline' },
    { label: 'Volumen', value: 'volume-high-outline' },
    { label: 'Billetera', value: 'wallet-outline' },
    { label: 'Agua', value: 'water-outline' },
    { label: 'WiFi', value: 'wifi-outline' },
    { label: 'Vino', value: 'wine-outline' },
    { label: 'Mujer', value: 'woman-outline' },
    { label: 'Logo Angular', value: 'logo-angular' },
    { label: 'Logo Apple', value: 'logo-apple' },
    { label: 'Logo Bitcoin', value: 'logo-bitcoin' },
    { label: 'Logo Facebook', value: 'logo-facebook' },
    { label: 'Logo Github', value: 'logo-github' },
    { label: 'Logo Google', value: 'logo-google' },
    { label: 'Logo Instagram', value: 'logo-instagram' },
    { label: 'Logo Node', value: 'logo-nodejs' },
    { label: 'Logo Python', value: 'logo-python' },
    { label: 'Logo React', value: 'logo-react' },
    { label: 'Logo TikTok', value: 'logo-tiktok' },
    { label: 'Logo Twitter', value: 'logo-twitter' },
    { label: 'Logo WhatsApp', value: 'logo-whatsapp' },
    { label: 'Logo YouTube', value: 'logo-youtube' }
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    icon: ['tag-outline'],
    photoUrl: [''],
    available: [true],
    order: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    effect(() => {
      const category = this.categoryToEdit();
      if (category) {
        this.form.patchValue(category);
        this.photoPreview.set(category.photoUrl || null);
      } else {
        this.form.reset({
          available: true,
          icon: 'tag-outline',
          order: 0
        });
        this.photoPreview.set(null);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.photoPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  private async uploadImage(folderName: string, fileName: string): Promise<string> {
    if (!this.selectedFile) return '';
    const storageRef = ref(this.storage, `categories/${this.type()}/${folderName}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, this.selectedFile);
    return getDownloadURL(snapshot.ref);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const category = this.categoryToEdit();
    const formData = this.form.getRawValue();

    try {
      // Generar slug del nombre si es nuevo
      if (!category) {
        formData.slug = formData.name.toLowerCase().trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      // Subir imagen si se seleccionó una
      if (this.selectedFile) {
        const fileName = `${Date.now()}_${this.selectedFile.name}`;
        formData.photoUrl = await this.uploadImage(formData.slug || category?.slug, fileName);
      }

      if (category) {
        await this.categoryService.updateCategory(this.type(), category.id, formData);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría actualizada' });
      } else {
        await this.categoryService.createCategory(this.type(), formData);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría creada' });
      }
      this.onSave.emit();
    } catch (error: any) {
      console.error(error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'Error al guardar' });
    } finally {
      this.isLoading.set(false);
    }
  }

  removePhoto() {
    this.selectedFile = null;
    this.photoPreview.set(null);
    this.form.patchValue({ photoUrl: '' });
  }

  cancel() {
    this.onCancel.emit();
  }
}
