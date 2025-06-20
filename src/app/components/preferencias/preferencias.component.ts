// --- START OF FILE preferencias.component.ts ---

import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Adicionado Router e RouterModule
import { PreferenciasService, Preferencia, ApiResponse as PreferenciaApiResponse } from '../../services/preferencias.service';
import { DisciplinaService, Disciplina } from '../../services/disciplina.service';
import { HorariosService } from '../../services/horarios.service';
import { AuthService } from '../../services/auth.service'; // NECESSÁRIO PARA O HEADER
import { User } from '../../models/auth.model'; // NECESSÁRIO PARA O HEADER

declare var bootstrap: any;

interface DisciplinaSelecionadaUi {
  disciplina: Disciplina;
  preferencia: number;
}
type DisponibilidadeItemUi = Preferencia['disponibilidadeHorarios'][0];

@Component({
  selector: 'app-preferencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule], // Adicionado RouterModule
  template: `
    <div class="dashboard-container"> <!-- CLASSE DO DASHBOARD PARA ESTILO GLOBAL -->
      <!-- Header REPLICADO DO DisciplinasComponent -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Sistema de Geração de Horários</h1>
          <div class="user-info">
            <span>Olá, {{ currentUser?.nome }}</span>
            <button class="btn-logout" (click)="logout()">Sair</button>
          </div>
        </div>
      </header>

      <!-- Sidebar REPLICADA DO DisciplinasComponent -->
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

      <!-- Main Content ONDE O CONTEÚDO DAS PREFERÊNCIAS SERÁ INSERIDO -->
      <main class="main-content">
        <!-- Conteúdo específico do PreferenciasComponent -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title mb-0">
              <i class="fas fa-cog me-2"></i>
              Minhas Preferências
            </h4>
            <p class="text-muted mb-0">Configure suas disciplinas e horários de disponibilidade</p>
          </div>
          <div class="card-body">
            <form [formGroup]="preferenciasForm" (ngSubmit)="salvarPreferencias()">

              <!-- Seção de Disciplinas -->
              <div class="mb-4">
                <h5 class="mb-3">
                  <i class="fas fa-book me-2"></i>
                  Disciplinas Preferidas
                </h5>
                <div class="mb-3">
                  <div class="row g-2 align-items-end">
                    <div class="col-md-7">
                      <label class="form-label visually-hidden">Selecionar disciplina</label>
                      <select class="form-select" [(ngModel)]="novaDisciplinaId" [ngModelOptions]="{standalone: true}">
                        <option value="">Selecione uma disciplina...</option>
                        <option *ngFor="let disciplina of disciplinasDisponiveis" [value]="disciplina._id">
                          {{disciplina.codigo}} - {{disciplina.nome}}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label visually-hidden">Nível de Preferência</label>
                      <select class="form-select" [(ngModel)]="novaPreferenciaNivel" [ngModelOptions]="{standalone: true}">
                        <option value="1">1 - Baixa</option>
                        <option value="2">2</option>
                        <option value="3">3 - Média</option>
                        <option value="4">4</option>
                        <option value="5">5 - Alta</option>
                      </select>
                    </div>
                    <div class="col-md-2">
                      <button type="button" class="btn btn-primary w-100" (click)="adicionarDisciplina()">
                        <i class="fas fa-plus"></i> Adicionar
                      </button>
                    </div>
                  </div>
                </div>
                <div class="table-responsive" *ngIf="disciplinasSelecionadas.length > 0">
                  <table class="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nome</th>
                        <th>C.H.</th>
                        <th>Preferência</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of disciplinasSelecionadas; let i = index">
                        <td>{{item.disciplina.codigo}}</td>
                        <td>{{item.disciplina.nome}}</td>
                        <td>{{item.disciplina.cargaHoraria || '-'}}h</td>
                        <td>
                          <select class="form-select form-select-sm" [(ngModel)]="item.preferencia" [ngModelOptions]="{standalone: true}" (change)="marcarComoModificado()">
                            <option value="1">1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5</option>
                          </select>
                        </td>
                        <td>
                          <button type="button" class="btn btn-sm btn-danger" (click)="removerDisciplina(i)">
                            <i class="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p *ngIf="disciplinasSelecionadas.length === 0" class="text-muted">Nenhuma disciplina adicionada.</p>
              </div>

              <!-- Seção de Disponibilidade de Horários -->
              <div class="mb-4">
                <h5 class="mb-3"> <i class="fas fa-clock me-2"></i> Disponibilidade de Horários </h5>
                <div class="mb-3">
                  <div class="row g-2 align-items-end">
                    <div class="col-md-3 col-6">
                      <label class="form-label visually-hidden">Dia da semana</label>
                      <select class="form-select" [(ngModel)]="novaDisponibilidade.diaSemana" [ngModelOptions]="{standalone: true}">
                        <option value="">Dia da semana</option>
                        <option *ngFor="let dia of diasSemana" [value]="dia.valor">{{dia.label}}</option>
                      </select>
                    </div>
                    <div class="col-md-2 col-6">
                      <label class="form-label visually-hidden">Turno</label>
                      <select class="form-select" [(ngModel)]="novaDisponibilidade.turno" [ngModelOptions]="{standalone: true}">
                        <option value="">Turno</option>
                        <option *ngFor="let turno of turnos" [value]="turno.valor">{{turno.label}}</option>
                      </select>
                    </div>
                    <div class="col-md-2 col-6">
                      <label class="form-label visually-hidden">Início</label>
                      <select class="form-select" [(ngModel)]="novaDisponibilidade.horarioInicio" [ngModelOptions]="{standalone: true}">
                        <option value="">Início</option>
                        <option *ngFor="let horario of horariosDisponiveis" [value]="horario">{{horario}}</option>
                      </select>
                    </div>
                    <div class="col-md-2 col-6">
                      <label class="form-label visually-hidden">Fim</label>
                      <select class="form-select" [(ngModel)]="novaDisponibilidade.horarioFim" [ngModelOptions]="{standalone: true}">
                        <option value="">Fim</option>
                        <option *ngFor="let horario of horariosDisponiveis" [value]="horario">{{horario}}</option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <button type="button" class="btn btn-primary w-100" (click)="adicionarDisponibilidade()">
                        <i class="fas fa-plus"></i> Adicionar
                      </button>
                    </div>
                  </div>
                </div>
                <div class="table-responsive" *ngIf="disponibilidadeHorariosUI.length > 0">
                  <table class="table table-striped table-hover">
                    <thead> <tr> <th>Dia da Semana</th> <th>Turno</th> <th>Horários Disponíveis</th> <th>Ações</th> </tr> </thead>
                    <tbody>
                      <tr *ngFor="let disp of disponibilidadeHorariosUI; let i = index">
                        <td>{{getDiaLabel(disp.diaSemana)}}</td> <td>{{getTurnoLabel(disp.turno)}}</td>
                        <td> <span *ngFor="let horario of disp.horarios; let j = index" class="badge bg-light text-dark me-1"> {{horario.inicio}} - {{horario.fim}} </span> </td>
                        <td> <button type="button" class="btn btn-sm btn-danger" (click)="removerDisponibilidade(i)"> <i class="fas fa-trash"></i> </button> </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p *ngIf="disponibilidadeHorariosUI.length === 0" class="text-muted">Nenhuma disponibilidade adicionada.</p>
              </div>

              <!-- Seção de Configurações Gerais -->
              <div class="row mb-4">
                <div class="col-md-6">
                  <h5 class="mb-3"> <i class="fas fa-sliders-h me-2"></i> Configurações Gerais </h5>
                  <div class="mb-3">
                    <label for="cargaHorariaMaxima" class="form-label">Carga Horária Máxima Semanal (horas)</label>
                    <input type="number" class="form-control" id="cargaHorariaMaxima" formControlName="cargaHorariaMaxima" min="1" max="40" placeholder="Ex: 20">
                    <div *ngIf="preferenciasForm.get('cargaHorariaMaxima')?.invalid && preferenciasForm.get('cargaHorariaMaxima')?.touched" class="text-danger small mt-1"> Carga horária deve ser entre 1 e 40. </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h5 class="mb-3"> <i class="fas fa-comment me-2"></i> Observações </h5>
                  <div class="mb-3"> <textarea class="form-control" formControlName="observacoes" rows="4" placeholder="Observações adicionais sobre suas preferências..."></textarea> </div>
                </div>
              </div>

              <!-- Botões de Ação -->
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary" (click)="resetarFormComRecarga()"> <i class="fas fa-undo me-2"></i> Descartar Alterações </button>
                <button type="submit" class="btn btn-success" [disabled]="carregando || !formularioModificado">
                  <i class="fas fa-save me-2"></i>
                  <span *ngIf="carregando">Salvando...</span> <span *ngIf="!carregando">Salvar Preferências</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal de Sucesso/Erro -->
        <div class="modal fade" #mensagemModalEl tabindex="-1" aria-labelledby="mensagemModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header" [ngClass]="{'bg-success text-white': mensagem.tipo === 'success', 'bg-danger text-white': mensagem.tipo === 'error', 'bg-warning text-dark': mensagem.tipo === 'warning', 'bg-info text-white': mensagem.tipo === 'info'}">
                <h5 class="modal-title" id="mensagemModalLabel"> <i [class]="getIconeModal()"></i> {{mensagem.titulo}} </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body"> {{mensagem.texto}} </div>
              <div class="modal-footer"> <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button> </div>
            </div>
          </div>
        </div>
        <!-- FIM DO CONTEÚDO ESPECÍFICO -->
      </main>
    </div>
  `,
  // ESTILOS: COPIAR OS ESTILOS DO DASHBOARD (HEADER, SIDEBAR, MAIN-CONTENT)
  // E ADICIONAR OS ESTILOS ESPECÍFICOS DO PreferenciasComponent (CARD, TABELAS INTERNAS)
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
    .main-content { margin-left: 250px; padding: 30px; min-height: calc(100vh - 60px); background-color: #f9fbfd; /* Cor de fundo suave para a área de conteúdo */ }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); /* Esconder sidebar por padrão em mobile, você precisará de um botão para alternar */ }
      .main-content { margin-left: 0; padding: 20px; }
      .header-content h1 { font-size: 16px; }
    }
    `,
    // === ESTILOS ESPECÍFICOS DO PreferenciasComponent (CARD, TABELAS, ETC.) ===
    `
    .card {
      border: none;
      box-shadow: 0 0.1rem 0.3rem rgba(0,0,0,0.07);
      background-color: #fff; /* Garantir fundo branco para o card */
      border-radius: 8px; /* Bordas arredondadas para o card */
    }
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #e1e5e9; /* Linha sutil */
      padding: 1rem 1.25rem; /* Ajuste de padding */
    }
    .card-title {
        font-weight: 600; /* Título do card mais forte */
    }
    .card-body {
        padding: 1.5rem; /* Mais padding no corpo do card */
    }
    .table th {
      font-weight: 600;
      background-color: #f8f9fa;
      border-top: none; /* Remover borda superior do header da tabela */
    }
    .table-hover tbody tr:hover {
        background-color: #f1f3f5;
    }
    .btn-sm {
      padding: 0.2rem 0.4rem;
      font-size: 0.8rem;
    }
    .form-select-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      height: calc(1.5em + 0.5rem + 2px);
    }
    .visually-hidden {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }
    .badge.bg-light {
        font-size: 0.9em; padding: 0.4em 0.6em; border: 1px solid #dee2e6; /* Adiciona uma borda sutil ao badge */
    }
    .form-label { /* Estilo para labels que não são visually-hidden */
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }
    .btn-primary { /* Já definido nos estilos do dashboard, mas pode ser sobrescrito se necessário */
        /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
        /* border: none; */
    }
    .btn-primary:hover {
        /* opacity: 0.9; */
    }
    .btn-outline-secondary {
        border-color: #6c757d;
        color: #6c757d;
    }
    .btn-outline-secondary:hover {
        background-color: #6c757d;
        color: #fff;
    }
    /* Estilos para o modal (se necessário, além do Bootstrap) */
    .modal-header .btn-close-white { filter: invert(1) grayscale(100%) brightness(200%); }
    `
  ]
})
export class PreferenciasComponent implements OnInit, AfterViewInit {
  @ViewChild('mensagemModalEl') mensagemModalEl!: ElementRef;
  private modalInstancia: any;

  // Propriedades para o header replicado
  currentUser: User | null = null;

  preferenciasForm: FormGroup;
  carregando = false;
  formularioModificado = false;

  disciplinasDisponiveis: Disciplina[] = [];
  disciplinasSelecionadas: DisciplinaSelecionadaUi[] = [];
  disponibilidadeHorariosUI: DisponibilidadeItemUi[] = [];

  novaDisciplinaId = '';
  novaPreferenciaNivel: number = 3;
  novaDisponibilidade = {
    diaSemana: '',
    turno: '',
    horarioInicio: '',
    horarioFim: ''
  };

  diasSemana: { valor: string; label: string }[] = [];
  turnos: { valor: string; label: string }[] = [];
  horariosDisponiveis: string[] = [];

  mensagem: { tipo: 'success' | 'error' | 'warning' | 'info'; titulo: string; texto: string } =
    { tipo: 'success', titulo: '', texto: '' };

  constructor(
    private fb: FormBuilder,
    private router: Router, // Adicionado Router
    private authService: AuthService, // Adicionado AuthService
    private preferenciasService: PreferenciasService,
    private disciplinaService: DisciplinaService,
    private horariosService: HorariosService
  ) {
    this.preferenciasForm = this.fb.group({
      cargaHorariaMaxima: [20, [Validators.required, Validators.min(1), Validators.max(40)]],
      observacoes: ['', Validators.maxLength(1000)]
    });
  }

  ngOnInit() {
    // Carregar dados para o header replicado
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.carregarDadosIniciais();
    this.carregarOpcoesParaSelects();

    this.preferenciasForm.valueChanges.subscribe(() => {
      this.marcarComoModificado();
    });
  }

  ngAfterViewInit() {
    if (this.mensagemModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      this.modalInstancia = new bootstrap.Modal(this.mensagemModalEl.nativeElement);
    } else {
      console.warn('Bootstrap Modal não pôde ser inicializado.');
    }
  }

  // Função logout para o header replicado
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  marcarComoModificado() {
    this.formularioModificado = true;
  }

  carregarDadosIniciais() {
    this.carregando = true;
    this.formularioModificado = false;

    this.disciplinaService.getDisciplinas().subscribe({
      // next: (response: DisciplinaApiResponse<{ disciplinas: Disciplina[] }>) => {
      //   if (response.success && response.data) {
      //     this.disciplinasDisponiveis = response.data.disciplinas || [];
      //   }
      //   this.carregarPreferenciasDoUsuario();
      // },
      // error: (error) => {
      //   console.error('Erro crítico ao carregar disciplinas:', error);
      //   this.mostrarMensagem('error', 'Erro de Carregamento', 'Não foi possível carregar as disciplinas para seleção.');
      //   this.carregando = false;
      // }
    });
  }

  carregarPreferenciasDoUsuario() {
    this.preferenciasService.getMinhasPreferencias().subscribe({
      next: (response: PreferenciaApiResponse<Preferencia>) => {
        if (response.success && response.data) {
          const prefData = response.data;
          // this.disciplinasSelecionadas = (prefData.disciplinas || []).map(dp => {
          //   const disciplinaId = typeof dp.disciplina === 'string' ? dp.disciplina : (dp.disciplina as any)?._id;
          //   const discCompleta = this.disciplinasDisponiveis.find(d => d._id === disciplinaId);
          //   return {
          //     disciplina: discCompleta || { _id: disciplinaId, nome: 'Disciplina Desconhecida', codigo: 'N/A', cargaHoraria: 0 },
          //     preferencia: dp.preferencia
          //   };
          // }).filter(ds => ds.disciplina && ds.disciplina._id);
          // this.disponibilidadeHorariosUI = prefData.disponibilidadeHorarios ? JSON.parse(JSON.stringify(prefData.disponibilidadeHorarios)) : [];
          // this.preferenciasForm.patchValue({
          //   cargaHorariaMaxima: prefData.cargaHorariaMaxima || 20,
          //   observacoes: prefData.observacoes || ''
          // }, { emitEvent: false });
        }
        this.carregando = false;
        this.formularioModificado = false;
      },
      error: (error) => {
        console.error('Erro ao carregar preferências:', error);
        this.mostrarMensagem('error', 'Erro de Carregamento', 'Não foi possível carregar suas preferências.');
        this.carregando = false;
      }
    });
  }

  carregarOpcoesParaSelects() {
    this.diasSemana = this.horariosService.getDiasSemana();
    this.turnos = this.horariosService.getTurnos();
    this.horariosDisponiveis = this.horariosService.getHorariosDisponiveis();
  }

  adicionarDisciplina() {
    if (!this.novaDisciplinaId) {
      this.mostrarMensagem('warning', 'Seleção Inválida', 'Por favor, selecione uma disciplina.');
      return;
    }
    const jaSelecionada = this.disciplinasSelecionadas.find(item => item.disciplina._id === this.novaDisciplinaId);
    if (jaSelecionada) {
      this.mostrarMensagem('warning', 'Disciplina Duplicada', 'Esta disciplina já foi adicionada.');
      return;
    }
    const disciplinaEncontrada = this.disciplinasDisponiveis.find(d => d._id === this.novaDisciplinaId);
    if (disciplinaEncontrada) {
      this.disciplinasSelecionadas.push({
        disciplina: disciplinaEncontrada,
        preferencia: Number(this.novaPreferenciaNivel)
      });
      this.novaDisciplinaId = ''; this.novaPreferenciaNivel = 3; this.marcarComoModificado();
    } else {
      this.mostrarMensagem('error', 'Erro', 'Disciplina não encontrada.');
    }
  }

  removerDisciplina(index: number) {
    this.disciplinasSelecionadas.splice(index, 1);
    this.marcarComoModificado();
  }

  adicionarDisponibilidade() {
    const { diaSemana, turno, horarioInicio, horarioFim } = this.novaDisponibilidade;
    if (!diaSemana || !turno || !horarioInicio || !horarioFim) {
      this.mostrarMensagem('warning', 'Campos Incompletos', 'Preencha todos os campos da disponibilidade.');
      return;
    }
    if (horarioInicio >= horarioFim) {
      this.mostrarMensagem('error', 'Horário Inválido', 'Início deve ser anterior ao fim.');
      return;
    }
    let dispExistente = this.disponibilidadeHorariosUI.find(d => d.diaSemana === diaSemana && d.turno === turno);
    if (dispExistente) {
      const intervaloJaExiste = dispExistente.horarios.some(h => h.inicio === horarioInicio && h.fim === horarioFim);
      if (intervaloJaExiste) {
        this.mostrarMensagem('warning', 'Intervalo Duplicado', 'Este intervalo já foi adicionado.');
        return;
      }
      dispExistente.horarios.push({ inicio: horarioInicio, fim: horarioFim });
      dispExistente.horarios.sort((a,b) => a.inicio.localeCompare(b.inicio));
    } else {
      this.disponibilidadeHorariosUI.push({
        diaSemana, turno, horarios: [{ inicio: horarioInicio, fim: horarioFim }], disponivel: true
      });
    }
    this.novaDisponibilidade = { diaSemana: '', turno: '', horarioInicio: '', horarioFim: '' };
    this.marcarComoModificado();
  }

  removerDisponibilidade(index: number) {
    this.disponibilidadeHorariosUI.splice(index, 1);
    this.marcarComoModificado();
  }

  salvarPreferencias() {
    if (this.preferenciasForm.invalid) {
      this.mostrarMensagem('error', 'Dados Inválidos', 'Verifique os campos obrigatórios.');
      this.preferenciasForm.markAllAsTouched();
      return;
    }
    this.carregando = true;
    const payload: Partial<Preferencia> = {
      disciplinas: this.disciplinasSelecionadas.map(item => ({
        disciplina: item.disciplina._id, preferencia: Number(item.preferencia)
      })),
      disponibilidadeHorarios: this.disponibilidadeHorariosUI,
      cargaHorariaMaxima: this.preferenciasForm.value.cargaHorariaMaxima,
      observacoes: this.preferenciasForm.value.observacoes
    };
    this.preferenciasService.salvarMinhasPreferencias(payload).subscribe({
      next: (response: PreferenciaApiResponse<Preferencia>) => {
        this.carregando = false;
        if (response.success) {
          this.mostrarMensagem('success', 'Sucesso!', 'Preferências salvas com sucesso.');
          this.formularioModificado = false;
        } else {
          this.mostrarMensagem('error', 'Falha ao Salvar', response.message || 'Erro ao salvar.');
        }
      },
      error: (error) => {
        this.carregando = false; console.error('Erro ao salvar preferências:', error);
        this.mostrarMensagem('error', 'Erro Crítico', 'Erro ao conectar ao servidor.');
      }
    });
  }

  resetarFormComRecarga() {
    this.carregarDadosIniciais();
    this.mostrarMensagem('info', 'Alterações Descartadas', 'Dados originais recarregados.');
  }

  getDiaLabel(valor: string): string { const d = this.diasSemana.find(dia => dia.valor === valor); return d ? d.label : valor; }
  getTurnoLabel(valor: string): string { const t = this.turnos.find(turno => turno.valor === valor); return t ? t.label : valor; }
  getIconeModal(): string {
    switch(this.mensagem.tipo) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-triangle';
      case 'warning': return 'fas fa-exclamation-circle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-comment';
    }
  }
  mostrarMensagem(tipo: 'success' | 'error' | 'warning' | 'info', titulo: string, texto: string) {
    this.mensagem = { tipo, titulo, texto };
    if (this.modalInstancia) { this.modalInstancia.show(); }
    else { console.warn("Modal não inicializado:", this.mensagem); alert(`${titulo}: ${texto}`); }
  }
}