import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, inject } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  template: `
    <div #mapContainer class="map-container rounded-xl border border-slate-200 shadow-sm overflow-hidden" [style.height]="height"></div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: 100%;
      min-height: inherit;
      z-index: 1;
      background-color: #e5e7eb;
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class MapComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() height: string = '350px';
  @Input() zoom: number = 15;
  @Input() interactive: boolean = true;

  @Output() locationChange = new EventEmitter<{lat: number, lng: number, address?: string}>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private zone = inject(NgZone);

  private defaultLat = -17.3935;
  private defaultLng = -66.1570;

  ngOnInit() {}

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.initMap();
    });
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && (changes['lat'] || changes['lng'])) {
      // Si el cambio viene de afuera (input), actualizamos marcador y vista
      if (!changes['lat'].firstChange || !changes['lng'].firstChange) {
        this.updateMarker();
        this.map.panTo([Number(this.lat), Number(this.lng)]);
      }
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.map) this.map.remove();
  }

  private initMap() {
    const initialLat = Number(this.lat) || this.defaultLat;
    const initialLng = Number(this.lng) || this.defaultLng;

    this.map = L.map(this.mapContainer.nativeElement).setView([initialLat, initialLng], this.zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateMarker();

    if (this.interactive) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.zone.run(() => {
          const { lat, lng } = e.latlng;
          this.reverseGeocode(lat, lng);
        });
      });
    }

    setTimeout(() => this.refresh(), 500);
  }

  /**
   * Obtiene el nombre de la vía (calle, avenida, etc.) a partir de coordenadas.
   */
  public async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();

      // Extraemos solo lo relevante (calle, avenida, etc.)
      const addr = data.address;
      const roadName = addr.road || addr.pedestrian || addr.cycleway || addr.footway || addr.path || addr.suburb || 'Ubicación seleccionada';

      this.setLocation(lat, lng, roadName);
    } catch (error) {
      console.warn('Error fetching address:', error);
      this.setLocation(lat, lng);
    }
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.runOutsideAngular(() => this.refresh());
    });
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  public refresh() {
    if (this.map) {
      this.map.invalidateSize();
      const currentLat = Number(this.lat) || this.defaultLat;
      const currentLng = Number(this.lng) || this.defaultLng;
      this.map.panTo([currentLat, currentLng]);
    }
  }

  private updateMarker() {
    if (!this.map) return;
    const lat = Number(this.lat) || this.defaultLat;
    const lng = Number(this.lng) || this.defaultLng;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });
      this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
    }
  }

  private setLocation(lat: number, lng: number, address?: string) {
    this.lat = lat;
    this.lng = lng;
    this.updateMarker();
    this.locationChange.emit({ lat, lng, address });
  }
}
