import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, forkJoin, of } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';

interface AnalyticsSummary {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private functions = inject(Functions);
  
  user = this.authService.currentUser;

  // Analytics Signals
  analyticsData = signal<AnalyticsSummary | null>(null);
  isAnalyticsLoading = signal(false);

  // Stats Signals
  attractivesCount = toSignal(this.firestoreService.getAll('attractions').pipe(map(list => list.length)));
  restaurantsCount = toSignal(this.firestoreService.getAll('restaurants').pipe(map(list => list.length)));
  foodsCount = toSignal(this.firestoreService.getAll('foods').pipe(map(list => list.length)));
  eventsCount = toSignal(this.firestoreService.getAll('announcements').pipe(map(list => list.length)));
  usersCount = toSignal(this.firestoreService.getAll('users').pipe(map(list => list.length)));
  
  // Categories Count (Only main-categories)
  categoriesCount = toSignal(
    this.firestoreService.getAll('main-categories').pipe(
      map(list => list.length)
    )
  );

  ngOnInit() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    this.isAnalyticsLoading.set(true);
    try {
      const getSummary = httpsCallable<any, AnalyticsSummary>(this.functions, 'getAnalyticsSummary');
      const result = await getSummary();
      this.analyticsData.set(result.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      this.isAnalyticsLoading.set(false);
    }
  }

  // Chart Data
  chartData = computed(() => {
    const labels = ['Atractivos', 'Restaurantes', 'Comidas', 'Eventos'];
    const data = [
      this.attractivesCount() || 0,
      this.restaurantsCount() || 0,
      this.foodsCount() || 0,
      this.eventsCount() || 0
    ];

    return {
      labels: labels,
      datasets: [
        {
          label: 'Distribución de Contenido',
          data: data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgb(54, 162, 235)',
            'rgb(255, 159, 64)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)'
          ],
          borderWidth: 1
        }
      ]
    };
  });

  chartOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  pieData = computed(() => {
    return {
      labels: ['Atractivos', 'Restaurantes', 'Comidas', 'Eventos'],
      datasets: [
        {
          data: [
            this.attractivesCount() || 0,
            this.restaurantsCount() || 0,
            this.foodsCount() || 0,
            this.eventsCount() || 0
          ],
          backgroundColor: [
            '#3b82f6',
            '#f97316',
            '#10b981',
            '#a855f7'
          ]
        }
      ]
    };
  });

  pieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };
}
