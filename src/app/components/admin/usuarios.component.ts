import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Adicionado Router e RouterModule
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

// Interface para a resposta da paginação do serviço de usuários
interface UsersResponse {
  data: User[];
  totalPages: number;
  currentPage: number;
  totalItems?: number;
}

// Validador customizado para senhas
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const senha = control.get('senha');
    const confirmarSenha = control.get('confirmarSenha');
    // Só retorna o erro se ambos os campos estiverem preenchidos e forem diferentes
    if (senha && confirmarSenha && senha.value && confirmarSenha.value && senha.value !== confirmarSenha.value) {
      return { passwordMismatch: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule], // Adicionado RouterModule
  providers: [DatePipe],
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
        <!-- CONTEÚDO ESPECÍFICO DO UsuariosComponent -->
        <div class="admin-container">
          <div class="admin-header">
            <h1>Gerenciar Usuários</h1>
            <button class="btn-primary" (click)="openModal('create')">
              <i class="icon">➕</i>
              Novo Usuário
            </button>
          </div>

          <div class="filters-section">
            <div class="search-box">
              <input
                type="text"
                placeholder="Buscar usuários (nome ou email)..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchTermChanged($event)"
                class="form-control"
              >
            </div>
          </div>

          <div *ngIf="loading && !usuarios.length" class="loading-initial">
            <div class="spinner"></div>
            <p>Carregando usuários...</p>
          </div>

          <div *ngIf="!loading || usuarios.length" class="usuarios-grid">
            <div *ngIf="!loading && !usuarios.length && searchTerm" class="no-results">
                Nenhum usuário encontrado para "{{ searchTerm }}".
            </div>
            <div *ngIf="!loading && !usuarios.length && !searchTerm" class="no-results">
                Nenhum usuário cadastrado. Clique em "Novo Usuário" para adicionar.
            </div>
            
            <div *ngFor="let usuario of usuarios" class="usuario-card">
              <div class="card-header">
                <div class="user-info">
                  <h3>{{ usuario.nome }}</h3>
                  <span class="user-email">{{ usuario.email }}</span>
                </div>
                <div class="card-actions">
                  <button class="btn-icon" (click)="openModal('edit', usuario)" title="Editar">
                    ✏️
                  </button>
                  <button 
                    class="btn-icon" 
                    (click)="toggleUserStatus(usuario)" 
                    [title]="usuario.ativo ? 'Desativar' : 'Ativar'"
                  >
                    {{ usuario.ativo ? '🔒' : '🔓' }}
                  </button>
                  <button class="btn-icon btn-danger" (click)="confirmDelete(usuario)" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="card-content">
                <div class="info-row">
                  <span class="label">Tipo:</span>
                  <span class="tipo-badge" [ngClass]="'tipo-' + (usuario.tipo ? usuario.tipo.toLowerCase() : '')">
                    {{ usuario.tipo === 'admin' ? 'Administrador' : (usuario.tipo === 'professor' ? 'Professor' : usuario.tipo) }}
                  </span>
                </div>
                <div class="info-row" *ngIf="usuario.departamento">
                  <span class="label">Departamento:</span>
                  <span>{{ usuario.departamento }}</span>
                </div>
                <div class="info-row" *ngIf="usuario.telefone">
                  <span class="label">Telefone:</span>
                  <span>{{ usuario.telefone }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Status:</span>
                  <span class="status" [class.active]="usuario.ativo" [class.inactive]="!usuario.ativo">
                    {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </div>
                <div class="info-row" *ngIf="usuario.criadoEm">
                  <span class="label">Criado em:</span>
                  <span>{{ usuario.criadoEm | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div *ngIf="loading && usuarios.length" class="loading-inline">Carregando...</div>

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
                <h2>{{ modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário' }}</h2>
                <button class="btn-close" (click)="closeModal()">✕</button>
              </div>
              
              <form [formGroup]="userForm" (ngSubmit)="onSubmitModal()" class="modal-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="nome">Nome Completo *</label>
                    <input
                      type="text"
                      id="nome"
                      formControlName="nome"
                      class="form-control"
                      placeholder="Ex: João da Silva"
                      [class.is-invalid]="userForm.get('nome')?.invalid && userForm.get('nome')?.touched"
                    >
                    <div class="error-message" *ngIf="userForm.get('nome')?.invalid && userForm.get('nome')?.touched">
                      <span *ngIf="userForm.get('nome')?.errors?.['required']">Nome é obrigatório.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      formControlName="email"
                      class="form-control"
                      placeholder="Ex: joao.silva@universidade.edu.br"
                      [class.is-invalid]="userForm.get('email')?.invalid && userForm.get('email')?.touched"
                    >
                    <div class="error-message" *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
                      <span *ngIf="userForm.get('email')?.errors?.['required']">Email é obrigatório.</span>
                      <span *ngIf="userForm.get('email')?.errors?.['email']">Email inválido.</span>
                    </div>
                  </div>
                </div>

                <div class="form-row" *ngIf="modalMode === 'create' || showPasswordFields">
                  <div class="form-group">
                    <label for="senha">{{ modalMode === 'create' ? 'Senha *' : 'Nova Senha (opcional)'}}</label>
                    <input
                      type="password"
                      id="senha"
                      formControlName="senha"
                      class="form-control"
                      placeholder="Deixe em branco para não alterar"
                      [class.is-invalid]="userForm.get('senha')?.invalid && userForm.get('senha')?.touched"
                    >
                    <div class="error-message" *ngIf="userForm.get('senha')?.invalid && userForm.get('senha')?.touched">
                      <span *ngIf="userForm.get('senha')?.errors?.['required']">Senha é obrigatória.</span>
                      <span *ngIf="userForm.get('senha')?.errors?.['minlength']">Senha deve ter pelo menos 6 caracteres.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="confirmarSenha">{{ modalMode === 'create' ? 'Confirmar Senha *' : 'Confirmar Nova Senha'}}</label>
                    <input
                      type="password"
                      id="confirmarSenha"
                      formControlName="confirmarSenha"
                      class="form-control"
                      placeholder="Repita a senha"
                      [class.is-invalid]="(userForm.get('confirmarSenha')?.invalid && userForm.get('confirmarSenha')?.touched) || userForm.hasError('passwordMismatch')"
                    >
                    <div class="error-message" *ngIf="userForm.get('confirmarSenha')?.invalid && userForm.get('confirmarSenha')?.touched">
                      <span *ngIf="userForm.get('confirmarSenha')?.errors?.['required']">Confirmação de senha é obrigatória.</span>
                    </div>
                    <div class="error-message" *ngIf="userForm.hasError('passwordMismatch') && userForm.get('confirmarSenha')?.touched">
                      As senhas não coincidem.
                    </div>
                  </div>
                </div>
                <div class="form-group" *ngIf="modalMode === 'edit'">
                    <a href="javascript:void(0)" (click)="togglePasswordFields()" class="link-like">
                    {{ showPasswordFields ? 'Cancelar Alteração de Senha' : 'Alterar Senha' }}
                    </a>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="tipo">Tipo de Usuário *</label>
                    <select id="tipo" formControlName="tipo" class="form-control"
                            [class.is-invalid]="userForm.get('tipo')?.invalid && userForm.get('tipo')?.touched">
                      <option [ngValue]="null">Selecione...</option>
                      <option value="professor">Professor</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <div class="error-message" *ngIf="userForm.get('tipo')?.invalid && userForm.get('tipo')?.touched">
                      <span *ngIf="userForm.get('tipo')?.errors?.['required']">Tipo de usuário é obrigatório.</span>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="departamento">Departamento</label>
                    <select id="departamento" formControlName="departamento" class="form-control">
                      <option [ngValue]="null">Nenhum/Selecione...</option>
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
                      <option value="Administração">Administração</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="telefone">Telefone</label>
                  <input
                    type="tel"
                    id="telefone"
                    formControlName="telefone"
                    class="form-control"
                    placeholder="Ex: (11) 99999-9999"
                  >
                </div>

                <div class="form-group">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      id="ativo"
                      formControlName="ativo"
                      class="form-check-input"
                    >
                    <label for="ativo" class="form-check-label">Usuário ativo</label>
                  </div>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn-secondary" (click)="closeModal()">
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    class="btn-primary"
                    [disabled]="userForm.invalid || submitting"
                  >
                    {{ submitting ? 'Salvando...' : (modalMode === 'create' ? 'Criar Usuário' : 'Salvar Alterações') }}
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
      padding-top: 0; 
      padding-left: 0; 
      padding-right: 0;
      padding-bottom: 0;
      min-height: calc(100vh - 60px); /* Altura do header */
    }
    
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .main-content {
        margin-left: 0;
      }
       .header-content h1 {
        font-size: 16px;
      }
    }
    `,
    // === ESTILOS ESPECÍFICOS DO UsuariosComponent (COMO ANTES) ===
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
export class UsuariosComponent implements OnInit, OnDestroy {
  currentUser: User | null = null; // Adicionado para o header

  // ... (todo o resto do seu UsuariosComponent TypeScript existente)
  usuarios: User[] = [];
  loading = false;
  searchTerm = '';
  private searchSubscription!: Subscription;
  private searchTermChanged = new Subject<string>();
  currentPage = 1;
  totalPages = 1;
  pageSize = 9;
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedUserId: string | null | undefined = null;
  userForm: FormGroup;
  submitting = false;
  showPasswordFields = false;
  successMessage = '';
  globalErrorMessage = '';
  modalErrorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    private router: Router // Adicionado Router
  ) {
    this.userForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: [''],
      confirmarSenha: [''],
      tipo: [null, Validators.required],
      departamento: [null],
      telefone: [''],
      ativo: [true, Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => { // Para o header
      this.currentUser = user;
    });
    this.loadUsers();
    this.searchSubscription = this.searchTermChanged.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadUsers();
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

  // ... (o restante dos seus métodos: onSearchTermChanged, loadUsers, changePage, openModal, togglePasswordFields, updatePasswordValidators, closeModal, onSubmitModal, toggleUserStatus, confirmDelete, deleteUser, extractErrorMessage, clearGlobalMessages, clearModalMessages)
  onSearchTermChanged(term: string): void {
    this.searchTermChanged.next(term);
  }

  loadUsers(): void {
    this.loading = true;
    this.globalErrorMessage = '';
    
    this.userService.getUsers(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response: UsersResponse) => {
          this.usuarios = response.data;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.globalErrorMessage = this.extractErrorMessage(err, 'Erro ao carregar usuários.');
          this.loading = false;
          this.usuarios = [];
          console.error('Erro ao carregar usuários:', err);
          this.clearGlobalMessages(7000);
        }
      });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  openModal(mode: 'create' | 'edit', user?: User): void {
    this.modalMode = mode;
    this.userForm.reset(); 
    this.modalErrorMessage = '';
    this.showPasswordFields = mode === 'create'; 

    this.updatePasswordValidators();

    if (mode === 'edit' && user) {
      this.selectedUserId = user._id;
      this.userForm.patchValue({
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        departamento: user.departamento || null,
        telefone: user.telefone || '',
        ativo: user.ativo !== undefined ? user.ativo : true
      });
    } else { 
      this.selectedUserId = null;
      this.userForm.patchValue({ 
        ativo: true,
        tipo: null,
        departamento: null
      });
    }
    this.showModal = true;
  }

  togglePasswordFields(): void {
    this.showPasswordFields = !this.showPasswordFields;
    this.userForm.get('senha')?.reset(); 
    this.userForm.get('confirmarSenha')?.reset();
    this.updatePasswordValidators(); 
  }

  private updatePasswordValidators(): void {
    const senhaControl = this.userForm.get('senha');
    const confirmarSenhaControl = this.userForm.get('confirmarSenha');

    if (this.modalMode === 'create' || (this.modalMode === 'edit' && this.showPasswordFields)) {
      senhaControl?.setValidators([Validators.required, Validators.minLength(6)]);
      confirmarSenhaControl?.setValidators([Validators.required]);
    } else {
      senhaControl?.clearValidators();
      confirmarSenhaControl?.clearValidators();
    }
    senhaControl?.updateValueAndValidity();
    confirmarSenhaControl?.updateValueAndValidity();
  }

  closeModal(): void {
    this.showModal = false;
    this.submitting = false;
    this.selectedUserId = null;
    this.userForm.reset();
    this.modalErrorMessage = '';
    this.showPasswordFields = false; 
  }

  onSubmitModal(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched(); 
      this.modalErrorMessage = "Por favor, corrija os erros no formulário.";
      this.clearModalMessages(4000);
      return;
    }

    this.submitting = true;
    this.modalErrorMessage = '';
    
    const userData: Partial<User> = { ...this.userForm.value };
    if (!userData.senha) { 
        delete userData.senha;
    }
    delete userData.confirmarSenha; 

    if (this.modalMode === 'create') {
      this.userService.createUser(userData as User).subscribe({ 
        next: (novoUser) => {
          this.submitting = false;
          this.successMessage = `Usuário "${novoUser.nome}" criado com sucesso!`;
          this.closeModal();
          this.loadUsers();
          this.clearGlobalMessages();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.modalErrorMessage = this.extractErrorMessage(err, 'Erro ao criar usuário.');
          console.error('Erro ao criar usuário:', err);
          this.clearModalMessages(7000);
        }
      });
    } else if (this.modalMode === 'edit' && this.selectedUserId) {
      this.userService.updateUser(this.selectedUserId, userData).subscribe({
        next: (userAtualizado) => {
          this.submitting = false;
          this.successMessage = `Usuário "${userAtualizado.nome}" atualizado com sucesso!`;
          this.closeModal();
          this.loadUsers();
          this.clearGlobalMessages();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.modalErrorMessage = this.extractErrorMessage(err, 'Erro ao atualizar usuário.');
          console.error('Erro ao atualizar usuário:', err);
          this.clearModalMessages(7000);
        }
      });
    }
  }

  toggleUserStatus(user: User): void {
    if (!user._id) {
        this.globalErrorMessage = "ID do usuário inválido.";
        this.clearGlobalMessages(5000);
        return;
    }
    const novoStatus = !user.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    if (confirm(`Tem certeza que deseja ${acao} o usuário "${user.nome}"?`)) {
      this.userService.updateUserStatus(user._id, { ativo: novoStatus }).subscribe({ // Assumindo updateUserStatus ou updateUser aceita Partial<User>
        next: (userAtualizado) => {
          this.successMessage = `Usuário "${userAtualizado.nome}" ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`;
          const index = this.usuarios.findIndex(u => u._id === user._id);
          if (index > -1) {
            const usuariosAtualizados = [...this.usuarios];
            usuariosAtualizados[index] = userAtualizado;
            this.usuarios = usuariosAtualizados;
          }
          this.clearGlobalMessages();
        },
        error: (err: HttpErrorResponse) => {
          this.globalErrorMessage = this.extractErrorMessage(err, `Erro ao ${acao} usuário.`);
          console.error(`Erro ao ${acao} usuário:`, err);
          this.clearGlobalMessages(7000);
        }
      });
    }
  }

  confirmDelete(user: User): void {
    if (!user._id) {
        this.globalErrorMessage = "ID do usuário inválido para exclusão.";
        this.clearGlobalMessages(5000);
        return;
    }
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.nome} (${user.email})"? Esta ação não pode ser desfeita.`)) {
      if(user._id) { // Verificação adicional para o compilador
        this.deleteUser(user._id);
      }
    }
  }

  private deleteUser(id: string): void {
    this.loading = true;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Usuário excluído com sucesso!';
        if (this.usuarios.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadUsers();
        this.clearGlobalMessages();
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.globalErrorMessage = this.extractErrorMessage(err, 'Erro ao excluir usuário.');
        console.error('Erro ao excluir usuário:', err);
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