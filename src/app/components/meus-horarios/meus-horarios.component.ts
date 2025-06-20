// --- START OF FILE meus-horarios.component.ts ---

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Adicionado Router e RouterModule
import { HorariosService, HorarioGerado, GradeHorarios, HorarioItem, ApiResponse as HorarioApiResponse } from '../../services/horarios.service'; // Adicionado ApiResponse
import { AuthService } from '../../services/auth.service'; // NECESSÁRIO PARA O HEADER
import { User } from '../../models/auth.model'; // NECESSÁRIO PARA O HEADER

import { SafeHtmlPipe } from '../pipes/safe-html.pipe'; // NECESSÁRIO PARA O HEADER


@Component({
  selector: 'app-meus-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SafeHtmlPipe ], // Adicionado RouterModule
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

      <!-- Main Content ONDE O CONTEÚDO DE "MEUS HORÁRIOS" SERÁ INSERIDO -->
      <main class="main-content">
        <!-- Conteúdo específico do MeusHorariosComponent -->
        <div class="card">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h4 class="card-title mb-0">
                  <i class="fas fa-calendar-alt me-2"></i>
                  Meus Horários
                </h4>
                <p class="text-muted mb-0">Visualize seus horários gerados</p>
              </div>
              <div class="d-flex gap-2 align-items-center">
                <select class="form-select form-select-sm" style="min-width: 180px;" [(ngModel)]="semestreSelecionado" (change)="carregarHorarios()">
                  <option value="">Todos os semestres</option>
                  <option value="2024.1">2024.1</option>
                  <option value="2024.2">2024.2</option>
                  <option value="2025.1">2025.1</option>
                  <option value="2025.2">2025.2</option>
                  <option value="2026.1">2026.1</option>
                </select>
                <button class="btn btn-sm btn-primary" (click)="carregarHorarios()" [disabled]="carregando">
                  <i class="fas fa-sync-alt" [class.fa-spin]="carregando"></i>
                  <span *ngIf="!carregando"> Atualizar</span>
                  <span *ngIf="carregando"> Carregando...</span>
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">

            <div *ngIf="carregando" class="text-center py-5">
              <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Carregando...</span>
              </div>
              <p class="mt-3 fs-5">Carregando seus horários...</p>
            </div>

            <div *ngIf="!carregando && horarios.length > 0">
              <div class="row mb-3">
                <div class="col-12">
                  <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Horários Encontrados ({{horarios.length}})</h5>
                    <div class="btn-group" role="group" aria-label="Modo de Visualização">
                      <input type="radio" class="btn-check" name="visualizacao" id="lista" [(ngModel)]="modoVisualizacao" value="lista" autocomplete="off">
                      <label class="btn btn-outline-primary" for="lista"><i class="fas fa-list me-1"></i> Lista</label>

                      <input type="radio" class="btn-check" name="visualizacao" id="grade" [(ngModel)]="modoVisualizacao" value="grade" autocomplete="off">
                      <label class="btn btn-outline-primary" for="grade"><i class="fas fa-table me-1"></i> Grade</label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Visualização em Lista (Accordion) -->
              <div *ngIf="modoVisualizacao === 'lista'" class="row">
                <div class="col-12">
                  <div class="accordion" id="horariosAccordion">
                    <div class="accordion-item" *ngFor="let horario of horarios; let i = index">
                      <h2 class="accordion-header" [id]="'heading' + i">
                        <button
                          class="accordion-button"
                          [class.collapsed]="i !== 0"
                          type="button"
                          data-bs-toggle="collapse"
                          [attr.data-bs-target]="'#collapse' + i"
                          [attr.aria-expanded]="i === 0"
                          [attr.aria-controls]="'collapse' + i">
                          <div class="d-flex justify-content-between align-items-center w-100 me-3">
                            <div>
                              <strong>{{horario.titulo}}</strong>
                              <span class="badge bg-primary ms-2">{{horario.semestre}}</span>
                            </div>
                            <div class="text-end">
                              <small class="text-muted">
                                Score: {{horario.fitnessScore !== undefined ? horario.fitnessScore.toFixed(0) + '%' : 'N/A'}} |
                                {{horario.criadoEm | date:'dd/MM/yyyy HH:mm'}}
                              </small>
                            </div>
                          </div>
                        </button>
                      </h2>
                      <div [id]="'collapse' + i"
                           class="accordion-collapse collapse"
                           [class.show]="i === 0"
                           [attr.aria-labelledby]="'heading' + i"
                           data-bs-parent="#horariosAccordion">
                        <div class="accordion-body">
                          <div class="grade-horarios-container">
                            <ng-container *ngIf="horario.grade" [ngTemplateOutlet]="gradeTemplate" [ngTemplateOutletContext]="{grade: horario.grade, titulo: horario.titulo}"></ng-container>
                            <p *ngIf="!horario.grade || isEmptyGrade(horario.grade)" class="text-muted text-center py-3">Nenhuma aula alocada para este horário.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Visualização em Grade Única -->
              <div *ngIf="modoVisualizacao === 'grade'" class="row">
                <div class="col-12 mb-3">
                  <label for="selectHorarioGrade" class="form-label">Selecione um horário para visualizar na grade:</label>
                  <select id="selectHorarioGrade" class="form-select" [(ngModel)]="horarioSelecionadoId" (change)="selecionarHorarioParaGrade()">
                    <option value="">-- Selecione --</option>
                    <option *ngFor="let horario of horarios" [value]="horario.id">
                      {{horario.titulo}} - {{horario.semestre}} (Score: {{horario.fitnessScore !== undefined ? horario.fitnessScore.toFixed(0) + '%' : 'N/A'}})
                    </option>
                  </select>
                </div>
                <div class="col-12" *ngIf="gradeSelecionada">
                  <h5 class="mb-3">Grade: {{ tituloGradeSelecionada }}</h5>
                  <ng-container [ngTemplateOutlet]="gradeTemplate" [ngTemplateOutletContext]="{grade: gradeSelecionada, titulo: tituloGradeSelecionada}"></ng-container>
                </div>
                <div class="col-12" *ngIf="!gradeSelecionada && horarioSelecionadoId !== ''">
                    <p class="text-muted text-center py-3">Selecione um horário acima para ver a grade detalhada.</p>
                </div>
              </div>
            </div>

            <div *ngIf="!carregando && horarios.length === 0" class="text-center py-5">
              <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <h5 class="text-muted">Nenhum horário encontrado</h5>
              <p class="text-muted">Você ainda não possui horários gerados para o semestre "{{semestreSelecionado || 'Todos'}}" ou nenhum horário foi gerado ainda.</p>
              <button class="btn btn-lg btn-primary" routerLink="/gerar-horario">
                <i class="fas fa-plus me-2"></i>
                Gerar Novo Horário
              </button>
            </div>
          </div>
        </div>
        <!-- FIM DO CONTEÚDO ESPECÍFICO -->
      </main>
    </div>

    <!-- Template da Grade de Horários -->
    <ng-template #gradeTemplate let-grade="grade" let-titulo="titulo">
      <div class="table-responsive grade-table-wrapper">
        <table class="table table-bordered table-hover grade-table">
          <thead class="table-light">
            <tr>
              <th class="text-center sticky-col" style="width: 100px;">Horário</th>
              <th class="text-center">Segunda</th>
              <th class="text-center">Terça</th>
              <th class="text-center">Quarta</th>
              <th class="text-center">Quinta</th>
              <th class="text-center">Sexta</th>
              <th class="text-center">Sábado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let slot of getHorariosSlots(grade)">
              <td class="text-center sticky-col horario-slot">
                <strong>{{slot.horario}}</strong>
              </td>
              <td [innerHTML]="slot['segunda'] | safeHtml"></td>
              <td [innerHTML]="slot['terca'] | safeHtml"></td>
              <td [innerHTML]="slot['quarta'] | safeHtml"></td>
              <td [innerHTML]="slot['quinta'] | safeHtml"></td>
              <td [innerHTML]="slot['sexta'] | safeHtml"></td>
              <td [innerHTML]="slot['sabado'] | safeHtml"></td>
            </tr>
            <tr *ngIf="getHorariosSlots(grade).length === 0">
                <td colspan="7" class="text-center text-muted py-3">Nenhuma aula alocada nesta grade.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>
  `,
  // ESTILOS: COPIAR OS ESTILOS DO DASHBOARD (HEADER, SIDEBAR, MAIN-CONTENT)
  // E ADICIONAR OS ESTILOS ESPECÍFICOS DO MeusHorariosComponent
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
    .main-content { margin-left: 250px; padding: 20px; /* Reduzido padding para consistência */ min-height: calc(100vh - 60px); background-color: #f9fbfd; }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .main-content { margin-left: 0; padding: 15px; }
      .header-content h1 { font-size: 16px; }
      .d-flex.gap-2 { flex-direction: column; align-items: stretch !important; }
      .d-flex.gap-2 .form-select, .d-flex.gap-2 .btn { width: 100%; margin-bottom: 0.5rem; }
    }
    `,
    // === ESTILOS ESPECÍFICOS DO MeusHorariosComponent ===
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
    .card-title {
        font-weight: 600;
    }
    .card-body {
        padding: 1.5rem;
    }
    .grade-table-wrapper {
        max-height: 600px; /* Altura máxima para a tabela com scroll */
        overflow: auto;
    }
    .grade-table {
      font-size: 0.85rem; /* Tamanho de fonte um pouco menor para caber mais info */
      border-collapse: separate; /* Para border-radius funcionar em th/td */
      border-spacing: 0;
      width: 100%;
    }
    .grade-table th, .grade-table td {
      vertical-align: top;
      padding: 0.4rem; /* Padding menor nas células */
      min-height: 50px; /* Altura mínima menor */
      border: 1px solid #dee2e6; /* Bordas mais claras */
      text-align: left;
    }
    .grade-table th.sticky-col, .grade-table td.sticky-col {
        position: sticky;
        left: 0;
        z-index: 1;
        background-color: #f8f9fa; /* Fundo para coluna sticky */
    }
    .grade-table thead th {
        background-color: #e9ecef; /* Fundo do header da tabela */
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 2;
    }
    .horario-slot {
      text-align: center;
      font-weight: 600;
      background-color: #f1f3f5 !important; /* Fundo do slot de horário mais pronunciado */
    }
    .disciplina-card {
      background-color: #e3f2fd;
      border: 1px solid #90caf9; /* Borda mais suave */
      border-radius: 4px;
      padding: 0.3rem 0.5rem;
      margin-bottom: 0.3rem;
      font-size: 0.78rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      line-height: 1.3;
    }
    .disciplina-codigo { font-weight: 700; color: #1565c0; margin-bottom: 2px; }
    .disciplina-nome { color: #333; display: block; margin-bottom: 2px;}
    .disciplina-sala { color: #555; font-style: italic; font-size: 0.9em; }
    .disciplina-card small { font-size: 0.85em; color: #666; display: block; margin-top: 2px; }

    .btn-check:checked + .btn-outline-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
      color: white;
    }
    .btn-outline-primary {
        border-color: #0d6efd;
        color: #0d6efd;
    }
    .btn-outline-primary:hover {
        background-color: #0d6efd;
        color: white;
    }
    .gap-2 { gap: 0.5rem; }
    .accordion-button {
        font-size: 0.95rem; /* Ajustar tamanho da fonte do botão do accordion */
    }
    .accordion-button:not(.collapsed) {
      background-color: #e7f1ff;
      color: #0c63e4;
      box-shadow: inset 0 -1px 0 rgba(0,0,0,.125);
    }
    .accordion-item {
        border: 1px solid #dee2e6; /* Borda para itens do accordion */
        margin-bottom: -1px; /* Para sobrepor bordas */
    }
    .accordion-item:first-of-type { border-top-left-radius: .375rem; border-top-right-radius: .375rem; }
    .accordion-item:last-of-type { border-bottom-left-radius: .375rem; border-bottom-right-radius: .375rem; margin-bottom: 0; }
    .fs-5 { font-size: 1.25rem !important; }
    `
  ]
})
export class MeusHorariosComponent implements OnInit {
  // Propriedades para o header replicado
  currentUser: User | null = null;

  carregando = false;
  horarios: HorarioGerado[] = []; // O tipo HorarioGerado já deve incluir a grade
  semestreSelecionado = ''; // Manter como string para o ngModel
  modoVisualizacao = 'lista'; // 'lista' ou 'grade'
  horarioSelecionadoId = ''; // Armazena o ID do horário selecionado para modo grade
  gradeSelecionada: GradeHorarios | null = null;
  tituloGradeSelecionada = '';

  // Semestres para o dropdown - poderia vir de um serviço
  semestresDisponiveis: string[] = this.gerarSemestres();


  constructor(
    private horariosService: HorariosService,
    private authService: AuthService, // Adicionado AuthService
    private router: Router // Adicionado Router
  ) { }

  ngOnInit() {
    // Carregar dados para o header replicado
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.carregarHorarios();
  }

  // Função logout para o header replicado
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  gerarSemestres(): string[] {
    const anoAtual = new Date().getFullYear();
    const semestres = [];
    for (let i = -1; i <= 1; i++) { // Ano anterior, atual e próximo
      semestres.push(`${anoAtual + i}.1`);
      semestres.push(`${anoAtual + i}.2`);
    }
    return semestres.sort();
  }

  carregarHorarios() {
    this.carregando = true;
    this.gradeSelecionada = null; // Limpar grade ao recarregar
    this.horarioSelecionadoId = ''; // Limpar seleção de horário
    this.tituloGradeSelecionada = '';

    // Ajustar para usar o tipo correto de resposta do serviço
    this.horariosService.getMeusHorarios(this.semestreSelecionado || undefined)
      .subscribe({
        next: (response: HorarioApiResponse<{ horarios: HorarioGerado[] }>) => { // Usar alias se definido no serviço
          if (response.success && response.data) {
            this.horarios = response.data.horarios || [];
            // Se estiver no modo lista e houver horários, o primeiro é expandido por padrão (controlado pelo template)
            // Se estiver no modo grade e houver horários, pode-se selecionar o primeiro automaticamente
            if (this.modoVisualizacao === 'grade' && this.horarios.length > 0) {
              // this.horarioSelecionadoId = this.horarios[0].id; // Se 'id' for a propriedade correta
              // this.selecionarHorarioParaGrade();
            }
          } else {
            this.horarios = [];
            // console.warn('Resposta sem sucesso ou sem dados:', response.message);
          }
          this.carregando = false;
        },
        error: (error) => {
          console.error('Erro ao carregar horários:', error);
          this.horarios = [];
          this.carregando = false;
          // Adicionar feedback de erro para o usuário aqui, se necessário
        }
      });
  }

  selecionarHorarioParaGrade() {
    if (this.horarioSelecionadoId) {
      const horarioEncontrado = this.horarios.find(h => h.id === this.horarioSelecionadoId);
      if (horarioEncontrado && horarioEncontrado.grade) {
        this.gradeSelecionada = horarioEncontrado.grade;
        this.tituloGradeSelecionada = horarioEncontrado.titulo;
      } else {
        this.gradeSelecionada = null;
        this.tituloGradeSelecionada = '';
      }
    } else {
      this.gradeSelecionada = null;
      this.tituloGradeSelecionada = '';
    }
  }

  getHorariosSlots(grade: GradeHorarios | null): { horario: string, [key: string]: string }[] {
    if (!grade || this.isEmptyGrade(grade)) {
      return [];
    }

    const horariosSet = new Set<string>();
    Object.values(grade).forEach((diaItens: HorarioItem[]) => {
      diaItens.forEach((item: HorarioItem) => {
        if (item && item.horarioInicio) {
          horariosSet.add(item.horarioInicio);
        }
      });
    });

    const horariosOrdenados = Array.from(horariosSet).sort((a, b) => a.localeCompare(b));

    return horariosOrdenados.map(horario => {
      const slot: { horario: string, [key: string]: string } = { horario };
      const diasDaSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

      diasDaSemana.forEach(dia => {
        const itensNesteSlot = (grade[dia as keyof GradeHorarios] || [])
          .filter((item: HorarioItem) => item.horarioInicio === horario);

        slot[dia] = itensNesteSlot.map(item => this.formatarDisciplinaParaGrade(item)).join('');
      });
      return slot;
    });
  }

  formatarDisciplinaParaGrade(item: HorarioItem): string {
    const codigo = item.disciplina?.codigo || 'N/D';
    const nome = item.disciplina?.nome || 'Disciplina';
    const sala = item.sala?.codigo || 'A definir';
    const horarioFim = item.horarioFim || '';

    return `
      <div class="disciplina-card" title="${nome} (${codigo})\nSala: ${sala}\nHorário: ${item.horarioInicio} - ${horarioFim}">
        <div class="disciplina-codigo">${codigo}</div>
        <div class="disciplina-nome">${nome.substring(0, 25)}${nome.length > 25 ? '...' : ''}</div>
        <div class="disciplina-sala"><i class="fas fa-map-marker-alt fa-xs"></i> ${sala}</div>
        <small><i class="far fa-clock fa-xs"></i> ${item.horarioInicio} - ${horarioFim}</small>
      </div>`;
  }

  isEmptyGrade(grade: GradeHorarios | null): boolean {
    if (!grade) return true;
    return Object.values(grade).every(dia => dia.length === 0);
  }
}



// Certifique-se de adicionar SafeHtmlPipe aos imports do componente se ele for usado localmente
// Se for global, já deve estar disponível.
// No caso de standalone: true no componente, o pipe precisa ser importado diretamente no array 'imports' do componente.
// Alteração feita para adicionar SafeHtmlPipe aos imports:
// imports: [CommonModule, FormsModule, RouterModule, SafeHtmlPipe],