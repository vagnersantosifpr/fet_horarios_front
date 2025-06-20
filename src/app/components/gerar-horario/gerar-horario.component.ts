// --- START OF FILE gerar-horario.component.ts ---

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Adicionado RouterModule
import { HorariosService, ParametrosGeracao, ParametrosGeracaoColetiva, ApiResponse as HorarioApiResponse } from '../../services/horarios.service'; // Adicionado ApiResponse
import { UserService} from '../../services/user.service'; // Adicionado ApiResponse
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model'; // NECESSÁRIO PARA O HEADER

// Interface para um professor na lista de disponíveis (simplificada)
interface ProfessorDisponivel {
  _id: string;
  nome: string;
  email: string; // Adicionado para exibição
}

@Component({
  selector: 'app-gerar-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule], // Adicionado RouterModule
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

      <!-- Main Content ONDE O CONTEÚDO DE "GERAR HORÁRIO" SERÁ INSERIDO -->
      <main class="main-content">
        <!-- Conteúdo específico do GerarHorarioComponent -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title mb-0">
              <i class="fas fa-magic me-2"></i>
              Gerar Novo Horário
            </h4>
            <p class="text-muted mb-0">Configure os parâmetros e inicie a geração do seu horário.</p>
          </div>
          <div class="card-body">

            <ul class="nav nav-tabs mb-4" id="geracaoTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="individual-tab" data-bs-toggle="tab" data-bs-target="#individual" type="button" role="tab" aria-controls="individual" aria-selected="true">
                  <i class="fas fa-user me-2"></i>Horário Individual
                </button>
              </li>
              <li class="nav-item" role="presentation" *ngIf="isAdmin">
                <button class="nav-link" id="coletivo-tab" data-bs-toggle="tab" data-bs-target="#coletivo" type="button" role="tab" aria-controls="coletivo" aria-selected="false">
                  <i class="fas fa-users me-2"></i>Horário Coletivo
                </button>
              </li>
            </ul>

            <div class="tab-content" id="geracaoTabsContent">
              <!-- Aba Individual -->
              <div class="tab-pane fade show active" id="individual" role="tabpanel" aria-labelledby="individual-tab">
                <form [formGroup]="formIndividual" (ngSubmit)="gerarHorarioIndividual()">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <h5 class="mb-3"><i class="fas fa-cog me-2"></i>Configurações Básicas</h5>
                      <div class="mb-3">
                        <label for="tituloIndividual" class="form-label">Título do Horário <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tituloIndividual" formControlName="titulo" placeholder="Ex: Horário Otimizado 2025.1">
                        <div *ngIf="formIndividual.get('titulo')?.invalid && formIndividual.get('titulo')?.touched" class="invalid-feedback d-block">Título é obrigatório.</div>
                      </div>
                      <div class="mb-3">
                        <label for="semestreIndividual" class="form-label">Semestre <span class="text-danger">*</span></label>
                        <select class="form-select" id="semestreIndividual" formControlName="semestre">
                          <option value="" disabled>Selecione o semestre</option>
                          <option *ngFor="let s of semestresDisponiveis" [value]="s">{{s}}</option>
                        </select>
                        <div *ngIf="formIndividual.get('semestre')?.invalid && formIndividual.get('semestre')?.touched" class="invalid-feedback d-block">Semestre é obrigatório.</div>
                      </div>
                      <div class="mb-3 form-check">
                        <input class="form-check-input" type="checkbox" id="usarPreferencias" formControlName="usarPreferencias">
                        <label class="form-check-label" for="usarPreferencias">Usar minhas preferências configuradas</label>
                        <small class="form-text text-muted d-block">Recomendado: <a routerLink="/preferencias">Configure suas preferências</a> antes.</small>
                      </div>
                      <div class="mb-3">
                        <label for="observacoesIndividual" class="form-label">Observações</label>
                        <textarea class="form-control" id="observacoesIndividual" formControlName="observacoes" rows="3" placeholder="Observações adicionais..."></textarea>
                      </div>
                    </div>

                    <div class="col-md-6 mb-3">
                      <h5 class="mb-3"><i class="fas fa-sliders-h me-2"></i>Parâmetros Avançados (Opcional)</h5>
                      <div class="alert alert-info py-2">
                        <small><i class="fas fa-info-circle me-1"></i>Os parâmetros padrão geralmente são suficientes. Ajuste apenas se souber o que está fazendo.</small>
                      </div>
                      <div class="mb-3">
                        <label for="populacao" class="form-label">População <small>(10-200)</small></label>
                        <input type="number" class="form-control form-control-sm" id="populacao" formControlName="populacao" min="10" max="200" placeholder="Padrão: 50">
                      </div>
                      <div class="mb-3">
                        <label for="geracoes" class="form-label">Gerações <small>(10-1000)</small></label>
                        <input type="number" class="form-control form-control-sm" id="geracoes" formControlName="geracoes" min="10" max="1000" placeholder="Padrão: 100">
                      </div>
                      <div class="mb-3">
                        <label for="taxaMutacao" class="form-label">Taxa de Mutação <small>(0.01-1.0)</small></label>
                        <input type="number" class="form-control form-control-sm" id="taxaMutacao" formControlName="taxaMutacao" min="0.01" max="1" step="0.01" placeholder="Padrão: 0.1">
                      </div>
                      <div class="mb-3">
                        <label for="tipoCruzamento" class="form-label">Tipo de Cruzamento</label>
                        <select class="form-select form-select-sm" id="tipoCruzamento" formControlName="tipoCruzamento">
                          <option value="1">Um ponto de corte</option>
                          <option value="2">Dois pontos de corte</option>
                          <option value="0">Uniforme</option> <!-- Adicionada opção -->
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" class="btn btn-outline-secondary" (click)="resetarFormIndividual()"><i class="fas fa-undo me-1"></i>Resetar</button>
                    <button type="submit" class="btn btn-primary" [disabled]="carregandoIndividual || formIndividual.invalid">
                      <i class="fas fa-magic me-1"></i>
                      <span *ngIf="carregandoIndividual">Gerando...</span>
                      <span *ngIf="!carregandoIndividual">Gerar Horário</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- Aba Coletiva -->
              <div class="tab-pane fade" id="coletivo" role="tabpanel" aria-labelledby="coletivo-tab" *ngIf="isAdmin">
                <form [formGroup]="formColetivo" (ngSubmit)="gerarHorarioColetivo()">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <h5 class="mb-3"><i class="fas fa-cog me-2"></i>Configurações Básicas</h5>
                      <div class="mb-3">
                        <label for="tituloColetivo" class="form-label">Título da Geração <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tituloColetivo" formControlName="titulo" placeholder="Ex: Horários Depto. Info 2025.1">
                        <div *ngIf="formColetivo.get('titulo')?.invalid && formColetivo.get('titulo')?.touched" class="invalid-feedback d-block">Título é obrigatório.</div>
                      </div>
                      <div class="mb-3">
                        <label for="semestreColetivo" class="form-label">Semestre <span class="text-danger">*</span></label>
                        <select class="form-select" id="semestreColetivo" formControlName="semestre">
                          <option value="" disabled>Selecione o semestre</option>
                           <option *ngFor="let s of semestresDisponiveis" [value]="s">{{s}}</option>
                        </select>
                         <div *ngIf="formColetivo.get('semestre')?.invalid && formColetivo.get('semestre')?.touched" class="invalid-feedback d-block">Semestre é obrigatório.</div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Professores <span class="text-danger">*</span></label>
                        <div class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                          <div *ngIf="professoresDisponiveis.length === 0" class="text-muted small p-2">Nenhum professor disponível.</div>
                          <div class="form-check" *ngFor="let professor of professoresDisponiveis">
                            <input class="form-check-input" type="checkbox" [id]="'prof_' + professor._id" [value]="professor._id" (change)="toggleProfessor(professor._id, $event)">
                            <label class="form-check-label" [for]="'prof_' + professor._id"> {{professor.nome}} <small>({{professor.email}})</small> </label>
                          </div>
                        </div>
                        <div *ngIf="formColetivo.get('professoresSelecionadosCtrl')?.invalid && formColetivo.get('professoresSelecionadosCtrl')?.touched" class="invalid-feedback d-block">Selecione ao menos um professor.</div>
                      </div>
                      <div class="mb-3">
                        <label for="otimizacao" class="form-label">Estratégia de Otimização</label>
                        <select class="form-select form-select-sm" id="otimizacao" formControlName="otimizacao">
                          <option value="equilibrio">Equilíbrio Geral</option>
                          <option value="preferencias">Priorizar Preferências</option>
                          <option value="recursos">Otimizar Recursos (Salas)</option>
                        </select>
                      </div>
                    </div>

                    <div class="col-md-6 mb-3">
                      <h5 class="mb-3"><i class="fas fa-sliders-h me-2"></i>Parâmetros Avançados (Opcional)</h5>
                       <div class="alert alert-warning py-2">
                        <small><i class="fas fa-exclamation-triangle me-1"></i>A geração coletiva pode ser demorada. Ajuste os parâmetros com cautela.</small>
                      </div>
                      <div class="mb-3">
                        <label for="populacaoColetivo" class="form-label">População por Professor <small>(20-300)</small></label>
                        <input type="number" class="form-control form-control-sm" id="populacaoColetivo" formControlName="populacaoColetivo" min="20" max="300" placeholder="Padrão: 50">
                      </div>
                      <div class="mb-3">
                        <label for="geracoesColetivo" class="form-label">Gerações por Professor <small>(50-1000)</small></label>
                        <input type="number" class="form-control form-control-sm" id="geracoesColetivo" formControlName="geracoesColetivo" min="50" max="1000" placeholder="Padrão: 100">
                      </div>
                       <div class="mb-3">
                        <label for="taxaMutacaoColetivo" class="form-label">Taxa de Mutação <small>(0.01-0.5)</small></label>
                        <input type="number" class="form-control form-control-sm" id="taxaMutacaoColetivo" formControlName="taxaMutacaoColetivo" min="0.01" max="0.5" step="0.01" placeholder="Padrão: 0.1">
                      </div>
                      <div class="mb-3">
                        <label for="tipoCruzamentoColetivo" class="form-label">Tipo de Cruzamento</label>
                        <select class="form-select form-select-sm" id="tipoCruzamentoColetivo" formControlName="tipoCruzamentoColetivo">
                          <option value="1">Um ponto de corte</option>
                          <option value="2">Dois pontos de corte</option>
                          <option value="0">Uniforme</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label for="observacoesColetivo" class="form-label">Observações</label>
                        <textarea class="form-control" id="observacoesColetivo" formControlName="observacoesColetivo" rows="3" placeholder="Observações sobre a geração coletiva..."></textarea>
                      </div>
                    </div>
                  </div>
                  <div class="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" class="btn btn-outline-secondary" (click)="resetarFormColetivo()"><i class="fas fa-undo me-1"></i>Resetar</button>
                    <button type="submit" class="btn btn-primary" [disabled]="carregandoColetivo || formColetivo.invalid || professoresSelecionados.length === 0">
                      <i class="fas fa-magic me-1"></i>
                      <span *ngIf="carregandoColetivo">Gerando...</span>
                      <span *ngIf="!carregandoColetivo">Gerar Horários Coletivos</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-4" *ngIf="statusGeracao.ativo">
          <div class="col-12">
            <div class="card">
              <div class="card-header bg-light">
                <h5 class="card-title mb-0">
                  <i class="fas fa-spinner fa-spin me-2" *ngIf="statusGeracao.status === 'gerando' || statusGeracao.status === 'pendente'"></i>
                  <i class="fas fa-check-circle text-success me-2" *ngIf="statusGeracao.status === 'concluido'"></i>
                  <i class="fas fa-exclamation-triangle text-danger me-2" *ngIf="statusGeracao.status === 'erro'"></i>
                  <i class="fas fa-ban text-warning me-2" *ngIf="statusGeracao.status === 'cancelado'"></i>
                  Status da Geração: {{statusGeracao.titulo}}
                </h5>
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge" [ngClass]="getStatusBadgeClass(statusGeracao.status)">
                    {{ getStatusLabel(statusGeracao.status) }}
                  </span>
                  <button class="btn btn-sm btn-outline-danger" (click)="cancelarGeracao()" *ngIf="statusGeracao.status === 'gerando' || statusGeracao.status === 'pendente'">
                    <i class="fas fa-stop me-1"></i> Cancelar
                  </button>
                </div>
                <div class="progress mb-2" style="height: 10px;">
                  <div class="progress-bar progress-bar-striped" role="progressbar"
                       [class.progress-bar-animated]="statusGeracao.status === 'gerando' || statusGeracao.status === 'pendente'"
                       [style.width.%]="statusGeracao.progresso"
                       [ngClass]="getProgressBarClass(statusGeracao.status)"
                       aria-valuenow="statusGeracao.progresso" aria-valuemin="0" aria-valuemax="100">
                       <small *ngIf="statusGeracao.progresso > 15">{{statusGeracao.progresso.toFixed(0)}}%</small>
                  </div>
                </div>
                <small class="text-muted">{{statusGeracao.mensagem}}</small>
                <div class="mt-3 text-end" *ngIf="statusGeracao.status === 'concluido' || statusGeracao.status === 'erro' || statusGeracao.status === 'cancelado'">
                  <button class="btn btn-sm btn-primary me-2" (click)="verHorarioGerado()" *ngIf="statusGeracao.status === 'concluido' && statusGeracao.horarioId">
                    <i class="fas fa-eye me-1"></i> Ver Horário
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" (click)="limparStatus()">
                    <i class="fas fa-times me-1"></i> Fechar Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- FIM DO CONTEÚDO ESPECÍFICO -->
      </main>
    </div>
  `,
  // ESTILOS: COPIAR OS ESTILOS DO DASHBOARD (HEADER, SIDEBAR, MAIN-CONTENT)
  // E ADICIONAR OS ESTILOS ESPECÍFICOS DO GerarHorarioComponent
  styles: [
    // === ESTILOS GLOBAIS DO DASHBOARD (COPIADOS DO DisciplinasComponent) ===
    `
    .dashboard-container { display: flex; flex-direction: column; height: 100vh; background-color: #f5f5f5; }
    .dashboard-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0 20px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); z-index: 1000; }
    .header-content { display: flex; justify-content: space-between; align-items: center; height: 60px; max-width: 1200px; margin: 0 auto; }
    .header-content h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .user-info { display: flex; align-items: center; gap: 15px; }
    .btn-logout { background: rgba(255, 255, 255, 0.2); color: white; border: 1px solid rgba(255, 255, 255, 0.3); padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: background-color 0.3s ease; }
    .btn-logout:hover { background: rgba(255, 255, 255, 0.3); }
    .sidebar { position: fixed; left: 0; top: 60px; width: 250px; height: calc(100vh - 60px); background: white; border-right: 1px solid #e1e5e9; overflow-y: auto; z-index: 999; }
    .nav-menu { padding: 20px 0; }
    .nav-section h3 { padding: 0 20px; margin: 20px 0 10px 0; font-size: 12px; text-transform: uppercase; color: #666; font-weight: 600; }
    .nav-item { display: flex; align-items: center; padding: 12px 20px; color: #333; text-decoration: none; transition: background-color 0.3s ease; }
    .nav-item:hover { background-color: #f8f9fa; }
    .nav-item.active { background-color: #667eea; color: white; }
    .nav-item .icon { margin-right: 12px; font-size: 18px; }
    .nav-divider { height: 1px; background: #e1e5e9; margin: 20px 0; }
    .main-content { margin-left: 250px; padding: 20px; min-height: calc(100vh - 60px); background-color: #f9fbfd; }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .main-content { margin-left: 0; padding: 15px; }
      .header-content h1 { font-size: 16px; }
    }
    `,
    // === ESTILOS ESPECÍFICOS DO GerarHorarioComponent ===
    `
    .card {
      border: none;
      box-shadow: 0 0.1rem 0.3rem rgba(0,0,0,0.07);
      background-color: #fff;
      border-radius: 8px;
    }
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #e1e5e9;
      padding: 1rem 1.25rem;
    }
    .card-title { font-weight: 600; }
    .card-body { padding: 1.5rem; }
    .nav-tabs .nav-link {
      color: #495057;
      border: 1px solid transparent;
      border-top-left-radius: 0.375rem;
      border-top-right-radius: 0.375rem;
    }
    .nav-tabs .nav-link.active {
      color: #0d6efd;
      background-color: #fff;
      border-color: #dee2e6 #dee2e6 #fff;
      font-weight: 500;
    }
    .nav-tabs .nav-link:hover:not(.active) {
        border-color: #e9ecef #e9ecef #dee2e6;
        isolation: isolate;
        background-color: #f8f9fa;
    }
    .gap-2 { gap: 0.5rem; }
    .form-check-input:checked {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
    .form-check-input:focus { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); }
    .form-label { font-weight: 500; color: #495057; margin-bottom: 0.3rem; }
    .form-control-sm { font-size: 0.875rem; padding: 0.25rem 0.5rem; }
    .form-select-sm { font-size: 0.875rem; padding: 0.25rem 0.5rem; }
    .progress { height: 10px; border-radius: 0.375rem; }
    .progress-bar { font-size: 0.7rem; }
    .alert { border-radius: 0.375rem; }
    .alert-info small, .alert-warning small { display: block; }
    .invalid-feedback { font-size: 0.8em; }
    .btn-primary {
        /* background: linear-gradient(135deg, #5664d4 0%, #2a358c 100%); */
        /* border: none; */
    }
    .btn-primary:hover {
        /* opacity: 0.9; */
    }
    .badge.bg-info { background-color: #0dcaf0 !important; }
    .badge.bg-success { background-color: #198754 !important; }
    .badge.bg-danger { background-color: #dc3545 !important; }
    .badge.bg-warning { background-color: #ffc107 !important; color: #000 !important; }
    .badge.bg-secondary { background-color: #6c757d !important; }
    `
  ]
})
export class GerarHorarioComponent implements OnInit {
  // Propriedades para o header replicado
  currentUser: User | null = null;

  formIndividual!: FormGroup; // Adicionado '!' para indicar que será inicializado no construtor
  formColetivo!: FormGroup;   // Adicionado '!'
  carregandoIndividual = false;
  carregandoColetivo = false;
  isAdmin = false;

  professoresDisponiveis: ProfessorDisponivel[] = []; // Usar interface definida
  professoresSelecionados: string[] = [];

  // Semestres para os dropdowns
  semestresDisponiveis: string[] = this.gerarSemestresParaSelecao();

  statusGeracao = {
    ativo: false,
    titulo: '',
    status: '', // 'pendente', 'gerando', 'concluido', 'erro', 'cancelado'
    progresso: 0,
    mensagem: '',
    horarioId: '' // ID do horário individual ou do job coletivo
  };

  private monitorInterval: any; // Para o intervalo de monitoramento

  constructor(
    private fb: FormBuilder,
    private horariosService: HorariosService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.tipo === 'admin';
      if (this.isAdmin) {
        this.carregarProfessores();
      }
    });

    this.formIndividual = this.fb.group({
      titulo: ['', Validators.required],
      semestre: ['', Validators.required],
      usarPreferencias: [true],
      observacoes: [''],
      populacao: [50, [Validators.min(10), Validators.max(200)]],
      geracoes: [100, [Validators.min(10), Validators.max(1000)]],
      taxaMutacao: [0.1, [Validators.min(0.01), Validators.max(1)]],
      tipoCruzamento: [1] // 1: Um ponto, 2: Dois pontos, 0: Uniforme
    });

    this.formColetivo = this.fb.group({
      titulo: ['', Validators.required],
      semestre: ['', Validators.required],
      // Adicionar um FormControl para validação de seleção de professores
      professoresSelecionadosCtrl: [null, Validators.required],
      otimizacao: ['equilibrio'],
      populacaoColetivo: [50, [Validators.min(20), Validators.max(300)]], // Ajustado min
      geracoesColetivo: [100, [Validators.min(50), Validators.max(1000)]], // Ajustado min
      taxaMutacaoColetivo: [0.1, [Validators.min(0.01), Validators.max(0.5)]],
      tipoCruzamentoColetivo: [1],
      observacoesColetivo: ['']
    });
  }

  // Função logout para o header replicado
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  gerarSemestresParaSelecao(): string[] {
    const anoAtual = new Date().getFullYear();
    const semestres = [];
    for (let i = 0; i <= 2; i++) { // Ano atual e os próximos 2 anos
        semestres.push(`${anoAtual + i}.1`);
        semestres.push(`${anoAtual + i}.2`);
    }
    return semestres;
  }


  carregarProfessores() {
    // Certificar que userService.getUsers() retorna o tipo esperado
    this.userService.getUsers(1, 1000, 'professor').subscribe({ // Paginação ampla para pegar todos os professores
      // next: (response: UserApiResponse<{ users: ProfessorDisponivel[], total: number }>) => { // Ajuste o tipo da resposta aqui
      //   if (response.success && response.data) {
      //     this.professoresDisponiveis = response.data.users || [];
      //   } else {
      //     this.professoresDisponiveis = [];
      //     console.warn('Não foi possível carregar professores:', response.message);
      //   }
      // },
      // error: (error) => {
      //   console.error('Erro ao carregar professores:', error);
      //   this.professoresDisponiveis = [];
      // }
    });
  }

  toggleProfessor(professorId: string, event: any) {
    const isChecked = event.target.checked;
    if (isChecked) {
      if (!this.professoresSelecionados.includes(professorId)) {
        this.professoresSelecionados.push(professorId);
      }
    } else {
      const index = this.professoresSelecionados.indexOf(professorId);
      if (index > -1) {
        this.professoresSelecionados.splice(index, 1);
      }
    }
    // Atualizar o valor do FormControl para validação
    this.formColetivo.get('professoresSelecionadosCtrl')?.setValue(
        this.professoresSelecionados.length > 0 ? this.professoresSelecionados : null
    );
  }

  gerarHorarioIndividual() {
    if (this.formIndividual.invalid) {
      this.formIndividual.markAllAsTouched();
      // Adicionar feedback visual/mensagem se necessário
      return;
    }
    this.carregandoIndividual = true;
    const formVal = this.formIndividual.value;
    const parametros: ParametrosGeracao = {
      titulo: formVal.titulo,
      semestre: formVal.semestre,
      usarPreferencias: formVal.usarPreferencias,
      observacoes: formVal.observacoes || undefined, // Enviar undefined se vazio
      populacao: formVal.populacao || undefined,
      geracoes: formVal.geracoes || undefined,
      taxaMutacao: formVal.taxaMutacao || undefined,
      tipoCruzamento: formVal.tipoCruzamento !== null ? Number(formVal.tipoCruzamento) : undefined
    };

    this.horariosService.gerarHorarioIndividual(parametros).subscribe({
      next: (response: HorarioApiResponse<{ horario: { _id: string, titulo: string } }>) => { // Ajuste o tipo de resposta
        this.carregandoIndividual = false;
        if (response.success && response.data?.horario) {
          this.iniciarMonitoramento(response.data.horario._id, response.data.horario.titulo);
        } else {
          this.mostrarErroGeracao(response.message || 'Falha ao iniciar geração individual.');
        }
      },
      error: (error) => {
        this.carregandoIndividual = false;
        this.mostrarErroGeracao('Erro de comunicação ao gerar horário individual.');
        console.error('Erro ao gerar horário individual:', error);
      }
    });
  }

  gerarHorarioColetivo() {
    if (this.formColetivo.invalid || this.professoresSelecionados.length === 0) {
      this.formColetivo.markAllAsTouched();
      // Adicionar feedback visual/mensagem se necessário
      return;
    }
    this.carregandoColetivo = true;
    const formVal = this.formColetivo.value;
    const parametros: ParametrosGeracaoColetiva = {
      titulo: formVal.titulo,
      semestre: formVal.semestre,
      professores: this.professoresSelecionados,
      observacoes: formVal.observacoesColetivo || undefined,
      parametros: {
        otimizacao: formVal.otimizacao,
        populacao: formVal.populacaoColetivo || undefined,
        geracoes: formVal.geracoesColetivo || undefined,
        taxaMutacao: formVal.taxaMutacaoColetivo || undefined,
        tipoCruzamento: formVal.tipoCruzamentoColetivo !== null ? Number(formVal.tipoCruzamentoColetivo) : undefined
      }
    };

    this.horariosService.gerarHorarioColetivo(parametros).subscribe({
      next: (response: HorarioApiResponse<{ job: { _id: string, titulo: string } }>) => { // Ajuste o tipo de resposta (assumindo que retorna um job)
        this.carregandoColetivo = false;
        if (response.success && response.data?.job) {
          this.iniciarMonitoramento(response.data.job._id, response.data.job.titulo);
        } else {
          this.mostrarErroGeracao(response.message || 'Falha ao iniciar geração coletiva.');
        }
      },
      error: (error) => {
        this.carregandoColetivo = false;
        this.mostrarErroGeracao('Erro de comunicação ao gerar horário coletivo.');
        console.error('Erro ao gerar horário coletivo:', error);
      }
    });
  }

  mostrarErroGeracao(mensagem: string) {
    this.statusGeracao = {
      ativo: true,
      titulo: 'Falha na Solicitação',
      status: 'erro',
      progresso: 100,
      mensagem: mensagem,
      horarioId: ''
    };
  }

  iniciarMonitoramento(horarioId: string, tituloHorario: string) {
    this.limparStatus(); // Limpa status anterior
    this.statusGeracao = {
      ativo: true,
      titulo: tituloHorario,
      status: 'pendente', // Status inicial
      progresso: 5,
      mensagem: 'Solicitação enviada, aguardando início do processamento...',
      horarioId: horarioId
    };
    this.verificarStatusGeracao(); // Primeira verificação imediata
    // Configurar intervalo para monitoramento contínuo
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    this.monitorInterval = setInterval(() => this.verificarStatusGeracao(), 5000); // Verificar a cada 5 segundos
  }

  verificarStatusGeracao() {
    if (!this.statusGeracao.horarioId || !this.statusGeracao.ativo) {
      if (this.monitorInterval) clearInterval(this.monitorInterval);
      return;
    }
    // Usar o endpoint que retorna o status do horário pelo ID
    this.horariosService.verificarStatus(this.statusGeracao.horarioId).subscribe({
      next: (response: HorarioApiResponse<{ horario: any }>) => { // 'any' pode ser ajustado para um tipo de status mais específico
        if (response.success && response.data?.horario) {
          const horario = response.data.horario;
          this.statusGeracao.status = horario.status.toLowerCase();
          this.statusGeracao.mensagem = horario.mensagemStatus || this.getMensagemPadraoStatus(horario.status);
          this.statusGeracao.progresso = horario.progresso || this.getProgressoPadraoStatus(horario.status);

          if (horario.status === 'concluido' || horario.status === 'erro' || horario.status === 'cancelado') {
            if (this.monitorInterval) clearInterval(this.monitorInterval);
            this.statusGeracao.progresso = 100;
          }
        } else {
          // Se a resposta não for sucesso ou não tiver dados, pode ser um erro temporário ou o job não existe mais
          // console.warn('Status não pôde ser verificado:', response.message);
          // Poderia parar o monitoramento ou tentar mais algumas vezes
        }
      },
      error: (error) => {
        console.error('Erro ao verificar status:', error);
        this.statusGeracao.mensagem = 'Erro ao conectar para verificar status.';
        // Não mudar status para 'erro' aqui, pois pode ser falha na verificação, não na geração
        // Considerar parar o monitoramento após várias falhas de verificação
        // if (this.monitorInterval) clearInterval(this.monitorInterval);
      }
    });
  }

  getMensagemPadraoStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'pendente': return 'Aguardando na fila de processamento...';
      case 'gerando': return 'Algoritmo em execução, otimizando horários...';
      case 'processando': return 'Processando dados e preferências...';
      case 'concluido': return 'Horário gerado com sucesso!';
      case 'erro': return 'Ocorreu um erro durante a geração.';
      case 'cancelado': return 'Geração cancelada pelo usuário.';
      default: return 'Status desconhecido...';
    }
  }

  getProgressoPadraoStatus(status: string): number {
    switch (status.toLowerCase()) {
      case 'pendente': return 10;
      case 'processando': return 30;
      case 'gerando': return 60;
      case 'concluido': case 'erro': case 'cancelado': return 100;
      default: return 0;
    }
  }

  cancelarGeracao() {
    if (!this.statusGeracao.horarioId) return;
    this.horariosService.cancelarGeracao(this.statusGeracao.horarioId).subscribe({
      next: (response: HorarioApiResponse<any>) => { // Ajuste o tipo
        if (response.success) {
          this.statusGeracao.status = 'cancelado';
          this.statusGeracao.mensagem = 'Solicitação de cancelamento enviada.';
          if (this.monitorInterval) clearInterval(this.monitorInterval);
        } else {
            this.statusGeracao.mensagem = response.message || 'Falha ao solicitar cancelamento.';
        }
      },
      error: (error) => {
        console.error('Erro ao cancelar geração:', error);
        this.statusGeracao.mensagem = 'Erro de comunicação ao tentar cancelar.';
      }
    });
  }

  verHorarioGerado() {
    // Idealmente, o backend retornaria o ID do HorarioGerado principal
    // Se for individual, é this.statusGeracao.horarioId
    // Se for coletivo, o this.statusGeracao.horarioId é o ID do JOB COLETIVO.
    // Você precisaria de uma rota para ver os resultados de um job coletivo ou navegar para a lista de horários.
    // Por simplicidade, vamos apenas navegar para a lista geral de horários.
    this.router.navigate(['/horarios']);
    this.limparStatus();
  }

  limparStatus() {
    this.statusGeracao.ativo = false;
    this.statusGeracao.horarioId = '';
    if (this.monitorInterval) clearInterval(this.monitorInterval);
  }

  resetarFormIndividual() {
    this.formIndividual.reset({
      titulo: '',
      semestre: '',
      usarPreferencias: true,
      observacoes: '',
      populacao: 50,
      geracoes: 100,
      taxaMutacao: 0.1,
      tipoCruzamento: 1
    });
  }

  resetarFormColetivo() {
    this.formColetivo.reset({
      titulo: '',
      semestre: '',
      professoresSelecionadosCtrl: null,
      otimizacao: 'equilibrio',
      populacaoColetivo: 50,
      geracoesColetivo: 100,
      taxaMutacaoColetivo: 0.1,
      tipoCruzamentoColetivo: 1,
      observacoesColetivo: ''
    });
    this.professoresSelecionados = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      if (checkbox.id.startsWith('prof_')) checkbox.checked = false;
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'bg-secondary';
      case 'gerando': case 'processando': return 'bg-info';
      case 'concluido': return 'bg-success';
      case 'erro': return 'bg-danger';
      case 'cancelado': return 'bg-warning text-dark';
      default: return 'bg-light text-dark';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'Pendente';
      case 'gerando': return 'Gerando';
      case 'processando': return 'Processando';
      case 'concluido': return 'Concluído';
      case 'erro': return 'Erro';
      case 'cancelado': return 'Cancelado';
      default: return 'Desconhecido';
    }
  }

  getProgressBarClass(status: string): string {
     switch (status?.toLowerCase()) {
      case 'concluido': return 'bg-success';
      case 'erro': return 'bg-danger';
      case 'cancelado': return 'bg-warning';
      default: return 'bg-primary'; // Para pendente, gerando, processando
    }
  }
}