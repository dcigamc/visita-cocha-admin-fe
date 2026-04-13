import { Component, inject, OnInit, signal, input, output, effect, computed, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { UserService } from '../services/user.service';
import { UserModel, Role, UserPermissions, ModulePermission } from '../../../core/models/user.model';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { AttractiveService } from '../../attractives/services/attractive.service';
import { RestaurantService } from '../../restaurants/services/restaurant.service';
import { FoodService } from '../../foods/services/food.service';
import { EventService } from '../../events/services/event.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  standalone: false
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private attractiveService = inject(AttractiveService);
  private restaurantService = inject(RestaurantService);
  private foodService = inject(FoodService);
  private eventService = inject(EventService);
  private messageService = inject(MessageService);

  // Inputs/Outputs for modal integration
  userToEdit = input<UserModel | null>(null);
  onSave = output<void>();
  onCancel = output<void>();

  isLoading = signal(false);
  
  // Lists for allowedIds selection
  resources: Record<string, WritableSignal<any[]>> = {
    attractives: signal([]),
    restaurants: signal([]),
    foods: signal([]),
    events: signal([])
  };

  roles = computed(() => {
    const currentUser = this.authService.currentUser();
    const allRoles = [
      { label: 'Super Administrador', value: 'superadmin' },
      { label: 'Administrador', value: 'admin' },
      { label: 'Mantenimiento', value: 'maintainer' }
    ];

    if (currentUser?.role === 'superadmin') {
      return allRoles;
    }

    if (currentUser?.role === 'admin') {
      return allRoles.filter(r => r.value === 'maintainer');
    }

    return [];
  });

  modules: (keyof UserPermissions)[] = [
    'attractives', 'restaurants', 'foods', 'events', 'users', 'logs'
  ];

  moduleLabels: Record<keyof UserPermissions, string> = {
    attractives: 'Atractivos',
    restaurants: 'Restaurantes',
    foods: 'Comidas',
    events: 'Eventos',
    users: 'Usuarios',
    logs: 'Logs'
  };

  form: FormGroup = this.fb.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    role: ['maintainer' as Role, [Validators.required]],
    isActive: [true],
    permissions: this.fb.group(this.createPermissionsGroup())
  });

  constructor() {
    effect(() => {
      const user = this.userToEdit();
      if (user) {
        this.form.patchValue(user);
        this.form.get('email')?.disable();
      } else {
        this.form.reset({
          isActive: true,
          role: 'maintainer',
          permissions: this.getDefaultPermissions()
        });
        this.form.get('email')?.enable();
      }
    });
  }

  ngOnInit() {
    this.loadResources();
  }

  private loadResources() {
    this.attractiveService.getAttractives().subscribe(data => this.resources['attractives'].set(data));
    this.restaurantService.getRestaurants().subscribe(data => this.resources['restaurants'].set(data));
    this.foodService.getFoods().subscribe(data => this.resources['foods'].set(data));
    this.eventService.getEvents().subscribe(data => this.resources['events'].set(data));
  }

  private createPermissionsGroup() {
    const group: any = {};
    this.modules.forEach(mod => {
      const isResourceModule = ['attractives', 'restaurants', 'foods', 'events'].includes(mod);
      group[mod] = this.fb.group({
        fullAccess: [false],
        allowedIds: [[]],
        actions: this.fb.group({
          create: [false],
          read: [true],
          update: [false],
          delete: [false]
        })
      });
    });
    return group;
  }

  private getDefaultPermissions(): UserPermissions {
    const perms: any = {};
    this.modules.forEach(mod => {
      perms[mod] = {
        fullAccess: false,
        allowedIds: [],
        actions: { create: false, read: true, update: false, delete: false }
      };
    });
    return perms as UserPermissions;
  }

  async onSubmit() {
    if (this.form.invalid) return;
    
    this.isLoading.set(true);
    const user = this.userToEdit();
    const formData = this.form.getRawValue();

    try {
      if (user) {
        await this.userService.updateUser(user.uid, formData, formData.displayName);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil y permisos actualizados' });
      } else {
        this.messageService.add({ severity: 'warn', summary: 'Info', detail: 'La creación de usuarios requiere Firebase Admin SDK' });
      }
      this.onSave.emit();
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar la solicitud' });
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.onCancel.emit();
  }

  toggleFullAccess(moduleName: string) {
    const moduleGroup = this.form.get(`permissions.${moduleName}`) as FormGroup;
    const isFullAccess = moduleGroup.get('fullAccess')?.value;
    
    if (isFullAccess) {
      moduleGroup.get('actions')?.patchValue({
        create: true, read: true, update: true, delete: true
      });
      moduleGroup.get('allowedIds')?.setValue([]); // Si tiene acceso total, vaciamos los IDs específicos
    }
  }

  hasResourceSelection(mod: string): boolean {
    return ['attractives', 'restaurants', 'foods', 'events'].includes(mod);
  }
}
