import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Sistema de Geração de Horários</h1>
          <div class="user-info">
            <span>Olá, {{ currentUser?.nome }}</span>
            <button class="btn-logout" (click)="logout()">Sair</button>
          </div>
        </div>
      </header>

      <!-- Sidebar -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <i class="icon">🏠</i>
            <span>Dashboard</span>
          </a>
          
          <a routerLink="/preferencias" routerLinkActive="active" class="nav-item">
            <i class="icon">⚙️</i>
            <span>Minhas Preferências</span>
          </a>
          
          <a routerLink="/horarios" routerLinkActive="active" class="nav-item">
            <i class="icon">📅</i>
            <span>Meus Horários</span>
          </a>
          
          <a routerLink="/gerar-horario" routerLinkActive="active" class="nav-item">
            <i class="icon">✨</i>
            <span>Gerar Horário</span>
          </a>

          <div class="nav-divider" *ngIf="currentUser?.tipo === 'admin'"></div>
          
          <div *ngIf="currentUser?.tipo === 'admin'" class="nav-section">
            <h3>Administração</h3>
            <a routerLink="/admin/disciplinas" routerLinkActive="active" class="nav-item">
              <i class="icon">📚</i>
              <span>Disciplinas</span>
            </a>
            
            <a routerLink="/admin/salas" routerLinkActive="active" class="nav-item">
              <i class="icon">🏢</i>
              <span>Salas</span>
            </a>
            
            <a routerLink="/admin/usuarios" routerLinkActive="active" class="nav-item">
              <i class="icon">👥</i>
              <span>Usuários</span>
            </a>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-area" *ngIf="!hasRouterOutlet">
          <!-- Dashboard Home Content -->
          <div class="welcome-section">
            <h2>Bem-vindo ao Sistema de Geração de Horários</h2>
            <p>Gerencie suas preferências e crie horários otimizados automaticamente.</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-content">
                <h3>Horários Gerados</h3>
                <p class="stat-number">{{ stats.horariosGerados }}</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-content">
                <h3>Disciplinas Configuradas</h3>
                <p class="stat-number">{{ stats.disciplinasConfiguradas }}</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">⚙️</div>
              <div class="stat-content">
                <h3>Preferências Definidas</h3>
                <p class="stat-number">{{ stats.preferenciasDefinidas ? 'Sim' : 'Não' }}</p>
              </div>
            </div>
          </div>

          <div class="quick-actions">
            <h3>Ações Rápidas</h3>
            <div class="actions-grid">
              <button class="action-card" (click)="navigateTo('/preferencias')">
                <div class="action-icon">⚙️</div>
                <h4>Configurar Preferências</h4>
                <p>Defina suas disciplinas, horários disponíveis e restrições</p>
              </button>

              <button class="action-card" (click)="navigateTo('/gerar-horario')">
                <div class="action-icon">✨</div>
                <h4>Gerar Novo Horário</h4>
                <p>Crie um horário otimizado baseado nas suas preferências</p>
              </button>

              <button class="action-card" (click)="navigateTo('/horarios')">
                <div class="action-icon">📅</div>
                <h4>Ver Horários</h4>
                <p>Visualize e gerencie seus horários gerados</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Router Outlet for child routes -->
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 60px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-content h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .btn-logout {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .btn-logout:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .sidebar {
      position: fixed;
      left: 0;
      top: 60px;
      width: 250px;
      height: calc(100vh - 60px);
      background: white;
      border-right: 1px solid #e1e5e9;
      overflow-y: auto;
      z-index: 999;
    }

    .nav-menu {
      padding: 20px 0;
    }

    .nav-section h3 {
      padding: 0 20px;
      margin: 20px 0 10px 0;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #333;
      text-decoration: none;
      transition: background-color 0.3s ease;
    }

    .nav-item:hover {
      background-color: #f8f9fa;
    }

    .nav-item.active {
      background-color: #667eea;
      color: white;
    }

    .nav-item .icon {
      margin-right: 12px;
      font-size: 18px;
    }

    .nav-divider {
      height: 1px;
      background: #e1e5e9;
      margin: 20px 0;
    }

    .main-content {
      margin-left: 250px;
      padding: 30px;
      min-height: calc(100vh - 60px);
    }

    .content-area {
      max-width: 1000px;
    }

    .welcome-section {
      margin-bottom: 30px;
    }

    .welcome-section h2 {
      color: #333;
      margin-bottom: 8px;
    }

    .welcome-section p {
      color: #666;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      font-size: 32px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .stat-content h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .stat-number {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .quick-actions h3 {
      margin-bottom: 20px;
      color: #333;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border: none;
      cursor: pointer;
      text-align: left;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .action-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .action-card h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 16px;
    }

    .action-card p {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .main-content {
        margin-left: 0;
        padding: 20px;
      }

      .header-content h1 {
        font-size: 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  hasRouterOutlet = false;
  
  stats = {
    horariosGerados: 0,
    disciplinasConfiguradas: 0,
    preferenciasDefinidas: false
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Simular carregamento de estatísticas
    this.loadStats();
  }

  loadStats(): void {
    // Aqui você faria chamadas para APIs para carregar as estatísticas reais
    this.stats = {
      horariosGerados: 3,
      disciplinasConfiguradas: 5,
      preferenciasDefinidas: true
    };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}

