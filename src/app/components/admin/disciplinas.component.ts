import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Adicionado Router e RouterModule
import { DisciplinaService } from '../../services/disciplina.service';
import { AuthService } from '../../services/auth.service';
import { Disciplina } from '../../models/data.model';
import { User } from '../../models/auth.model'; // Importar User
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

// Interface DisciplinasResponse aqui... (como antes)
interface DisciplinasResponse {
  data: Disciplina[];
  totalPages: number;
  currentPage: number;
  totalItems?: number;
}

@Component({
  selector: 'app-disciplinas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule], // Adicionado RouterModule
  template: `
    <div class="dashboard-container"> <!-- CLASSE DO DASHBOARD PARA ESTILO GLOBAL -->
      <!-- Header REPLICADO -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Sistema de Geração de Horários</h1>
          <div class="user-info">
            <span>Olá, {{ currentUser?.nome }}</span>
            <button class="btn-logout" (click)="logout()">Sair</button>
          </div>
        </div>
      </header>

      <!-- Sidebar REPLICADA -->
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

      <!-- Main Content REPLICADO -->
      <main class="main-content">
        <!-- CONTEÚDO ESPECÍFICO DO DisciplinasComponent -->
        <div class="admin-container"> 
          <div class="admin-header">
            <h1>Gerenciar Disciplinas</h1>
            <button class="btn-primary" (click)="openModal('create')">
              <i class="icon">➕</i>
              Nova Disciplina
            </button>
          </div>

          <div class="filters-section">
            <div class="search-box">
              <input
                type="text"
                placeholder="Buscar disciplinas (código ou nome)..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchTermChanged($event)"
                class="form-control"
              >
            </div>
          </div>

          <div *ngIf="loading && !disciplinas.length" class="loading-initial">
            <div class="spinner"></div>
            <p>Carregando disciplinas...</p>
          </div>

          <div *ngIf="!loading || disciplinas.length" class="disciplinas-grid">
            <div *ngIf="!loading && !disciplinas.length && searchTerm" class="no-results">
                Nenhuma disciplina encontrada para "{{ searchTerm }}".
            </div>
            <div *ngIf="!loading && !disciplinas.length && !searchTerm" class="no-results">
                Nenhuma disciplina cadastrada. Clique em "Nova Disciplina" para adicionar.
            </div>
            
            <div *ngFor="let disciplina of disciplinas" class="disciplina-card">
              <div class="card-header">
                <h3>{{ disciplina.codigo }} - {{ disciplina.nome }}</h3>
                <div class="card-actions">
                  <button class="btn-icon" (click)="openModal('edit', disciplina)" title="Editar">
                    ✏️
                  </button>
                  <button class="btn-icon btn-danger" (click)="confirmDelete(disciplina)" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="info-row">
                  <span class="label">Departamento:</span>
                  <span>{{ disciplina.departamento }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Carga Horária:</span>
                  <span>{{ disciplina.cargaHoraria }}h</span>
                </div>
                <div class="info-row">
                  <span class="label">Créditos:</span>
                  <span>{{ disciplina.creditos }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Período:</span>
                  <span>{{ disciplina.periodo }}º</span>
                </div>
                <div class="info-row">
                  <span class="label">Status:</span>
                  <span class="status" [class.active]="disciplina.ativa" [class.inactive]="!disciplina.ativa">
                    {{ disciplina.ativa ? 'Ativa' : 'Inativa' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div *ngIf="loading && disciplinas.length" class="loading-inline">Carregando...</div>

          <div *ngIf="!loading && totalPages > 1" class="pagination">
            <button 
              class="btn-pagination" 
              [disabled]="currentPage === 1"
              (click)="changePage(currentPage - 1)"
            >
              Anterior
            </button>
            <span class="page-info">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            <button 
              class="btn-pagination" 
              [disabled]="currentPage === totalPages"
              (click)="changePage(currentPage + 1)"
            >
              Próxima
            </button>
          </div>

          <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h2>{{ modalMode === 'create' ? 'Nova Disciplina' : 'Editar Disciplina' }}</h2>
                <button class="btn-close" (click)="closeModal()">✕</button>
              </div>
              
              <form [formGroup]="disciplinaForm" (ngSubmit)="onSubmitModal()" class="modal-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="codigo">Código *</label>
                    <input
                      type="text"
                      id="codigo"
                      formControlName="codigo"
                      class="form-control"
                      placeholder="Ex: MAT001"
                      [class.is-invalid]="disciplinaForm.get('codigo')?.invalid && disciplinaForm.get('codigo')?.touched"
                    >
                    <div class="error-message" *ngIf="disciplinaForm.get('codigo')?.invalid && disciplinaForm.get('codigo')?.touched">
                      <span *ngIf="disciplinaForm.get('codigo')?.errors?.['required']">Código é obrigatório.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="nome">Nome *</label>
                    <input
                      type="text"
                      id="nome"
                      formControlName="nome"
                      class="form-control"
                      placeholder="Ex: Cálculo I"
                      [class.is-invalid]="disciplinaForm.get('nome')?.invalid && disciplinaForm.get('nome')?.touched"
                    >
                    <div class="error-message" *ngIf="disciplinaForm.get('nome')?.invalid && disciplinaForm.get('nome')?.touched">
                      <span *ngIf="disciplinaForm.get('nome')?.errors?.['required']">Nome é obrigatório.</span>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="departamento">Departamento *</label>
                    <select id="departamento" formControlName="departamento" class="form-control"
                            [class.is-invalid]="disciplinaForm.get('departamento')?.invalid && disciplinaForm.get('departamento')?.touched">
                      <option [ngValue]="null">Selecione...</option>
                      <option value="Matemática">Matemática</option>
                      <option value="Física">Física</option>
                      <option value="Química">Química</option>
                      <option value="Biologia">Biologia</option>
                      <option value="Letras">Letras</option>
                      <option value="História">História</option>
                      <option value="Geografia">Geografia</option>
                      <option value="Filosofia">Filosofia</option>
                      <option value="Sociologia">Sociologia</option>
                      <option value="Ciência da Computação">Ciência da Computação</option>
                      <option value="Engenharia">Engenharia</option>
                      <option value="Educação Física">Educação Física</option>
                      <option value="Artes">Artes</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <div class="error-message" *ngIf="disciplinaForm.get('departamento')?.invalid && disciplinaForm.get('departamento')?.touched">
                      <span *ngIf="disciplinaForm.get('departamento')?.errors?.['required']">Departamento é obrigatório.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="periodo">Período *</label>
                    <select id="periodo" formControlName="periodo" class="form-control"
                            [class.is-invalid]="disciplinaForm.get('periodo')?.invalid && disciplinaForm.get('periodo')?.touched">
                      <option [ngValue]="null">Selecione...</option>
                      <option *ngFor="let p of periodosDisponiveis" [ngValue]="p">{{ p }}º Período</option>
                    </select>
                    <div class="error-message" *ngIf="disciplinaForm.get('periodo')?.invalid && disciplinaForm.get('periodo')?.touched">
                      <span *ngIf="disciplinaForm.get('periodo')?.errors?.['required']">Período é obrigatório.</span>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="cargaHoraria">Carga Horária (horas) *</label>
                    <input
                      type="number"
                      id="cargaHoraria"
                      formControlName="cargaHoraria"
                      class="form-control"
                      placeholder="Ex: 60"
                      min="1"
                      [class.is-invalid]="disciplinaForm.get('cargaHoraria')?.invalid && disciplinaForm.get('cargaHoraria')?.touched"
                    >
                    <div class="error-message" *ngIf="disciplinaForm.get('cargaHoraria')?.invalid && disciplinaForm.get('cargaHoraria')?.touched">
                      <span *ngIf="disciplinaForm.get('cargaHoraria')?.errors?.['required']">Carga horária é obrigatória.</span>
                      <span *ngIf="disciplinaForm.get('cargaHoraria')?.errors?.['min']">Deve ser maior que 0.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="creditos">Créditos *</label>
                    <input
                      type="number"
                      id="creditos"
                      formControlName="creditos"
                      class="form-control"
                      placeholder="Ex: 4"
                      min="1"
                      [class.is-invalid]="disciplinaForm.get('creditos')?.invalid && disciplinaForm.get('creditos')?.touched"
                    >
                    <div class="error-message" *ngIf="disciplinaForm.get('creditos')?.invalid && disciplinaForm.get('creditos')?.touched">
                      <span *ngIf="disciplinaForm.get('creditos')?.errors?.['required']">Créditos é obrigatório.</span>
                      <span *ngIf="disciplinaForm.get('creditos')?.errors?.['min']">Deve ser maior que 0.</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      id="ativa"
                      formControlName="ativa"
                      class="form-check-input"
                    >
                    <label for="ativa" class="form-check-label">Disciplina ativa</label>
                  </div>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn-secondary" (click)="closeModal()">
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    class="btn-primary"
                    [disabled]="disciplinaForm.invalid || submitting"
                  >
                    {{ submitting ? 'Salvando...' : (modalMode === 'create' ? 'Criar' : 'Salvar Alterações') }}
                  </button>
                </div>
                <div *ngIf="modalErrorMessage" class="alert alert-error modal-alert">
                  {{ modalErrorMessage }}
                </div>
              </form>
            </div>
          </div>

          <div *ngIf="successMessage" class="alert alert-success global-alert">
            {{ successMessage }}
          </div>
          <div *ngIf="globalErrorMessage" class="alert alert-error global-alert">
            {{ globalErrorMessage }}
          </div>
        </div>
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
  `,
    // === ESTILOS ESPECÍFICOS DO DisciplinasComponent (COMO ANTES) ===
    `
    .admin-container { padding: 20px; max-width: 1200px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e1e5e9; }
    .admin-header h1 { margin: 0; color: #333; font-size: 28px; font-weight: 600; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; transition: opacity 0.3s ease; display: inline-flex; align-items: center; gap: 8px; }
    .btn-primary:hover { opacity: 0.85; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; }
    .btn-secondary { background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; transition: opacity 0.3s ease; }
    .btn-secondary:hover { opacity: 0.85; }
    .icon { font-style: normal; }

    /* Filtros */
    .filters-section { margin-bottom: 20px; }
    .search-box input.form-control { width: 100%; max-width: 400px; padding: 10px 15px; border: 1px solid #ced4da; border-radius: 6px; font-size: 16px; }

    /* Loading */
    .loading-initial { text-align: center; padding: 50px; color: #555; }
    .loading-inline { text-align: center; padding: 10px; color: #555; font-style: italic; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    /* Grid de Salas */
    .salas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .sala-card { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; }
    .sala-card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
    .card-header { background: #f8f9fa; border-bottom: 1px solid #e9ecef; color: #333; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { margin: 0; font-size: 1.1em; font-weight: 600; color: #667eea; }
    .card-actions { display: flex; gap: 10px; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 18px; color: #777; padding: 5px; border-radius: 50%; transition: color 0.2s, background-color 0.2s; }
    .btn-icon:hover { color: #667eea; background-color: #e9ecef;}
    .btn-icon.btn-danger:hover { color: #dc3545; background-color: #f8d7da; }
    .card-content { padding: 20px; flex-grow: 1; }
    .info-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.95em; }
    .info-row:last-child { margin-bottom: 0; border-bottom: none; }
    .label { font-weight: 600; color: #555; }
    .tipo-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 600; text-transform: capitalize; }
    .tipo-sala_aula { background: #e3f2fd; color: #1565c0; }
    .tipo-laboratorio { background: #fce4ec; color: #ad1457; }
    .tipo-auditorio { background: #fff3e0; color: #ef6c00; }
    .tipo-sala_multimidia { background: #e8f5e9; color: #2e7d32; }
    .status { padding: 3px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600; text-transform: uppercase; }
    .status.available { background: #d1fae5; color: #065f46; }
    .status.unavailable { background: #fee2e2; color: #991b1b; }
    .recursos-section, .observacoes-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
    .recursos-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .recurso-tag { background: #e9ecef; color: #495057; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; }
    .observacoes { margin: 6px 0 0 0; font-size: 0.9em; color: #666; line-height: 1.4; white-space: pre-wrap; }
    .no-results { text-align:center; padding: 20px; color: #777; font-style: italic; grid-column: 1 / -1; }

    /* Paginação */
    .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 30px; }
    .btn-pagination { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; color: #555; }
    .btn-pagination:hover:not(:disabled) { background: #f0f0f0; border-color: #bbb; }
    .btn-pagination:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-weight: 500; color: #555; }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-content { background: white; border-radius: 12px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.15); display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid #e1e5e9; }
    .modal-header h2 { margin: 0; color: #333; font-size: 1.5em; font-weight: 600; }
    .btn-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #888; padding: 0; line-height: 1; }
    .btn-close:hover { color: #333; }
    .modal-form { padding: 25px; flex-grow: 1; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 0px; }
    .form-group { margin-bottom: 20px; display: flex; flex-direction: column; }
    .form-group label { display: block; margin-bottom: 6px; color: #333; font-weight: 500; font-size: 0.95em; }
    .form-control { width: 100%; padding: 10px 14px; border: 1px solid #ced4da; border-radius: 6px; font-size: 16px; box-sizing: border-box; transition: border-color 0.2s ease; }
    .form-control:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 0.2rem rgba(102,126,234,.25); }
    .form-control.is-invalid { border-color: #dc3545; }
    .error-message { color: #dc3545; font-size: 0.85em; margin-top: 5px; }
    .recursos-checkboxes { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px 15px; margin-top: 8px; }
    .form-check { display: flex; align-items: center; gap: 8px; }
    .form-check-input { width: 17px; height: 17px; cursor: pointer; }
    .form-check-label { margin-bottom: 0; font-weight: normal; color: #555; font-size: 0.95em; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e1e5e9; }
    .modal-alert { margin-top: 15px; }

    /* Alertas Globais */
    .alert { padding: 15px; margin-bottom: 20px; border: 1px solid transparent; border-radius: .25rem; }
    .alert-success { color: #0f5132; background-color: #d1e7dd; border-color: #badbcc; }
    .alert-error { color: #842029; background-color: #f8d7da; border-color: #f5c2c7; }
    .global-alert { position: fixed; top: 20px; right: 20px; z-index: 1050; min-width: 300px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }

    @media (max-width: 768px) {
      .admin-header { flex-direction: column; gap: 15px; align-items: flex-start; }
      .salas-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .modal-content { width: 95%; margin: 20px auto; }
      .recursos-checkboxes { grid-template-columns: 1fr; } /* Ajuste para mobile */
      .global-alert { width: calc(100% - 40px); left: 20px; right: 20px; }
    }
    `
  ]
})
export class DisciplinasComponent implements OnInit, OnDestroy { // Removido OnDestroy se não usado
  currentUser: User | null = null; // Adicionado para o header

  // ... (todo o resto do seu DisciplinasComponent TypeScript)
  disciplinas: Disciplina[] = [];
  loading = false;
  searchTerm = '';
  private searchSubscription!: Subscription;
  private searchTermChanged = new Subject<string>();
  currentPage = 1;
  totalPages = 1;
  pageSize = 9;
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedDisciplinaId: string | null | undefined = null;
  disciplinaForm: FormGroup;
  submitting = false;
  successMessage = '';
  globalErrorMessage = '';
  modalErrorMessage = '';
  periodosDisponiveis: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

  constructor(
    private disciplinaService: DisciplinaService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router // Adicionado Router
  ) {
    this.disciplinaForm = this.fb.group({
      codigo: ['', Validators.required],
      nome: ['', Validators.required],
      departamento: [null, Validators.required],
      periodo: [null, Validators.required],
      cargaHoraria: [null, [Validators.required, Validators.min(1)]],
      creditos: [null, [Validators.required, Validators.min(1)]],
      ativa: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => { // Para o header
      this.currentUser = user;
    });
    this.loadDisciplinas();
    this.searchSubscription = this.searchTermChanged.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadDisciplinas();
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  logout(): void { // Adicionado para o header
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ... (o restante dos seus métodos: onSearchTermChanged, loadDisciplinas, changePage, openModal, closeModal, onSubmitModal, confirmDelete, deleteDisciplina, extractErrorMessage, clearGlobalMessages, clearModalMessages)
  onSearchTermChanged(term: string): void {
    this.searchTermChanged.next(term);
  }

  loadDisciplinas(): void {
    this.loading = true;
    this.globalErrorMessage = '';

    this.disciplinaService.getDisciplinas(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: DisciplinasResponse) => {
          this.disciplinas = response.data;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.globalErrorMessage = this.extractErrorMessage(err, 'Erro ao carregar disciplinas.');
          this.loading = false;
          this.disciplinas = [];
          console.error('Erro ao carregar disciplinas:', err);
          this.clearGlobalMessages(7000);
        }
      });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadDisciplinas();
    }
  }

  openModal(mode: 'create' | 'edit', disciplina?: Disciplina): void {
    this.modalMode = mode;
    this.disciplinaForm.reset();
    this.modalErrorMessage = '';

    if (mode === 'edit' && disciplina) {
      this.selectedDisciplinaId = disciplina._id;
      this.disciplinaForm.patchValue({
        codigo: disciplina.codigo,
        nome: disciplina.nome,
        departamento: disciplina.departamento,
        periodo: disciplina.periodo,
        cargaHoraria: disciplina.cargaHoraria,
        creditos: disciplina.creditos,
        ativa: disciplina.ativa !== undefined ? disciplina.ativa : true
      });
    } else {
      this.selectedDisciplinaId = null;
      this.disciplinaForm.patchValue({
        ativa: true,
        departamento: null,
        periodo: null,
        cargaHoraria: null,
        creditos: null
      });
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.submitting = false;
    this.selectedDisciplinaId = null;
    this.disciplinaForm.reset();
    this.modalErrorMessage = '';
  }

  onSubmitModal(): void {
    if (this.disciplinaForm.invalid) {
      this.disciplinaForm.markAllAsTouched();
      this.modalErrorMessage = "Por favor, corrija os erros no formulário.";
      this.clearModalMessages(4000);
      return;
    }

    this.submitting = true;
    this.modalErrorMessage = '';
    const disciplinaData = this.disciplinaForm.value as Disciplina;

    if (this.modalMode === 'create') {
      this.disciplinaService.createDisciplina(disciplinaData).subscribe({
        next: (novaDisciplina) => {
          this.submitting = false;
          this.successMessage = `Disciplina "${novaDisciplina.nome}" criada com sucesso!`;
          this.closeModal();
          this.loadDisciplinas();
          this.clearGlobalMessages();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.modalErrorMessage = this.extractErrorMessage(err, 'Erro ao criar disciplina.');
          console.error('Erro ao criar disciplina:', err);
          this.clearModalMessages(7000);
        }
      });
    } else if (this.modalMode === 'edit' && this.selectedDisciplinaId) {
      this.disciplinaService.updateDisciplina(this.selectedDisciplinaId, disciplinaData).subscribe({
        next: (disciplinaAtualizada) => {
          this.submitting = false;
          this.successMessage = `Disciplina "${disciplinaAtualizada.nome}" atualizada com sucesso!`;
          this.closeModal();
          this.loadDisciplinas();
          this.clearGlobalMessages();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.modalErrorMessage = this.extractErrorMessage(err, 'Erro ao atualizar disciplina.');
          console.error('Erro ao atualizar disciplina:', err);
          this.clearModalMessages(7000);
        }
      });
    }
  }

  confirmDelete(disciplina: Disciplina): void {
    if (!disciplina._id) {
      this.globalErrorMessage = "ID da disciplina inválido para exclusão.";
      this.clearGlobalMessages(5000);
      return;
    }
    if (confirm(`Tem certeza que deseja excluir a disciplina "${disciplina.nome} (${disciplina.codigo})"? Esta ação não pode ser desfeita.`)) {
      if (disciplina._id) { // Verificação adicional para o compilador
        this.deleteDisciplina(disciplina._id);
      }
    }
  }

  private deleteDisciplina(id: string): void {
    this.loading = true;
    this.disciplinaService.deleteDisciplina(id).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Disciplina excluída com sucesso!';
        if (this.disciplinas.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadDisciplinas();
        this.clearGlobalMessages();
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.globalErrorMessage = this.extractErrorMessage(err, 'Erro ao excluir disciplina.');
        console.error('Erro ao excluir disciplina:', err);
        this.clearGlobalMessages(7000);
      }
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      } else if (error.error.message) {
        return error.error.message;
      } else if (Array.isArray(error.error.errors) && error.error.errors.length > 0) {
        return error.error.errors.map((e: any) => e.msg || e.message).join(', ');
      }
    }
    return error.message || defaultMessage;
  }

  private clearGlobalMessages(timeout: number = 4000): void {
    setTimeout(() => {
      this.successMessage = '';
      this.globalErrorMessage = '';
    }, timeout);
  }

  private clearModalMessages(timeout: number = 4000): void {
    setTimeout(() => {
      this.modalErrorMessage = '';
    }, timeout);
  }
}