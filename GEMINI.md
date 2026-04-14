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

### Fase 2 — Módulos de Contenido (COMPLETADA ✅)

- [x] Módulo Attractives (CRUD + relación foods)
- [x] Módulo Restaurants (CRUD + relación foods)
- [x] Módulo Foods (CRUD + vista de relaciones inversas)
- [x] Módulo Events (CRUD + selector de todas las relaciones)

### Fase 3 — Gestión de Usuarios (COMPLETADA ✅)

- [x] Módulo Users con listado y filtros jerárquicos por rol (Admin solo ve Maintainers).
- [x] Edición de usuarios vía modal con actualización completa de perfil.
- [x] **Matriz de Permisos Granulares**: Configuración por módulo y por acciones (CRUD).
- [x] **Control de Acceso por Documento**: Implementación de `allowedIds` para restringir el acceso a registros específicos en Atractivos, Restaurantes, Comidas y Eventos.
- [x] Filtrado automático en servicios basado en los permisos del usuario logueado.

### Fase 4 — Logs y Auditoría (COMPLETADA ✅)

- [x] `LogService` integrado en todos los servicios CRUD.
- [x] Implementación de `getLogs()` con filtrado de seguridad por rol (Superadmin ve todo, Admin/Maintainer solo lo propio).
- [x] Módulo de visualización con tabla PrimeNG y visor de detalles JSON (Anterior vs Nuevo).
- [x] Resolución de dependencia circular usando funciones nativas de Firestore.

### Fase 5 — Pulido y Seguridad Reforzada (EN PROCESO 🔄)

- [x] **Seguridad en Capa de Servicios**: Validación interna de `allowedIds` en todos los métodos `update` y `delete`.
- [x] **PermissionGuard Avanzado**: Validación automática de IDs en URL para prevenir accesos manuales no autorizados.
- [x] **Rediseño de Matriz de Permisos**: Interfaz más clara con etiquetas debajo de checkboxes y permisos por defecto en `false`.
- [x] **Control de Acciones vs Visibilidad**: `fullAccess` ahora solo controla si se ven todos los documentos, mientras que `actions` rige la capacidad de Crear/Editar/Borrar.
- [x] **Protección de Campos Sensibles**: El switch `isFeatured` (Destacado) y campos técnicos (`slug`, `order`) ahora solo son editables por Administradores.
- [x] **Inmutabilidad de Logs**: Módulo de logs configurado como lectura/todo por defecto y solo modificable por el Super Administrador.
- [x] **Sidebar Dinámico**: El menú lateral ahora se adapta en tiempo real a los permisos de lectura del usuario logueado.
- [x] **Corrección de Navegación en Tablas**: Implementación de paso de objeto completo en funciones `edit()` para evitar errores de referencia al filtrar/buscar en PrimeNG.
- [x] **Optimización de FirestoreService**: Sanitización automática del campo `id` para evitar contaminación de datos y soporte para `setDoc` en creaciones con ID predefinido.
- [ ] Firestore & Storage Security Rules finales (Diseñadas, actualmente en pausa por depuración).
- [ ] Diseño responsive final y estados de carga globales.
