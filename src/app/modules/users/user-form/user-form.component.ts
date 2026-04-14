import { Component, inject, OnInit, signal, input, output, effect, computed, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { UserService } from '../services/user.service';
import { UserModel, Role, UserPermissions, ModulePermission } from '../../../core/models/user.model';
import { MessageService } from 'primeng/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AttractiveService } from '../../attractives/services/attractive.service';
import { RestaurantService } from '../../restaurants/services/restaurant.service';
import { FoodService } from '../../foods/services/food.service';
import { EventService } from '../../events/services/event.service';
import { CategoryService, CategoryType } from '../../categories/services/category.service';

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
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);

  // Inputs/Outputs for modal integration
  userToEdit = input<UserModel | null>(null);
  onSave = output<void>();
  onCancel = output<void>();

  isLoading = signal(false);

  modules: (keyof UserPermissions)[] = [
    'attractives', 'restaurants', 'foods', 'events', 'users', 'logs', 'categories'
  ];

  moduleLabels: Record<keyof UserPermissions, string> = {
    attractives: 'Atractivos',
    restaurants: 'Restaurantes',
    foods: 'Comidas',
    events: 'Eventos',
    users: 'Usuarios',
    logs: 'Logs',
    categories: 'Categorías'
  };

  form: FormGroup = this.fb.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]], // Campo solo para creación
    role: ['maintainer' as Role, [Validators.required]],
    isActive: [true],
    permissions: this.fb.group(this.createPermissionsGroup())
  });

  // Signal reactivo para el rol seleccionado en el formulario
  private roleValue = toSignal(
    this.form.get('role')!.valueChanges.pipe(
      startWith(this.form.get('role')?.value)
    )
  );
  
  // Lists for allowedIds selection
  resources: Record<string, WritableSignal<any[]>> = {
    attractives: signal([]),
    restaurants: signal([]),
    foods: signal([]),
    events: signal([]),
    categories: signal([])
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

  // Módulos que el usuario actual puede ver/gestionar en la matriz de permisos
  visibleModules = computed(() => {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return [];
    
    const selectedRole = this.roleValue(); // Usamos el Signal reactivo

    let availableModules = this.modules;
    
    // Si el rol seleccionado es Mantenedor, ocultamos categorías (regla de negocio)
    if (selectedRole === 'maintainer') {
      availableModules = availableModules.filter(m => m !== 'categories');
    }

    if (currentUser.role === 'superadmin') return availableModules;

    // Solo mostrar módulos donde el usuario tiene al menos permiso de lectura
    return availableModules.filter(mod => {
      const perm = currentUser.permissions?.[mod];
      return perm && (perm.fullAccess || perm.actions.read);
    });
  });

  /**
   * Verifica si el usuario actual puede otorgar una acción específica en un módulo.
   */
  canGrantAction(module: keyof UserPermissions, action: 'create' | 'read' | 'update' | 'delete'): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;

    const modPerm = currentUser.permissions?.[module];
    if (!modPerm) return false;

    // Solo puede otorgar la acción si él mismo la tiene
    return modPerm.fullAccess || modPerm.actions[action];
  }

  /**
   * Verifica si el usuario actual puede otorgar acceso total a un módulo.
   */
  canGrantFullAccess(module: keyof UserPermissions): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;

    return currentUser.permissions?.[module]?.fullAccess || false;
  }

  constructor() {
    effect(() => {
      const user = this.userToEdit();
      if (user) {
        this.form.patchValue(user);
        this.form.get('email')?.disable();
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
      } else {
        this.form.reset({
          isActive: true,
          role: 'maintainer',
          permissions: this.getDefaultPermissions()
        });
        this.form.get('email')?.enable();
        this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.form.get('password')?.updateValueAndValidity();
      }
    });

    // Escuchar cambios en el rol para limpiar permisos prohibidos si es necesario
    this.form.get('role')?.valueChanges.subscribe(role => {
      if (role === 'maintainer') {
        // Si cambia a mantenedor, reseteamos categorías a falso/vacío por seguridad
        const catGroup = this.form.get('permissions.categories') as FormGroup;
        if (catGroup) {
          catGroup.patchValue({
            fullAccess: false,
            allowedIds: [],
            actions: { create: false, read: false, update: false, delete: false }
          });
        }
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

    // Cargar categorías de las colecciones correspondientes
    const allCats: any[] = [];
    const categoryCollections: CategoryType[] = [
      'main-categories', 
      'attraction-categories', 
      'restaurant-categories', 
      'event-categories', 
      'hotel-categories'
    ];

    categoryCollections.forEach((type) => {
      this.categoryService.getCategories(type).subscribe(data => {
        const prefix = type.split('-')[0];
        const labeled = data.map(c => ({ ...c, name: `(${prefix}) ${c.name}` }));
        // Combinamos y evitamos duplicados por ID si los hubiera
        labeled.forEach(cat => {
          if (!allCats.find(existing => existing.id === cat.id)) {
            allCats.push(cat);
          }
        });
        this.resources['categories'].set([...allCats]);
      });
    });
  }

  isSuperAdmin = computed(() => this.authService.currentUser()?.role === 'superadmin');

  private createPermissionsGroup() {
    const group: any = {};
    this.modules.forEach(mod => {
      const isLogs = mod === 'logs';
      group[mod] = this.fb.group({
        fullAccess: [isLogs],
        allowedIds: [[]],
        actions: this.fb.group({
          create: [isLogs],
          read: [isLogs],
          update: [isLogs],
          delete: [isLogs]
        })
      });
    });
    return group;
  }

  private getDefaultPermissions(): UserPermissions {
    const perms: any = {};
    this.modules.forEach(mod => {
      const isLogs = mod === 'logs';
      perms[mod] = {
        fullAccess: isLogs,
        allowedIds: [],
        actions: { 
          create: isLogs, 
          read: isLogs, 
          update: isLogs, 
          delete: isLogs 
        }
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
        await this.userService.createUser(formData);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente' });
      }
      this.onSave.emit();
    } catch (error: any) {
      console.error(error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo procesar la solicitud' });
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
    return ['attractives', 'restaurants', 'foods', 'events', 'categories'].includes(mod);
  }
}
