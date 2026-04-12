import { Injectable, inject, computed } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut,
  User
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  DocumentReference,
  onSnapshot
} from '@angular/fire/firestore';
import { Observable, of, switchMap, catchError, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Observable del estado de autenticación de Firebase
  private authUser$ = authState(this.auth);

  /**
   * Signal que combina el usuario de Auth con sus datos en Firestore.
   * - undefined: Cargando el estado inicial o el documento.
   * - null: No autenticado o documento no existe.
   * - UserModel: Usuario autenticado con perfil completo.
   */
  public currentUser = toSignal<UserModel | null | undefined>(
    this.authUser$.pipe(
      switchMap((user: User | null) => {
        if (!user) return of(null);

        const userDocRef = doc(this.firestore, 'users', user.uid) as DocumentReference<UserModel>;

        // Usamos onSnapshot directamente envuelto en un Observable para mayor estabilidad
        return new Observable<UserModel | null>(subscriber => {
          const unsubscribe = onSnapshot(
            userDocRef,
            (snapshot) => {
              const data = snapshot.data();
              if (data) {
                subscriber.next({ ...data, uid: snapshot.id } as UserModel);
              } else {
                console.warn('DEBUG: No user profile found for UID:', user.uid);
                subscriber.next(null);
              }
            },
            (error) => {
              console.error('Error fetching user data from Firestore:', error);
              subscriber.next(null);
            }
          );
          return () => unsubscribe();
        }).pipe(
          startWith(undefined)
        );
      })
    ),
    { initialValue: undefined }
  );

  // Computed signals para facilitar comprobaciones rápidas
  public isAuthenticated = computed(() => !!this.currentUser());
  public isLoading = computed(() => this.currentUser() === undefined);
  public userRole = computed(() => (this.currentUser() as UserModel)?.role || null);

  constructor() {}

  async login(email: string, pass: string) {
    try {
      return await signInWithEmailAndPassword(this.auth, email, pass);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser();
  }
}
