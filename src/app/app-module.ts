import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getFunctions, provideFunctions, connectFunctionsEmulator } from '@angular/fire/functions';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    providePrimeNG({
        theme: {
            preset: Aura,
            options: {
              darkModeSelector: '.my-app-dark'
            }
        }
    }),
    MessageService,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => {
      // Especificamos la región us-central1 para que coincida con el despliegue
      const functions = getFunctions(undefined, 'us-central1');
      
      // Comenta estas líneas si quieres probar la función real desplegada:
      /*
      if (!environment.production) {
        console.log('--- CONNECTING TO FUNCTIONS EMULATOR (127.0.0.1:5001) ---');
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      }
      */
      return functions;
    })
  ],
  bootstrap: [App]
})
export class AppModule { }
