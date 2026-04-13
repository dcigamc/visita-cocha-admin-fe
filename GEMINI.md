# 🗺️ Panel Administrativo — Sector Turístico

## Guía de Desarrollo: Angular + Firebase

---

## 1. Visión General del Proyecto

Plataforma administrativa para el sector turístico construida en **Angular 21** con **Firebase** (Authentication + Firestore). Permite gestionar atractivos turísticos, restaurantes, comidas, eventos y usuarios, con un sistema granular de roles y permisos, y un registro completo de auditoría (logs).

### Stack Tecnológico Actualizado

| Capa          | Tecnología                 |
| ------------- | -------------------------- |
| Frontend      | Angular 21 (Zoneless)      |
| Autenticación | Firebase Authentication    |
| Base de datos | Cloud Firestore            |
| Hosting       | Firebase Hosting           |
| Estilos       | PrimeNG 21 + TailwindCSS 3 |
| Estado        | Angular Signals            |
| Iconos        | PrimeIcons                 |

---

## 2. Estructura del Proyecto (English)

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── permission.guard.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── firestore.service.ts
│   │   │   ├── log.service.ts
│   │   │   └── permission.service.ts
│   │   └── models/
│   │       └── user.model.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── attractives/
│   │   ├── restaurants/
│   │   ├── foods/
│   │   ├── events/
│   │   └── logs/
│   ├── shared/
│   │   ├── shared.module.ts
│   │   ├── components/
│   │   ├── directives/
│   │   │   └── has-permission.directive.ts
│   │   └── pipes/
│   ├── app.routes.ts
│   └── app.module.ts
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
  uid: string; // mismo UID de Firebase Auth
  email: string; // mismo email de Firebase Auth
  displayName: string;
  role: 'superadmin' | 'admin' | 'maintainer';
  createdBy: string; // UID del usuario que lo creó
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  permissions: {
    attractives: ModulePermission;
    restaurants: ModulePermission;
    foods: ModulePermission;
    events: ModulePermission;
    users: ModulePermission;
    logs: ModulePermission;
  }
}
```

```typescript
// Modelo: events
{
    "id": "",
    "available": true,
    "isFeatured": true,
    "description": "",
    "order": 20,
    "title": "",
    "coverUrl": "",
    "gallery": ["", ""],
    "color": "", // green, yellow,blue, red, black-lighten
    "date": "", // timestamp
    "foods": ["", ""],
    "restaurants": ["", ""],
    "attractions": ["", ""],
}
```

---

## 14. Checklist de Implementación

### Fase 1 — Base & Auth (COMPLETADA ✅)

- [x] Configurar Firebase proyecto y variables de entorno
- [x] Implementar `AuthService` con login/logout (Signals)
- [x] Crear `AuthGuard` y ruta de login
- [x] Crear modelo `UserProfile` con tipos de rol y permisos
- [x] Implementar `PermissionService`
- [x] Crear directiva `*hasPermission`
- [x] Implementar Módulo de Auth (Login UI)
- [x] **Diseñar e implementar Main Layout (Sidebar + Topbar)**

### Fase 2 — Módulos de Contenido (EN PROCESO 🔄)

- [x] Módulo Attractives (CRUD + relación foods)
- [x] Módulo Restaurants (CRUD + relación foods)
- [x] Módulo Foods (CRUD + vista de relaciones inversas)
- [x] Módulo Events (CRUD + selector de todas las relaciones)

### Fase 3 — Gestión de Usuarios

- [ ] Módulo Users con listado y filtros por rol
- [ ] Formulario de creación con asignación de rol
- [ ] `PermissionMatrixComponent` para asignación granular

### Fase 4 — Logs y Auditoría (COMPLETADA ✅)

- [x] `LogService` integrado en todos los servicios CRUD.
- [x] Implementación de `getLogs()` con filtrado de seguridad por rol (Superadmin ve todo, Admin/Maintainer solo lo propio).
- [x] Módulo de visualización con tabla PrimeNG y visor de detalles JSON (Anterior vs Nuevo).
- [x] Resolución de dependencia circular usando funciones nativas de Firestore.

### Fase 5 — Pulido

- [ ] Firestore Security Rules completas
- [ ] Diseño responsive y estados de carga
