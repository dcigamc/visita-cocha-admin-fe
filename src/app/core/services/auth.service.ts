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
  docData,
  DocumentReference
} from '@angular/fire/firestore';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserModel } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Observable del estado de autenticación de Firebase
  private authUser$ = authState(this.auth);

  // Signal que combina el usuario de Auth con sus datos en Firestore
  // Usamos catchError para evitar que el stream se rompa
  public currentUser = toSignal(
    this.authUser$.pipe(
      switchMap((user: User | null) => {
        if (!user) return of(null);
        
        // Creamos la referencia explícitamente
        const userDocRef = doc(this.firestore, 'users', user.uid) as DocumentReference<UserModel>;
        
        // Intentamos obtener los datos del documento
        return docData(userDocRef).pipe(
          catchError(err => {
            console.error('Error fetching user data from Firestore:', err);
            return of(null);
          })
        );
      })
    ),
    { initialValue: null }
  );

  // Computed signals para facilitar comprobaciones rápidas
  public isAuthenticated = computed(() => !!this.currentUser());
  public userRole = computed(() => this.currentUser()?.role || null);

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
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser();
  }
}
