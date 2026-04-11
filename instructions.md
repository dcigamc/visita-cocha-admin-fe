# 🗺️ Panel Administrativo — Sector Turístico
## Guía de Desarrollo: Angular + Firebase

---

## 1. Visión General del Proyecto

Plataforma administrativa para el sector turístico construida en **Angular** con **Firebase** (Authentication + Firestore). Permite gestionar atractivos turísticos, restaurantes, comidas, eventos y usuarios, con un sistema granular de roles y permisos, y un registro completo de auditoría (logs).

### Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 |
| Autenticación | Firebase Authentication |
| Base de datos | Cloud Firestore |
| Hosting | Firebase Hosting |
| Estilos | Prime Ng + TailwindCSS |
| Estado | NgRx o signals reactivos (Angular Signals) |
| Íconos | Bootstrap Icons |

---

## 2. Estructura del Proyecto Angular

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── role.guard.ts
│   │   │   └── permission.guard.ts
│   │   ├── interceptors/
│   │   │   └── audit-log.interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── firestore.service.ts
│   │   │   ├── log.service.ts
│   │   │   └── permission.service.ts
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── role.model.ts
│   │       ├── permission.model.ts
│   │       └── log.model.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── auth.routes.ts
│   │   ├── dashboard/
│   │   ├── usuarios/
│   │   ├── atractivos/
│   │   ├── restaurantes/
│   │   ├── comidas/
│   │   ├── eventos/
│   │   └── logs/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── data-table/
│   │   │   ├── confirm-dialog/
│   │   │   ├── permission-badge/
│   │   │   └── relation-selector/
│   │   ├── directives/
│   │   │   └── has-permission.directive.ts
│   │   └── pipes/
│   │       └── role-label.pipe.ts
│   ├── app.routes.ts
│   └── app.config.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── firebase.json
```

---

## 3. Estructura de Colecciones en Firestore

### 3.1 Colección: `users`

```typescript
// Modelo: UserModel
{
  uid: string;                    // mismo UID de Firebase Auth
  email: string;                  // mismo email de Firebase Auth
  displayName: string;
  role: 'superadmin' | 'admin' | 'maintainer';
  createdBy: string;              // UID del usuario que lo creó
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  permissions: {
    atractivos:    ModulePermission;
    restaurantes:  ModulePermission;
    comidas:       ModulePermission;
    eventos:       ModulePermission;
    usuarios:      ModulePermission;
    logs:          ModulePermission;
  };
}

// ModulePermission
{
  fullAccess: boolean;           // acceso total al módulo
  actions: {
    create: boolean;
    read:   boolean;
    update: boolean;
    delete: boolean;
  };
  // Si fullAccess=false, se puede restringir a IDs específicos
  allowedIds?: string[];         // IDs de documentos permitidos
}
```

### 3.2 Colección: `attractives` (Atractivos)

<!-- TODO -->

### 3.3 Colección: `restaurants` (Restaurantes)

<!-- TODO -->

### 3.4 Colección: `foods` (Comidas)

<!-- TODO -->

### 3.5 Colección: `events` (Eventos)

<!-- TODO -->

### 3.6 Colección: `logs`

```typescript
{
  id: string;
  userId: string;                // UID del usuario que realizó la acción
  userRole: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHANGE';
  module: 'attractives' | 'restaurants' | 'foods' | 'events' | 'users' | 'logs' | 'auth';
  targetId?: string;             // ID del documento afectado
  targetName?: string;           // Nombre descriptivo del documento
  previousData?: object;         // Snapshot antes del cambio (para UPDATE/DELETE)
  newData?: object;              // Snapshot después del cambio (para CREATE/UPDATE)
  metadata: {
    ip?: string;
    userAgent?: string;
    timestamp: Timestamp;
  };
}
```

---

## 4. Sistema de Roles y Permisos

### 4.1 Jerarquía de Roles

```
SuperAdministrador
    │
    ├── Puede crear: Super Admins, Administradores, Mantenedores
    ├── Puede definir: TODOS los permisos de cualquier usuario
    ├── Acceso completo a todos los módulos
    └── Acceso al módulo de Logs

Administrador
    │
    ├── Puede crear: Solo Mantenedores
    ├── Puede definir: Permisos de Mantenedores que él creó
    ├── Acceso completo a módulos asignados
    └── NO accede al módulo de Logs (a menos que se le otorgue)

Mantenedor
    │
    ├── NO puede crear usuarios
    ├── Acceso limitado según permisos asignados
    └── Solo acciones CRUD que le fueron permitidas
```

### 4.2 Tipos de Acceso por Módulo

```typescript
// Nivel 1: Acceso total al módulo
{ fullAccess: true }

// Nivel 2: Acceso a acciones específicas
{
  fullAccess: false,
  actions: { create: true, read: true, update: false, delete: false }
}

// Nivel 3: Acceso a documentos específicos del módulo
{
  fullAccess: false,
  actions: { read: true, update: true, create: false, delete: false },
  allowedIds: ['doc-id-1', 'doc-id-2']
}
```

### 4.3 Directiva de Permisos

```typescript
// Uso en plantillas:
// <button *hasPermission="'atractivos:create'">Crear Atractivo</button>
// <div *hasPermission="'eventos:delete'">...</div>
// <section *hasRole="['superadmin', 'admin']">...</section>
```

---

## 5. Módulos de la Aplicación

### 5.1 Módulo de Autenticación (`/auth`)

**Componentes:**
- `LoginComponent` — Formulario de login con Firebase Auth (email/password)
- `ForgotPasswordComponent` — Recuperación de contraseña vía Firebase

**Flujo:**
1. Usuario ingresa email/password → Firebase Auth valida credenciales
2. Al autenticar, se consulta Firestore `users/{uid}` para obtener rol y permisos
3. Se almacena el perfil completo en el estado de la app (NgRx/Signal Store)
4. Se registra evento `LOGIN` en colección `logs`
5. Redireccionamiento al Dashboard

**Guards:**
- `AuthGuard` — Verifica sesión activa de Firebase Auth
- `RoleGuard` — Verifica rol mínimo requerido por ruta
- `PermissionGuard` — Verifica permiso específico requerido por ruta

### 5.2 Módulo de Dashboard (`/dashboard`)

**Widgets:**
- Contador de registros por módulo (atractivos, restaurantes, comidas, eventos)
- Últimas acciones del log (últimas 10 entradas)
- Usuarios activos
- Gráfico de actividad reciente (acciones por día)
- Accesos rápidos a módulos con permiso

### 5.3 Módulo de Usuarios (`/usuarios`)

**Solo visible para:** SuperAdmin y Admin (con permiso)

**Componentes:**
- `UsuariosListComponent` — Tabla con filtros por rol, estado, fecha
- `UsuarioFormComponent` — Crear/editar usuario con asignación de rol y permisos
- `UsuarioDetailComponent` — Vista de detalle con historial de acciones (logs)
- `PermissionMatrixComponent` — Matriz visual para asignar permisos por módulo

**Reglas de negocio:**
```
SuperAdmin → puede crear Super Admin, Admin, Mantenedor
Admin      → puede crear solo Mantenedor (y solo ver los que él creó)
Mantenedor → sin acceso a este módulo
```

**Al crear usuario:**
1. Crear cuenta en Firebase Auth con `createUserWithEmailAndPassword`
2. Crear documento en `users/{uid}` con rol, permisos y metadatos
3. Registrar acción `CREATE` en `logs`

### 5.4 Módulo de Atractivos Turísticos (`/atractivos`)

**Componentes:**
- `AtractivosListComponent` — Tabla/grid con filtros (tipo, ciudad, estado)
- `AtractivoFormComponent` — CRUD con mapa (Google Maps / Leaflet), upload de imágenes
- `AtractivoDetailComponent` — Vista detalle con comidas relacionadas

**Relaciones:**
- Se vincula con **Comidas** (campo `foods: string[]`)
- El módulo de Eventos puede referenciar atractivos

**Selector de Relaciones:**
- Componente `RelationSelectorComponent` reutilizable para seleccionar comidas
- Búsqueda y paginación en tiempo real desde Firestore

### 5.5 Módulo de Restaurantes (`/restaurantes`)

**Componentes:**
- `RestaurantesListComponent` — Tabla con filtros (tipo, ciudad, estado)
- `RestauranteFormComponent` — CRUD con mapa, upload de imágenes, redes sociales
- `RestauranteDetailComponent` — Vista detalle con comidas relacionadas

**Relaciones:**
- Se vincula con **Comidas** (campo `foods: string[]`)
- El módulo de Eventos puede referenciar restaurantes

### 5.6 Módulo de Comidas (`/comidas`)

**Componentes:**
- `ComidasListComponent` — Grid visual con filtros (tipo, vegetariana, vegana)
- `ComidaFormComponent` — CRUD con upload de imágenes e ingredientes dinámicos
- `ComidaDetailComponent` — Vista detalle con dónde se encuentra (atractivos/restaurantes)

**Relaciones:**
- Es referenciada por Atractivos y Restaurantes
- El módulo de Eventos puede referenciar comidas
- En la vista de detalle: consulta inversa para mostrar en qué atractivos y restaurantes aparece

### 5.7 Módulo de Eventos (`/eventos`) ⭐ Módulo Central

**Componentes:**
- `EventosListComponent` — Tabla/Calendario con filtros (tipo, fecha, estado)
- `EventoFormComponent` — CRUD con selector múltiple de relaciones
- `EventoDetailComponent` — Vista detalle con todas las relaciones vinculadas

**Relaciones (todas):**
```
Evento → Atractivos   (muchos a muchos)
Evento → Restaurantes (muchos a muchos)
Evento → Comidas      (muchos a muchos)
```

**Selector de Relaciones Múltiples:**
- Tabs para cada tipo de relación (Atractivos | Restaurantes | Comidas | Usuarios)
- Búsqueda en tiempo real con Firestore `collectionGroup` queries
- Vista previa de los elementos seleccionados

### 5.8 Módulo de Logs (`/logs`)

**Solo visible para:** SuperAdmin (y roles con permiso explícito)

**Componentes:**
- `LogsListComponent` — Tabla con filtros avanzados:
  - Por usuario (email, UID)
  - Por módulo
  - Por tipo de acción (CREATE, UPDATE, DELETE, LOGIN…)
  - Por rango de fechas
  - Por documento afectado (targetId)
- `LogDetailComponent` — Diff visual entre `previousData` y `newData`

**Funcionalidad:**
- Exportar logs a CSV/Excel
- Paginación con cursor (Firestore `startAfter`)
- No permite edición ni eliminación (colección inmutable)

---

## 6. Servicios Core

### 6.1 `AuthService`

```typescript
// Métodos principales:
login(email, password): Observable<UserCredential>
logout(): Promise<void>
getCurrentUser(): Observable<UserProfile | null>
createUser(data: CreateUserDto): Promise<void>
sendPasswordReset(email: string): Promise<void>
```

### 6.2 `PermissionService`

```typescript
// Métodos principales:
hasPermission(module: string, action: string): boolean
hasFullAccess(module: string): boolean
isAllowedDocument(module: string, docId: string): boolean
canCreateRole(targetRole: Role): boolean
getUserPermissions(uid: string): Observable<UserPermissions>
updatePermissions(uid: string, permissions: UserPermissions): Promise<void>
```

### 6.3 `LogService`

```typescript
// Métodos principales:
// Se llama automáticamente en cada operación CRUD
logAction(params: {
  action: LogAction;
  module: LogModule;
  targetId?: string;
  targetName?: string;
  previousData?: object;
  newData?: object;
}): Promise<void>

// Se registra automáticamente en login/logout via AuthService
logAuth(action: 'LOGIN' | 'LOGOUT'): Promise<void>
```

### 6.4 `FirestoreService` (genérico)

```typescript
// Servicio base CRUD con logging automático
getAll<T>(collection: string, query?: QueryConstraint[]): Observable<T[]>
getById<T>(collection: string, id: string): Observable<T>
create<T>(collection: string, data: T): Promise<DocumentReference>
update<T>(collection: string, id: string, data: Partial<T>): Promise<void>
delete(collection: string, id: string): Promise<void>
// Internamente llama a LogService en create/update/delete
```

---

## 7. Flujos Críticos

### 7.1 Flujo de Autenticación

```
Usuario → Login Form
    ↓
Firebase Auth (email/password)
    ↓ éxito
Firestore → users/{uid}  ← leer rol y permisos
    ↓
NgRx Store / Signal Store ← almacenar UserProfile completo
    ↓
LogService.logAuth('LOGIN')
    ↓
Router → /dashboard
```

### 7.2 Flujo de Creación de Usuario

```
Admin/SuperAdmin → Formulario de usuario
    ↓
Validar: ¿puede crear ese rol? (canCreateRole)
    ↓ sí
Firebase Auth → createUser(email, tempPassword)
    ↓
Firestore → users/{newUid} ← rol + permisos configurados
    ↓
Email → sendPasswordResetEmail (para que el nuevo usuario cambie su contraseña)
    ↓
LogService.logAction({ action: 'CREATE', module: 'usuarios', ... })
```

### 7.3 Flujo de Cambio de Permisos

```
SuperAdmin/Admin → PermissionMatrix
    ↓
Validar: ¿tiene autoridad sobre ese usuario?
    ↓ sí
Firestore → users/{targetUid} ← actualizar permissions
    ↓
LogService.logAction({
  action: 'PERMISSION_CHANGE',
  module: 'usuarios',
  previousData: oldPermissions,
  newData: newPermissions
})
```

---

## 8. Relaciones entre Módulos

```
┌─────────────┐     comidas[]     ┌──────────┐
│  Atractivos │◄─────────────────►│  Comidas │
└─────────────┘                   └──────────┘
                                       ▲
┌─────────────┐     comidas[]          │
│ Restaurantes│◄───────────────────────┘
└─────────────┘

       ▲                    ▲
       │   relaciones{}     │
       └────────┬───────────┘
                │
         ┌──────▼──────┐
         │   Eventos   │ ◄── Se relaciona con TODOS los módulos
         └──────┬──────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
  ┌─────────┐      ┌──────────┐
  │ Comidas │      │ Usuarios │
  └─────────┘      └──────────┘
```

**Regla de Negocio:**
- **Atractivos** ↔ **Comidas** (bidireccional)
- **Restaurantes** ↔ **Comidas** (bidireccional)
- **Eventos** → **Atractivos**, **Restaurantes**, **Comidas**, **Usuarios** (Eventos es el hub central)
- Atractivos y Restaurantes **NO** se relacionan directamente entre sí (solo a través de Eventos)

---

## 9. Seguridad en Firestore (Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funciones helper
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isSuperAdmin() {
      return isAuthenticated() && getUserData().role == 'superadmin';
    }

    function isAdmin() {
      return isAuthenticated() && getUserData().role in ['superadmin', 'admin'];
    }

    function hasModulePermission(module, action) {
      let user = getUserData();
      return isSuperAdmin() ||
        (user.permissions[module].fullAccess == true) ||
        (user.permissions[module].actions[action] == true);
    }

    // Colección users
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow create: if isAdmin();
      allow update: if isSuperAdmin() ||
        (isAdmin() && resource.data.createdBy == request.auth.uid);
      allow delete: if isSuperAdmin();
    }

    // Colección logs (solo lectura para superadmin, escritura solo para el sistema)
    match /logs/{logId} {
      allow read: if isSuperAdmin() ||
        getUserData().permissions.logs.actions.read == true;
      allow create: if isAuthenticated(); // el servicio escribe logs
      allow update, delete: if false;    // logs son inmutables
    }

    // Módulos de contenido (atractivos, restaurantes, comidas, eventos)
    match /atractivos/{docId} {
      allow read: if isAuthenticated() && hasModulePermission('atractivos', 'read');
      allow create: if hasModulePermission('atractivos', 'create');
      allow update: if hasModulePermission('atractivos', 'update');
      allow delete: if hasModulePermission('atractivos', 'delete');
    }

    match /restaurantes/{docId} {
      allow read: if isAuthenticated() && hasModulePermission('restaurantes', 'read');
      allow create: if hasModulePermission('restaurantes', 'create');
      allow update: if hasModulePermission('restaurantes', 'update');
      allow delete: if hasModulePermission('restaurantes', 'delete');
    }

    match /comidas/{docId} {
      allow read: if isAuthenticated() && hasModulePermission('comidas', 'read');
      allow create: if hasModulePermission('comidas', 'create');
      allow update: if hasModulePermission('comidas', 'update');
      allow delete: if hasModulePermission('comidas', 'delete');
    }

    match /eventos/{docId} {
      allow read: if isAuthenticated() && hasModulePermission('eventos', 'read');
      allow create: if hasModulePermission('eventos', 'create');
      allow update: if hasModulePermission('eventos', 'update');
      allow delete: if hasModulePermission('eventos', 'delete');
    }
  }
}
```

---

## 10. Configuración de Rutas Angular

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes')
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard.component')
      },
      {
        path: 'users',
        loadChildren: () => import('./modules/users/users.routes'),
        canActivate: [PermissionGuard],
        data: { module: 'users', action: 'read' }
      },
      {
        path: 'attractives',
        loadChildren: () => import('./modules/attractives/attractives.routes'),
        canActivate: [PermissionGuard],
        data: { module: 'attractives', action: 'read' }
      },
      {
        path: 'restaurants',
        loadChildren: () => import('./modules/restaurants/restaurants.routes'),
        canActivate: [PermissionGuard],
        data: { module: 'restaurants', action: 'read' }
      },
      {
        path: 'foods',
        loadChildren: () => import('./modules/foods/foods.routes'),
        canActivate: [PermissionGuard],
        data: { module: 'foods', action: 'read' }
      },
      {
        path: 'events',
        loadChildren: () => import('./modules/events/events.routes'),
        canActivate: [PermissionGuard],
        data: { module: 'events', action: 'read' }
      },
      {
        path: 'logs',
        loadChildren: () => import('./modules/logs/logs.routes'),
        canActivate: [RoleGuard],
        data: { allowedRoles: ['superadmin'], module: 'logs' }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/auth/login' }
];
```

---

## 11. Convenciones de Desarrollo

### Nombres de Colecciones Firestore
- Siempre en **minúsculas, plural y en ingles**: `users`, `atrractives`, `restaurants`, `foods`, `events`, `logs`

### Nombres de Componentes Angular
- Patrón: `[Módulo][Función]Component` → `AtractivoFormComponent`, `EventoDetailComponent`

### Observables y Signals
- Usar **Angular Signals** para estado local de componentes
- Usar **RxJS Observables** para streams de Firestore (con `toSignal()` en componentes)
- Evitar subscriptions manuales; preferir `async pipe` o `toSignal()`

### Manejo de Errores
- Todos los errores de Firestore y Auth deben capturarse y mostrarse con `SnackBar`
- Errores de permisos denegados deben redirigir a `/unauthorized` con mensaje claro

### Logging Automático
- Todo servicio que modifique datos (create/update/delete) debe llamar a `LogService.logAction()`
- Nunca omitir el log de permisos: cualquier cambio en `users.permissions` debe ser `PERMISSION_CHANGE`

---

## 12. UI/UX — Lineamientos de Diseño

### Layout General
- Sidebar colapsable con íconos + etiquetas de módulos
- Header con nombre de usuario, rol badge, y botón de logout
- Breadcrumbs en cada módulo
- Responsive: sidebar se convierte en bottom nav en mobile

### Menú Lateral — Visibilidad por Rol
```
SuperAdmin: Dashboard | Atractivos | Restaurantes | Comidas | Eventos | Usuarios | Logs
Admin:      Dashboard | Atractivos | Restaurantes | Comidas | Eventos | Usuarios
Mantenedor: Dashboard | [solo módulos con permisos asignados]
```

### Tablas de Datos
- Paginación con Firestore cursors (`startAfter`, `limit`)
- Filtros persistentes en URL (queryParams)
- Columna de acciones condicional según permisos (`*hasPermission`)
- Confirmación de eliminación siempre con `ConfirmDialogComponent`

### Formularios
- Validación reactiva con `ReactiveFormsModule`
- Feedback de guardado con loading state en botón
- Upload de imágenes con preview inmediato (Firebase Storage)
- Campos de coordenadas con mapa interactivo

### Matriz de Permisos (para admins)
- Tabla visual con módulos como filas y acciones (C/R/U/D) como columnas
- Toggle `Acceso completo` que deshabilita los controles individuales
- Selector de IDs específicos cuando `fullAccess = false`

---

## 13. Inicialización del Proyecto

```bash
# Crear proyecto Angular
ng new dci-vc-admin --routing --style=scss --standalone

# Instalar dependencias Firebase
npm install firebase @angular/fire

# Instalar Prime ng y configs (app.config)
npm install primeng @primeuix/themes
import { ApplicationConfig } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
    providers: [
        providePrimeNG({
            theme: {
                preset: Aura
            }
        })
    ]
};

# Instalar dependencias adicionales
npm install @ngrx/signals rxjs

# Configurar AngularFire en app.config.ts
# Agregar provideFirebaseApp, provideAuth, provideFirestore

# Inicializar Firebase CLI
firebase login
firebase init   # seleccionar: Firestore, Hosting, Storage
```

---

## 14. Checklist de Implementación

### Fase 1 — Base
- [ ] Configurar Firebase proyecto y variables de entorno
- [ ] Implementar `AuthService` con login/logout
- [ ] Crear `AuthGuard` y ruta de login
- [ ] Crear modelo `UserProfile` con tipos de rol y permisos
- [ ] Implementar `PermissionService`
- [ ] Crear directiva `*hasPermission`

### Fase 2 — Módulos de Contenido
- [ ] Módulo Atractivos (CRUD + relación comidas)
- [ ] Módulo Restaurantes (CRUD + relación comidas)
- [ ] Módulo Comidas (CRUD + vista de relaciones inversas)
- [ ] Módulo Eventos (CRUD + selector de todas las relaciones)

### Fase 3 — Gestión de Usuarios
- [ ] Módulo Usuarios con listado y filtros por rol
- [ ] Formulario de creación con asignación de rol
- [ ] `PermissionMatrixComponent` para asignación granular
- [ ] Validaciones de jerarquía (admin solo crea mantenedores)

### Fase 4 — Logs y Auditoría
- [ ] `LogService` integrado en todos los servicios CRUD
- [ ] Log de login/logout en `AuthService`
- [ ] Log de cambios de permisos
- [ ] Módulo Logs con filtros avanzados y diff viewer

### Fase 5 — Pulido
- [ ] Firestore Security Rules completas y testeadas
- [ ] Manejo de errores global
- [ ] Estados de carga (skeleton loaders)
- [ ] Diseño responsive
- [ ] Pruebas de permisos por cada rol