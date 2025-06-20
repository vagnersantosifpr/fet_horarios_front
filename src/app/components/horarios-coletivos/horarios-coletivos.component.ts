import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Assumindo que HorarioColetivo e ParametrosGeracaoColetiva são definidos em horarios.service
// e adaptados conforme as necessidades deste componente.
import { HorariosService, ParametrosGeracaoColetiva, HorarioGerado } from '../../services/horarios.service';
import { UserService } from '../../services/user.service'; // Para buscar professores
import { DisciplinaService } from '../../services/disciplina.service';
import { SalaService } from '../../services/sala.service';

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: any[];
}
// Definições de Exemplo (você deve ter as suas próprias ou importá-las)
export interface Professor {
  _id: string;
  nome: string;
  departamento?: string;
  // Outros campos relevantes
}

export interface Disciplina {
  _id: string;
  nome: string;
  codigo: string;
  // Outros campos relevantes
}

export interface Sala {
  _id: string;
  nome: string;
  codigo: string;
  capacidade?: number;
  // Outros campos relevantes
}

// Interface para HorarioColetivo (adapte conforme sua estrutura real)
// Se HorarioColetivo já é importado e correto, não precisa redefinir.
// Esta é apenas para ilustrar os campos esperados pelo template.
export interface HorarioColetivoGeradoUi extends HorarioGerado {
  _id: string; // ID principal usado nas ações
  professores?: Professor[] | string[]; // Depende se você armazena objetos ou IDs
  disciplinas?: Disciplina[] | string[];
  salas?: Sala[] | string[];
  tempoExecucao?: string; // Ex: "120s" ou número de segundos
  estatisticas?: {
    totalHorarios: number;
    percentualPreferenciasAtendidas: number;
    percentualConflitos: number;
    // outras métricas
  };
}


@Component({
  selector: 'app-horarios-coletivos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatSliderModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  template: `
    <div class="horarios-coletivos-container">
      <mat-tab-group #tabGroup (selectedIndexChange)="onTabChange($event)">
        <!-- Aba: Listar Horários Coletivos -->
        <mat-tab label="Horários Coletivos">
          <div class="tab-content">
            <div class="header-section">
              <h2>Gerenciamento de Horários Coletivos</h2>
              <button mat-raised-button color="primary" (click)="irParaAbaGeracao()">
                <mat-icon>add</mat-icon>
                Novo Horário Coletivo
              </button>
            </div>

            <!-- Filtros -->
            <div class="filtros-section">
              <mat-form-field appearance="outline">
                <mat-label>Semestre</mat-label>
                <mat-select [(ngModel)]="filtroSemestre" (selectionChange)="aplicarFiltros()">
                  <mat-option value="">Todos</mat-option>
                  <mat-option *ngFor="let s of semestresDisponiveis" [value]="s">{{s}}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select [(ngModel)]="filtroStatus" (selectionChange)="aplicarFiltros()">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="PENDENTE">Pendente</mat-option>
                  <mat-option value="PROCESSANDO">Processando</mat-option>
                  <mat-option value="CONCLUIDO">Concluído</mat-option>
                  <mat-option value="ERRO">Erro</mat-option>
                  <mat-option value="CANCELADO">Cancelado</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-raised-button (click)="recarregarHorarios()">
                <mat-icon>refresh</mat-icon>
                Atualizar
              </button>
            </div>

            <!-- Loading -->
            <div *ngIf="carregando" class="loading-section">
              <mat-spinner></mat-spinner>
              <p>Carregando horários coletivos...</p>
            </div>

            <!-- Lista de horários coletivos -->
            <div *ngIf="!carregando && horariosColetivos.length > 0" class="horarios-list">
              <mat-card *ngFor="let horario of horariosColetivos" class="horario-card">
                <mat-card-header>
                  <mat-card-title>{{horario.titulo}}</mat-card-title>
                  <mat-card-subtitle>
                    Semestre: {{horario.semestre}} |
                    Criado em: {{horario.criadoEm | date:'dd/MM/yyyy HH:mm'}}
                  </mat-card-subtitle>
                  <div class="card-status">
                    <mat-chip [ngClass]="getStatusClass(horario.status)">
                      {{getStatusLabel(horario.status)}}
                    </mat-chip>
                  </div>
                </mat-card-header>

                <mat-card-content>
                  <div class="horario-info">
                    <div class="info-item">
                      <mat-icon>people</mat-icon>
                      <span>{{horario.professores?.length || 0}} professores</span>
                    </div>

                    <div class="info-item">
                      <mat-icon>school</mat-icon>
                      <span>{{horario.disciplinas?.length || 0}} disciplinas</span>
                    </div>

                    <div class="info-item">
                      <mat-icon>room</mat-icon>
                      <span>{{horario.salas?.length || 0}} salas</span>
                    </div>

                    <div class="info-item" *ngIf="horario.fitnessScore">
                      <mat-icon>assessment</mat-icon>
                      <span>Score: {{horario.fitnessScore | number:'1.0-2' }}</span>
                    </div>

                    <div class="info-item" *ngIf="horario.tempoExecucao">
                      <mat-icon>timer</mat-icon>
                      <span>Tempo: {{horario.tempoExecucao}}</span>
                    </div>
                  </div>

                  <div *ngIf="horario.status === 'CONCLUIDO' && horario.estatisticas"
                       class="estatisticas-section">
                    <h4>Estatísticas da Geração</h4>
                    <div class="estatisticas-grid">
                      <div class="stat-item">
                        <span class="stat-label">Total de Horários:</span>
                        <span class="stat-value">{{horario.estatisticas.totalHorarios}}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Preferências Atendidas:</span>
                        <span class="stat-value">{{horario.estatisticas.percentualPreferenciasAtendidas | percent:'1.0-2'}}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Conflitos:</span>
                        <span class="stat-value">{{horario.estatisticas.percentualConflitos | percent:'1.0-2'}}</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>

                <mat-card-actions>
                  <button mat-button (click)="visualizarDetalhes(horario)">
                    <mat-icon>visibility</mat-icon>
                    Ver Detalhes
                  </button>

                  <button mat-button color="warn"
                          *ngIf="horario.status === 'PROCESSANDO' || horario.status === 'PENDENTE'"
                          (click)="cancelarGeracao(horario._id)">
                    <mat-icon>cancel</mat-icon>
                    Cancelar
                  </button>

                  <button mat-button color="warn"
                          (click)="excluirHorario(horario._id)">
                    <mat-icon>delete</mat-icon>
                    Excluir
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>

            <div *ngIf="!carregando && horariosColetivos.length === 0" class="empty-state">
              <mat-icon>search_off</mat-icon>
              <h3>Nenhum horário coletivo encontrado</h3>
              <p>Nenhum horário corresponde aos filtros aplicados ou nenhum foi gerado ainda.</p>
            </div>

            <mat-paginator *ngIf="!carregando && totalHorarios > 0"
                           [length]="totalHorarios"
                           [pageSize]="pageSize"
                           [pageSizeOptions]="[5, 10, 20, 50]"
                           [pageIndex]="currentPage - 1"
                           (page)="onPageChange($event)"
                           showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-tab>

        <!-- Aba: Gerar Novo Horário Coletivo -->
        <mat-tab label="Gerar Novo">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Gerar Novo Horário Coletivo</mat-card-title>
                <mat-card-subtitle>Configure os parâmetros para gerar horários para múltiplos professores, disciplinas e salas.</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <mat-stepper [linear]="true" #stepper>
                  <!-- Passo 1: Configurações Básicas -->
                  <mat-step [stepControl]="configuracaoForm" label="Configurações Básicas">
                    <form [formGroup]="configuracaoForm">
                      <div class="step-content">
                        <mat-form-field appearance="outline">
                          <mat-label>Título do Horário Coletivo</mat-label>
                          <input matInput formControlName="titulo"
                                 placeholder="Ex: Horários 2025.1 - Departamentos X e Y">
                          <mat-error *ngIf="configuracaoForm.get('titulo')?.hasError('required')">Título é obrigatório.</mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Semestre</mat-label>
                          <mat-select formControlName="semestre">
                            <mat-option *ngFor="let s of semestresDisponiveis" [value]="s">{{s}}</mat-option>
                          </mat-select>
                          <mat-error *ngIf="configuracaoForm.get('semestre')?.hasError('required')">Semestre é obrigatório.</mat-error>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Observações (opcional)</mat-label>
                          <textarea matInput formControlName="observacoes" rows="3"
                                    placeholder="Adicione observações sobre este horário coletivo..."></textarea>
                        </mat-form-field>
                      </div>

                      <div class="step-actions">
                        <button mat-raised-button color="primary" matStepperNext [disabled]="configuracaoForm.invalid">
                          Próximo <mat-icon>navigate_next</mat-icon>
                        </button>
                      </div>
                    </form>
                  </mat-step>

                  <!-- Passo 2: Seleção de Entidades -->
                  <mat-step [stepControl]="selecaoForm" label="Selecionar Entidades">
                    <form [formGroup]="selecaoForm">
                      <div class="step-content">
                        <h4>Professores</h4>
                        <div class="selecao-container">
                          <mat-checkbox (change)="toggleTodosProfessores($event.checked)"
                                        [checked]="professoresSelecionados.length === professoresDisponiveis.length && professoresDisponiveis.length > 0"
                                        [indeterminate]="professoresSelecionados.length > 0 && professoresSelecionados.length < professoresDisponiveis.length">
                            Selecionar Todos os Professores
                          </mat-checkbox>
                          <div class="items-grid">
                            <mat-checkbox *ngFor="let professor of professoresDisponiveis"
                                          [checked]="isProfessorSelecionado(professor._id)"
                                          (change)="toggleProfessor(professor._id, $event.checked)">
                              {{professor.nome}} {{professor.departamento ? '('+professor.departamento+')' : ''}}
                            </mat-checkbox>
                          </div>
                        </div>
                        <mat-error *ngIf="submeteuPassoSelecao && professoresSelecionados.length === 0">Pelo menos um professor deve ser selecionado.</mat-error>

                        <h4>Disciplinas</h4>
                        <div class="selecao-container">
                           <mat-checkbox (change)="toggleTodasDisciplinas($event.checked)"
                                        [checked]="disciplinasSelecionadas.length === disciplinasDisponiveis.length && disciplinasDisponiveis.length > 0"
                                        [indeterminate]="disciplinasSelecionadas.length > 0 && disciplinasSelecionadas.length < disciplinasDisponiveis.length">
                            Selecionar Todas as Disciplinas
                          </mat-checkbox>
                          <div class="items-grid">
                            <mat-checkbox *ngFor="let disciplina of disciplinasDisponiveis"
                                         [checked]="isDisciplinaSelecionada(disciplina._id)"
                                         (change)="toggleDisciplina(disciplina._id, $event.checked)">
                              {{disciplina.codigo}} - {{disciplina.nome}}
                            </mat-checkbox>
                          </div>
                        </div>
                        <mat-error *ngIf="submeteuPassoSelecao && disciplinasSelecionadas.length === 0">Pelo menos uma disciplina deve ser selecionada.</mat-error>


                        <h4>Salas</h4>
                        <div class="selecao-container">
                           <mat-checkbox (change)="toggleTodasSalas($event.checked)"
                                        [checked]="salasSelecionadas.length === salasDisponiveis.length && salasDisponiveis.length > 0"
                                        [indeterminate]="salasSelecionadas.length > 0 && salasSelecionadas.length < salasDisponiveis.length">
                            Selecionar Todas as Salas
                          </mat-checkbox>
                          <div class="items-grid">
                            <mat-checkbox *ngFor="let sala of salasDisponiveis"
                                         [checked]="isSalaSelecionada(sala._id)"
                                         (change)="toggleSala(sala._id, $event.checked)">
                              {{sala.codigo}} - {{sala.nome}} {{sala.capacidade ? '(Cap: '+sala.capacidade+')' : ''}}
                            </mat-checkbox>
                          </div>
                        </div>
                         <mat-error *ngIf="submeteuPassoSelecao && salasSelecionadas.length === 0">Pelo menos uma sala deve ser selecionada.</mat-error>
                      </div>

                      <div class="step-actions">
                        <button mat-button matStepperPrevious><mat-icon>navigate_before</mat-icon> Voltar</button>
                        <button mat-raised-button color="primary" matStepperNext (click)="marcarSubmeteuPassoSelecao()"
                                [disabled]="professoresSelecionados.length === 0 || disciplinasSelecionadas.length === 0 || salasSelecionadas.length === 0">
                          Próximo <mat-icon>navigate_next</mat-icon>
                        </button>
                      </div>
                    </form>
                  </mat-step>

                  <!-- Passo 3: Parâmetros Avançados -->
                  <mat-step [stepControl]="parametrosForm" label="Parâmetros de Geração">
                    <form [formGroup]="parametrosForm">
                      <div class="step-content">
                        <h3>Parâmetros do Algoritmo Genético</h3>
                        <div class="parametros-grid">
                          <div class="parametro-item">
                            <label id="populacao-label">População: {{parametrosForm.get('populacao')?.value}}</label>
                            <mat-slider min="20" max="500" step="10" discrete="true" aria-labelledby="populacao-label">
                              <input matSliderThumb formControlName="populacao">
                            </mat-slider>
                          </div>

                          <div class="parametro-item">
                            <label id="geracoes-label">Gerações: {{parametrosForm.get('geracoes')?.value}}</label>
                            <mat-slider min="50" max="2000" step="50" discrete="true" aria-labelledby="geracoes-label">
                              <input matSliderThumb formControlName="geracoes">
                            </mat-slider>
                          </div>

                          <div class="parametro-item">
                            <label id="mutacao-label">Taxa de Mutação: {{parametrosForm.get('taxaMutacao')?.value | percent:'1.2-2'}}</label>
                            <mat-slider min="0.01" max="0.5" step="0.01" discrete="true" aria-labelledby="mutacao-label">
                              <input matSliderThumb formControlName="taxaMutacao">
                            </mat-slider>
                          </div>

                          <mat-form-field appearance="outline" class="parametro-item">
                            <mat-label>Tipo de Cruzamento</mat-label>
                            <mat-select formControlName="tipoCruzamento">
                              <mat-option [value]="0">Ponto Único</mat-option>
                              <mat-option [value]="1">Dois Pontos</mat-option>
                              <mat-option [value]="2">Uniforme</mat-option>
                            </mat-select>
                          </mat-form-field>
                        </div>

                        <h3>Otimização e Preferências</h3>
                        <div class="parametros-grid">
                            <mat-form-field appearance="outline" class="parametro-item">
                                <mat-label>Estratégia de Otimização</mat-label>
                                <mat-select formControlName="otimizacao">
                                  <mat-option value="equilibrio">Equilíbrio Geral</mat-option>
                                  <mat-option value="preferencias">Priorizar Preferências</mat-option>
                                  <mat-option value="recursos">Otimizar Recursos (Salas)</mat-option>
                                </mat-select>
                            </mat-form-field>

                            <mat-checkbox formControlName="usarPreferenciasProfessores" class="parametro-item">
                                Considerar preferências dos professores durante a geração
                            </mat-checkbox>
                        </div>
                      </div>

                      <div class="step-actions">
                        <button mat-button matStepperPrevious><mat-icon>navigate_before</mat-icon> Voltar</button>
                        <button mat-raised-button color="primary" (click)="iniciarGeracaoColetiva()"
                                [disabled]="parametrosForm.invalid || processandoGeracao">
                          <mat-icon *ngIf="!processandoGeracao">play_arrow</mat-icon>
                          <mat-spinner *ngIf="processandoGeracao" [diameter]="20" class="inline-spinner"></mat-spinner>
                          {{ processandoGeracao ? 'Gerando...' : 'Iniciar Geração' }}
                        </button>
                      </div>
                    </form>
                  </mat-step>
                </mat-stepper>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./horarios-coletivos.component.scss'] 
})
export class HorariosColetivosComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;

  configuracaoForm!: FormGroup;
  selecaoForm!: FormGroup; // Usado para validação de etapa, não para controles de input diretos
  parametrosForm!: FormGroup;

  horariosColetivos: HorarioColetivoGeradoUi[] = [];
  professoresDisponiveis: Professor[] = [];
  disciplinasDisponiveis: Disciplina[] = [];
  salasDisponiveis: Sala[] = [];

  professoresSelecionados: string[] = [];
  disciplinasSelecionadas: string[] = [];
  salasSelecionadas: string[] = [];

  carregando = false;
  processandoGeracao = false;
  submeteuPassoSelecao = false;

  filtroSemestre: string = '';
  filtroStatus: string = '';
  semestresDisponiveis: string[] = this.getSemestresDefault(); // Ou carregue dinamicamente

  currentPage: number = 1;
  pageSize: number = 10;
  totalHorarios: number = 0;

  constructor(
    private fb: FormBuilder,
    private horariosService: HorariosService,
    private userService: UserService,
    private disciplinaService: DisciplinaService,
    private salaService: SalaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.inicializarForms();
    this.carregarHorariosColetivos();
    this.carregarDadosSelecao();
  }

  getSemestresDefault(): string[] {
    const anoAtual = new Date().getFullYear();
    return [
        `${anoAtual -1}.1`, `${anoAtual -1}.2`,
        `${anoAtual}.1`, `${anoAtual}.2`,
        `${anoAtual + 1}.1`, `${anoAtual + 1}.2`
    ];
  }

  inicializarForms(): void {
    const semestreAtual = this.semestresDisponiveis.includes(this.calcularSemestreAtual()) ? this.calcularSemestreAtual() : this.semestresDisponiveis[0];

    this.configuracaoForm = this.fb.group({
      titulo: ['', Validators.required],
      semestre: [semestreAtual, Validators.required],
      observacoes: ['']
    });

    // O selecaoForm não tem controles de input, mas o grupo é útil para o MatStep
    this.selecaoForm = this.fb.group({});


    this.parametrosForm = this.fb.group({
      populacao: [100, [Validators.required, Validators.min(20), Validators.max(500)]],
      geracoes: [500, [Validators.required, Validators.min(50), Validators.max(2000)]],
      taxaMutacao: [0.1, [Validators.required, Validators.min(0.01), Validators.max(0.5)]],
      tipoCruzamento: [0, Validators.required], // 0: Ponto Único
      otimizacao: ['equilibrio', Validators.required],
      usarPreferenciasProfessores: [true]
    });
  }

  calcularSemestreAtual(): string {
    const data = new Date();
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1; // Meses são 0-indexados
    return mes <= 6 ? `${ano}.1` : `${ano}.2`;
  }


  marcarSubmeteuPassoSelecao(): void {
    this.submeteuPassoSelecao = true;
  }

  carregarDadosSelecao(): void {
    // this.userService.getProfessores().subscribe(
    //   (res: ApiResponse<{professores: Professor[]}>) => { // Ajuste o tipo de resposta do seu serviço
    //     this.professoresDisponiveis = res.data?.professores || [];
    //   },
    //   () => this.snackBar.open('Erro ao carregar professores.', 'Fechar', { duration: 3000 })
    // );

    this.disciplinaService.getDisciplinas().subscribe(
      (res: ApiResponse<{disciplinas: Disciplina[]}>) => { // Ajuste o tipo de resposta
        this.disciplinasDisponiveis = res.data?.disciplinas || [];
      },
      () => this.snackBar.open('Erro ao carregar disciplinas.', 'Fechar', { duration: 3000 })
    );

    this.salaService.getSalas().subscribe(
      (res: ApiResponse<{salas: Sala[]}>) => { // Ajuste o tipo de resposta
        this.salasDisponiveis = res.data?.salas || [];
      },
      () => this.snackBar.open('Erro ao carregar salas.', 'Fechar', { duration: 3000 })
    );
  }

  carregarHorariosColetivos(): void {
    this.carregando = true;
    // Adapte este método para o seu serviço de horários coletivos
    // this.horariosService.getHorariosColetivosPaginados( // Crie este método no serviço
    //   this.currentPage,
    //   this.pageSize,
    //   this.filtroSemestre || undefined,
    //   this.filtroStatus || undefined
    // ).subscribe(
    //   (res: ApiResponse<{ horarios: HorarioColetivoGeradoUi[], total: number }>) => {
    //     if (res.success && res.data) {
    //       this.horariosColetivos = res.data.horarios;
    //       this.totalHorarios = res.data.total;
    //     } else {
    //       this.horariosColetivos = [];
    //       this.totalHorarios = 0;
    //       this.snackBar.open(res.message || 'Erro ao carregar horários.', 'Fechar', { duration: 3000 });
    //     }
    //     this.carregando = false;
    //   },
    //   () => {
    //     this.carregando = false;
    //     this.snackBar.open('Falha ao conectar com o servidor.', 'Fechar', { duration: 3000 });
    //   }
    // );
  }

  aplicarFiltros(): void {
    this.currentPage = 1;
    this.carregarHorariosColetivos();
  }

  recarregarHorarios(): void {
    this.carregarHorariosColetivos();
  }

  irParaAbaGeracao(): void {
    if (this.tabGroup) {
        this.tabGroup.selectedIndex = 1;
    }
    if (this.stepper) {
        this.stepper.reset();
        this.configuracaoForm.reset({semestre: this.calcularSemestreAtual()});
        this.parametrosForm.reset({
            populacao: 100, geracoes: 500, taxaMutacao: 0.1, tipoCruzamento: 0,
            otimizacao: 'equilibrio', usarPreferenciasProfessores: true
        });
        this.professoresSelecionados = [];
        this.disciplinasSelecionadas = [];
        this.salasSelecionadas = [];
        this.submeteuPassoSelecao = false;
    }
  }

  onTabChange(index: number): void {
    if (index === 0) { // Aba de listagem
        this.recarregarHorarios();
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.carregarHorariosColetivos();
  }

  getStatusClass(status?: string): string {
    if (!status) return 'status-desconhecido';
    return `status-${status.toLowerCase()}`;
  }

  getStatusLabel(status?: string): string {
    if (!status) return 'Desconhecido';
    const labels: { [key: string]: string } = {
      'PENDENTE': 'Pendente',
      'PROCESSANDO': 'Processando',
      'CONCLUIDO': 'Concluído',
      'ERRO': 'Erro',
      'CANCELADO': 'Cancelado'
    };
    return labels[status.toUpperCase()] || status;
  }

  visualizarDetalhes(horario: HorarioColetivoGeradoUi): void {
    console.log('Visualizar detalhes:', horario);
    this.snackBar.open(`Detalhes de ${horario.titulo} (ID: ${horario._id}) - Implementar navegação ou dialog.`, 'OK', { duration: 3000 });
    // Ex: this.router.navigate(['/horarios/coletivos', horario._id]);
  }

  cancelarGeracao(id: string): void {
    if (!id) return;
    // Confirmação
    if(!confirm('Tem certeza que deseja cancelar a geração deste horário?')) return;

    // this.horariosService.cancelarGeracaoColetiva(id).subscribe(
    //   res => {
    //     if (res.success) {
    //       this.snackBar.open('Geração cancelada.', 'OK', { duration: 3000 });
    //       this.recarregarHorarios();
    //     } else {
    //       this.snackBar.open(res.message || 'Erro ao cancelar.', 'Fechar', { duration: 3000 });
    //     }
    //   },
    //   () => this.snackBar.open('Falha ao cancelar.', 'Fechar', { duration: 3000 })
    // );
  }

  excluirHorario(id: string): void {
    if (!id) return;
    if(!confirm('Tem certeza que deseja excluir este horário coletivo? Esta ação não pode ser desfeita.')) return;

    // this.horariosService.excluirHorarioColetivo(id).subscribe(
    //   res => {
    //     if (res.success) {
    //       this.snackBar.open('Horário excluído.', 'OK', { duration: 3000 });
    //       this.recarregarHorarios();
    //     } else {
    //       this.snackBar.open(res.message || 'Erro ao excluir.', 'Fechar', { duration: 3000 });
    //     }
    //   },
    //   () => this.snackBar.open('Falha ao excluir.', 'Fechar', { duration: 3000 })
    // );
  }

  // Métodos de seleção
  private _toggleSelecionados(id: string, listaSelecionados: string[], checked: boolean): void {
    const index = listaSelecionados.indexOf(id);
    if (checked && index === -1) {
      listaSelecionados.push(id);
    } else if (!checked && index !== -1) {
      listaSelecionados.splice(index, 1);
    }
  }

  private _toggleTodos(listaDisponiveis: {_id: string}[], listaSelecionados: string[], checked: boolean): string[] {
    return checked ? listaDisponiveis.map(item => item._id) : [];
  }

  toggleTodosProfessores(checked: boolean): void {
    this.professoresSelecionados = this._toggleTodos(this.professoresDisponiveis, this.professoresSelecionados, checked);
  }
  isProfessorSelecionado(id: string): boolean { return this.professoresSelecionados.includes(id); }
  toggleProfessor(id: string, checked: boolean): void { this._toggleSelecionados(id, this.professoresSelecionados, checked); }

  toggleTodasDisciplinas(checked: boolean): void {
    this.disciplinasSelecionadas = this._toggleTodos(this.disciplinasDisponiveis, this.disciplinasSelecionadas, checked);
  }
  isDisciplinaSelecionada(id: string): boolean { return this.disciplinasSelecionadas.includes(id); }
  toggleDisciplina(id: string, checked: boolean): void { this._toggleSelecionados(id, this.disciplinasSelecionadas, checked); }

  toggleTodasSalas(checked: boolean): void {
    this.salasSelecionadas = this._toggleTodos(this.salasDisponiveis, this.salasSelecionadas, checked);
  }
  isSalaSelecionada(id: string): boolean { return this.salasSelecionadas.includes(id); }
  toggleSala(id: string, checked: boolean): void { this._toggleSelecionados(id, this.salasSelecionadas, checked); }


  iniciarGeracaoColetiva(): void {
    if (this.configuracaoForm.invalid || this.parametrosForm.invalid ||
        this.professoresSelecionados.length === 0 ||
        this.disciplinasSelecionadas.length === 0 ||
        this.salasSelecionadas.length === 0) {
      this.snackBar.open('Preencha todos os campos obrigatórios e selecione entidades.', 'Fechar', { duration: 4000 });
      return;
    }

    this.processandoGeracao = true;
    const config = this.configuracaoForm.value;
    const paramsAlgo = this.parametrosForm.value;

    const payload: ParametrosGeracaoColetiva = {
      titulo: config.titulo,
      semestre: config.semestre,
      observacoes: config.observacoes,
      professores: this.professoresSelecionados,
      //disciplinas: this.disciplinasSelecionadas,
      //salas: this.salasSelecionadas,
      //usarPreferenciasProfessores: paramsAlgo.usarPreferenciasProfessores,
      parametros: {
        populacao: paramsAlgo.populacao,
        geracoes: paramsAlgo.geracoes,
        taxaMutacao: paramsAlgo.taxaMutacao,
        tipoCruzamento: paramsAlgo.tipoCruzamento,
        otimizacao: paramsAlgo.otimizacao
      }
    };

    this.horariosService.gerarHorarioColetivo(payload).subscribe(
      res => {
        if (res.success && res.data) {
          this.snackBar.open(`Geração do horário "${res.data.titulo || payload.titulo}" iniciada.`, 'OK', { duration: 5000 });
          this.tabGroup.selectedIndex = 0; // Volta para a lista
          this.stepper.reset();
        } else {
          this.snackBar.open(res.message || 'Erro ao iniciar geração.', 'Fechar', { duration: 5000 });
        }
        this.processandoGeracao = false;
      },
      () => {
        this.processandoGeracao = false;
        this.snackBar.open('Falha ao comunicar com o servidor para gerar horário.', 'Fechar', { duration: 5000 });
      }
    );
  }
}