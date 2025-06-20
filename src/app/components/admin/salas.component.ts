import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Adicionado Router e RouterModule
import { SalaService } from '../../services/sala.service';
import { AuthService } from '../../services/auth.service';
import { Sala } from '../../models/data.model';
import { User } from '../../models/auth.model'; // Importar User
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

// Interface para a resposta da paginação do serviço de salas
interface SalasResponse {
  data: {
      salas: Sala[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  success: boolean;
  currentPage: number;
}

@Component({
  selector: 'app-salas',
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
        <!-- CONTEÚDO ESPECÍFICO DO SalasComponent -->
        <div class="admin-container">
          <div class="admin-header">
            <h1>Gerenciar Salas</h1>
            <button class="btn-primary" (click)="openModal('create')">
              <i class="icon">➕</i>
              Nova Sala
            </button>
          </div>

          <div class="filters-section">
            <div class="search-box">
              <input
                type="text"
                placeholder="Buscar salas (código, nome, bloco)..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchTermChanged($event)"
                class="form-control"
              >
            </div>
          </div>

          <div *ngIf="loading && !salas.length" class="loading-initial">
            <div class="spinner"></div>
            <p>Carregando salas...</p>
          </div>

          <div *ngIf="!loading || salas.length" class="salas-grid">
            <div *ngIf="!loading && !salas.length && searchTerm" class="no-results">
                Nenhuma sala encontrada para "{{ searchTerm }}".
            </div>
            <div *ngIf="!loading && !salas.length && !searchTerm" class="no-results">
                Nenhuma sala cadastrada. Clique em "Nova Sala" para adicionar.
            </div>

            <div *ngFor="let sala of salas" class="sala-card">
              <div class="card-header">
                <h3>{{ sala.codigo }} - {{ sala.nome }}</h3>
                <div class="card-actions">
                  <button class="btn-icon" (click)="openModal('edit', sala)" title="Editar">
                    ✏️
                  </button>
                  <button class="btn-icon btn-danger" (click)="confirmDelete(sala)" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="info-row">
                  <span class="label">Tipo:</span>
                  <span class="tipo-badge" [ngClass]="'tipo-' + sala.tipo.toLowerCase()">{{ getTipoLabel(sala.tipo) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Capacidade:</span>
                  <span>{{ sala.capacidade }} pessoas</span>
                </div>
                <div class="info-row">
                  <span class="label">Localização:</span>
                  <span>{{ sala.bloco }} - {{ sala.andar == 0 ? 'Térreo' : sala.andar + 'º andar' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Status:</span>
                  <span class="status" [class.available]="sala.disponivel" [class.unavailable]="!sala.disponivel">
                    {{ sala.disponivel ? 'Disponível' : 'Indisponível' }}
                  </span>
                </div>
                <div class="recursos-section" *ngIf="sala.recursos && sala.recursos.length > 0">
                  <span class="label">Recursos:</span>
                  <div class="recursos-list">
                    <span *ngFor="let recurso of sala.recursos" class="recurso-tag">{{ recurso }}</span>
                  </div>
                </div>
                <div class="observacoes-section" *ngIf="sala.observacoes">
                  <span class="label">Observações:</span>
                  <p class="observacoes">{{ sala.observacoes }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div *ngIf="loading && salas.length" class="loading-inline">Carregando...</div>

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
                <h2>{{ modalMode === 'create' ? 'Nova Sala' : 'Editar Sala' }}</h2>
                <button class="btn-close" (click)="closeModal()">✕</button>
              </div>
              
              <form [formGroup]="salaForm" (ngSubmit)="onSubmitModal()" class="modal-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="codigo">Código *</label>
                    <input
                      type="text"
                      id="codigo"
                      formControlName="codigo"
                      class="form-control"
                      placeholder="Ex: A101"
                      [class.is-invalid]="salaForm.get('codigo')?.invalid && salaForm.get('codigo')?.touched"
                    >
                    <div class="error-message" *ngIf="salaForm.get('codigo')?.invalid && salaForm.get('codigo')?.touched">
                      <span *ngIf="salaForm.get('codigo')?.errors?.['required']">Código é obrigatório.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="nome">Nome *</label>
                    <input
                      type="text"
                      id="nome"
                      formControlName="nome"
                      class="form-control"
                      placeholder="Ex: Laboratório de Informática"
                      [class.is-invalid]="salaForm.get('nome')?.invalid && salaForm.get('nome')?.touched"
                    >
                    <div class="error-message" *ngIf="salaForm.get('nome')?.invalid && salaForm.get('nome')?.touched">
                      <span *ngIf="salaForm.get('nome')?.errors?.['required']">Nome é obrigatório.</span>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="tipo">Tipo *</label>
                    <select id="tipo" formControlName="tipo" class="form-control"
                            [class.is-invalid]="salaForm.get('tipo')?.invalid && salaForm.get('tipo')?.touched">
                      <option [ngValue]="null">Selecione...</option>
                      <option *ngFor="let tipo of tiposSalaOptions" [value]="tipo.value">{{ tipo.label }}</option>
                    </select>
                    <div class="error-message" *ngIf="salaForm.get('tipo')?.invalid && salaForm.get('tipo')?.touched">
                      <span *ngIf="salaForm.get('tipo')?.errors?.['required']">Tipo é obrigatório.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="capacidade">Capacidade *</label>
                    <input
                      type="number"
                      id="capacidade"
                      formControlName="capacidade"
                      class="form-control"
                      placeholder="Ex: 40"
                      min="1"
                      [class.is-invalid]="salaForm.get('capacidade')?.invalid && salaForm.get('capacidade')?.touched"
                    >
                    <div class="error-message" *ngIf="salaForm.get('capacidade')?.invalid && salaForm.get('capacidade')?.touched">
                      <span *ngIf="salaForm.get('capacidade')?.errors?.['required']">Capacidade é obrigatória.</span>
                      <span *ngIf="salaForm.get('capacidade')?.errors?.['min']">Deve ser maior que 0.</span>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="bloco">Bloco *</label>
                    <input
                      type="text"
                      id="bloco"
                      formControlName="bloco"
                      class="form-control"
                      placeholder="Ex: Bloco A"
                      [class.is-invalid]="salaForm.get('bloco')?.invalid && salaForm.get('bloco')?.touched"
                    >
                    <div class="error-message" *ngIf="salaForm.get('bloco')?.invalid && salaForm.get('bloco')?.touched">
                      <span *ngIf="salaForm.get('bloco')?.errors?.['required']">Bloco é obrigatório.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="andar">Andar *</label>
                    <select id="andar" formControlName="andar" class="form-control"
                            [class.is-invalid]="salaForm.get('andar')?.invalid && salaForm.get('andar')?.touched">
                      <option [ngValue]="null">Selecione...</option>
                      <option value="0">Térreo</option>
                      <option *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]" [value]="i">{{i}}º Andar</option>
                    </select>
                    <div class="error-message" *ngIf="salaForm.get('andar')?.invalid && salaForm.get('andar')?.touched">
                      <span *ngIf="salaForm.get('andar')?.errors?.['required']">Andar é obrigatório.</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>Recursos Disponíveis</label>
                  <div class="recursos-checkboxes">
                    <div class="form-check" *ngFor="let recurso of recursosDisponiveis">
                      <input
                        type="checkbox"
                        [id]="'recurso-' + recurso.replace(' ', '_')"
                        [value]="recurso"
                        [checked]="isRecursoSelected(recurso)"
                        (change)="onRecursoChange($event)"
                        class="form-check-input"
                      >
                      <label [for]="'recurso-' + recurso.replace(' ', '_')" class="form-check-label">{{ recurso }}</label>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="observacoes">Observações</label>
                  <textarea
                    id="observacoes"
                    formControlName="observacoes"
                    class="form-control"
                    rows="3"
                    placeholder="Observações adicionais sobre a sala..."
                  ></textarea>
                </div>

                <div class="form-group">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      id="disponivel"
                      formControlName="disponivel"
                      class="form-check-input"
                    >
                    <label for="disponivel" class="form-check-label">Sala disponível para alocação</label>
                  </div>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn-secondary" (click)="closeModal()">
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    class="btn-primary"
                    [disabled]="salaForm.invalid || submitting"
                  >
                    {{ submitting ? 'Salvando...' : (modalMode === 'create' ? 'Criar Sala' : 'Salvar Alterações') }}
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
  styles: [
    // === ESTILOS DO DASHBOARD (COPIADOS) ===
    `
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
      top: 60px; /* Altura do header */
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
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .nav-item:hover {
      background-color: #f0f2f5;
    }

    .nav-item.active {
      background-color: #667eea;
      color: white;
      font-weight: 500;
    }
    .nav-item.active .icon {
        /* color: white; opcional se o ícone não herdar a cor */
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
      margin-left: 250px; /* Largura da sidebar */
      padding-top: 0; /* Header já está fixo, conteúdo principal começa abaixo dele */
      padding-left: 0; /* Conteúdo específico (.admin-container) terá seu próprio padding */
      padding-right: 0;
      padding-bottom: 0;
      min-height: calc(100vh - 60px); /* Altura do header */
      /* background-color: #f9fafb; */ /* Cor de fundo para a área de conteúdo se necessário */
    }
    
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        /* Adicionar uma classe .sidebar-open para trazê-la de volta com JS */
      }
      .main-content {
        margin-left: 0;
      }
       .header-content h1 {
        font-size: 16px;
      }
    }
    `,
    // === ESTILOS ESPECÍFICOS DO SalasComponent (COMO ANTES) ===
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
export class SalasComponent implements OnInit, OnDestroy {
  currentUser: User | null = null; // Adicionado para o header

  // ... (todo o resto do seu SalasComponent TypeScript existente)
  salas: Sala[] = [];
  loading = false;
  searchTerm = '';
  private searchSubscription!: Subscription;
  private searchTermChanged = new Subject<string>();
  currentPage = 1;
  totalPages = 1;
  pageSize = 9;
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedSalaId: string | null | undefined = null;
  salaForm: FormGroup;
  submitting = false;
  successMessage = '';
  globalErrorMessage = '';
  modalErrorMessage = '';
  recursosDisponiveis: string[] = [
    'Projetor Multimídia', 'Quadro Branco', 'Quadro Interativo', 'Ar Condicionado', 
    'Computadores Alunos', 'Computador Professor', 'Acesso à Internet (Cabo)', 'Acesso à Internet (Wi-Fi)', 
    'Sistema de Som', 'Microfone', 'Cadeiras Acolchoadas', 'Bancadas de Laboratório', 'Acessibilidade (Rampa/Elevador)'
  ];
  tiposSalaMap: { [key: string]: string } = {
    sala_aula: 'Sala de Aula Comum',
    laboratorio_informatica: 'Laboratório de Informática',
    laboratorio_quimica: 'Laboratório de Química',
    laboratorio_fisica: 'Laboratório de Física',
    laboratorio_biologia: 'Laboratório de Biologia',
    auditorio: 'Auditório',
    sala_multimidia: 'Sala Multimídia/Videoconferência',
    sala_estudo: 'Sala de Estudo Individual/Grupo',
    oficina: 'Oficina/Ateliê'
  };
  tiposSalaOptions: { value: string; label: string }[] = Object.keys(this.tiposSalaMap)
    .map(key => ({ value: key, label: this.tiposSalaMap[key] }));

      // Debug properties
  debugMode: boolean = false;
  lastApiResponse: any = null;


  constructor(
    private salaService: SalaService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router // Adicionado Router
  ) {
    this.salaForm = this.fb.group({
      codigo: ['', Validators.required],
      nome: ['', Validators.required],
      tipo: [null, Validators.required],
      capacidade: [null, [Validators.required, Validators.min(1)]],
      bloco: ['', Validators.required],
      andar: [null, Validators.required],
      recursos: [[]],
      observacoes: [''],
      disponivel: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => { // Para o header
      this.currentUser = user;
    });
    this.loadSalas();
    this.searchSubscription = this.searchTermChanged.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadSalas();
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

  // ... (o restante dos seus métodos: onSearchTermChanged, loadSalas, changePage, openModal, closeModal, onRecursoChange, isRecursoSelected, onSubmitModal, confirmDelete, deleteSala, getTipoLabel, extractErrorMessage, clearGlobalMessages, clearModalMessages)
  onSearchTermChanged(term: string): void {
    this.searchTermChanged.next(term);
  }

  loadSalas(): void {
    this.loading = true;
    this.globalErrorMessage = '';
    
    this.salaService.getSalas(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: SalasResponse) => {
          console.log('✅ Resposta da API recebida:', response);
          console.log('📊 Tipo da resposta:', typeof response);
          console.log('📋 É array?', Array.isArray(response));

          this.lastApiResponse = response;

          try {
            // Tratar diferentes formatos de resposta
            if (response && typeof response === 'object') {
              if (response.data.salas && Array.isArray(response.data.salas)) {
                // Formato esperado: { data: [], totalPages: number, currentPage: number }
                console.log('📦 Formato padrão detectado');
                this.salas = response.data.salas;
                this.totalPages = response.data.pagination.totalPages || 1;
                this.currentPage = 1;
              } else if (Array.isArray(response)) {
                // Resposta é um array direto
                console.log('📋 Array direto detectado');
                this.salas = response;
                this.totalPages = 1;
                this.currentPage = 1;
              } else if (response.data.salas && Array.isArray(response.data.salas)) {
                // Formato alternativo: { disciplinas: [] }
                console.log('📚 Formato alternativo detectado');
                this.salas = response.data.salas;
                this.totalPages = response.data.pagination.totalPages || 1;
                this.currentPage = 1;
              } else {
                // Formato desconhecido
                console.warn('⚠️ Formato de resposta desconhecido:', response);
                this.salas = [];
              }
            } else {
              console.warn('⚠️ Resposta inválida');
              this.salas = [];
            }
            
            console.log('📚 Total de salas carregadas:', this.salas.length);
            console.log('📄 Páginas totais:', this.totalPages);
            
          } catch (error) {
            console.error('❌ Erro ao processar resposta:', error);
            this.salas = [];
          }
          

        },
        error: (err: HttpErrorResponse) => {

          console.error('❌ Erro ao carregar salas:', err);
          console.error('🔢 Status:', err.status);
          console.error('💬 Mensagem:', err.message);
          console.error('📄 Corpo do erro:', err.error);


          this.globalErrorMessage = this.extractErrorMessage(err, 'Erro ao carregar salas.');
          this.loading = false;
          this.salas = [];
          console.error('Erro ao carregar salas:', err);
          this.clearGlobalMessages(7000);
        }
      });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadSalas();
    }
  }

  openModal(mode: 'create' | 'edit', sala?: Sala): void {
    this.modalMode = mode;
    this.salaForm.reset(); 
    this.modalErrorMessage = '';
    
    this.salaForm.patchValue({
        recursos: [],
        disponivel: true,
        tipo: null,
        capacidade: null,
        andar: null
    });

    if (mode === 'edit' && sala) {
      this.selectedSalaId = sala._id;
      this.salaForm.patchValue({
        codigo: sala.codigo,
        nome: sala.nome,
        tipo: sala.tipo,
        capacidade: sala.capacidade,
        bloco: sala.bloco,
        andar: sala.andar,
        recursos: sala.recursos || [], 
        observacoes: sala.observacoes || '',
        disponivel: sala.disponivel !== undefined ? sala.disponivel : true
      });
    } else {
      this.selectedSalaId = null;
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.submitting = false;
    this.selectedSalaId = null;
    this.salaForm.reset();
    this.modalErrorMessage = '';
  }

  onRecursoChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const recursoNome = checkbox.value;
    const isChecked = checkbox.checked;

    const recursosControl = this.salaForm.get('recursos');
    if (!recursosControl) return;

    let currentRecursos: string[] = [...(recursosControl.value || [])]; 

    if (isChecked) {
      if (!currentRecursos.includes(recursoNome)) {
        currentRecursos.push(recursoNome);
      }
    } else {
      currentRecursos = currentRecursos.filter(r => r !== recursoNome);
    }
    recursosControl.setValue(currentRecursos);
    recursosControl.markAsDirty(); 
    recursosControl.markAsTouched(); 
  }

  isRecursoSelected(recurso: string): boolean {
    const recursosControl = this.salaForm.get('recursos');
    return recursosControl ? (recursosControl.value || []).includes(recurso) : false;
  }

  onSubmitModal(): void {
    if (this.salaForm.invalid) {
      this.salaForm.markAllAsTouched();
      this.modalErrorMessage = "Por favor, corrija os erros no formulário.";
      this.clearModalMessages(4000);
      return;
    }

    this.submitting = true;
    this.modalErrorMessage = '';
    const salaData = this.salaForm.value as Sala;

    if (this.modalMode === 'create') {
      this.salaService.createSala(salaData).subscribe({
        next: (novaSala) => {
          this.submitting = false;
          this.successMessage = `Sala "${novaSala.nome}" criada com sucesso!`;
          this.closeModal();
          this.loadSalas();
          this.clearGlobalMessages();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.modalErrorMessage = this.extractErrorMessage(err, 'Erro ao criar sala.');
          console.error('Erro ao criar sala:', err);
          this.clearModalMessages(7000);
        }
      });
    } else if (this.modalMode === 'edit' && this.selectedSalaId) {
      this.salaService.updateSala(this.selectedSalaId, salaData).subscribe({
        next: (salaAtualizada) => {
          this.submitting = false;
          this.successMessage = `Sala "${salaAtualizada.nome}" atualizada com sucesso!`;
          this.closeModal();
          this.loadSalas();
          this.clearGlobalMessages();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.modalErrorMessage = this.extractErrorMessage(err, 'Erro ao atualizar sala.');
          console.error('Erro ao atualizar sala:', err);
          this.clearModalMessages(7000);
        }
      });
    }
  }

  confirmDelete(sala: Sala): void {
    if (!sala._id) {
        this.globalErrorMessage = "ID da sala inválido para exclusão.";
        this.clearGlobalMessages(5000);
        return;
    }
    if (confirm(`Tem certeza que deseja excluir a sala "${sala.nome} (${sala.codigo})"? Esta ação não pode ser desfeita.`)) {
      if(sala._id) { // Verificação adicional para o compilador
        this.deleteSala(sala._id);
      }
    }
  }

  private deleteSala(id: string): void {
    this.loading = true;
    this.salaService.deleteSala(id).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Sala excluída com sucesso!';
        if (this.salas.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadSalas();
        this.clearGlobalMessages();
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.globalErrorMessage = this.extractErrorMessage(err, 'Erro ao excluir sala.');
        console.error('Erro ao excluir sala:', err);
        this.clearGlobalMessages(7000);
      }
    });
  }

  getTipoLabel(tipoKey?: string): string {
    return tipoKey ? (this.tiposSalaMap[tipoKey] || tipoKey) : 'Não especificado';
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