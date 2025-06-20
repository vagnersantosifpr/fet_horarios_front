import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HorariosService, ParametrosGeracao, ParametrosGeracaoColetiva } from '../../services/horarios.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-gerar-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title mb-0">
                <i class="fas fa-magic me-2"></i>
                Gerar Horário
              </h4>
              <p class="text-muted mb-0">Configure os parâmetros para gerar um novo horário</p>
            </div>
            <div class="card-body">
              
              <!-- Abas de Navegação -->
              <ul class="nav nav-tabs mb-4" id="geracaoTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button 
                    class="nav-link active" 
                    id="individual-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#individual" 
                    type="button" 
                    role="tab">
                    <i class="fas fa-user me-2"></i>
                    Horário Individual
                  </button>
                </li>
                <li class="nav-item" role="presentation" *ngIf="isAdmin">
                  <button 
                    class="nav-link" 
                    id="coletivo-tab" 
                    data-bs-toggle="tab" 
                    data-bs-target="#coletivo" 
                    type="button" 
                    role="tab">
                    <i class="fas fa-users me-2"></i>
                    Horário Coletivo
                  </button>
                </li>
              </ul>

              <!-- Conteúdo das Abas -->
              <div class="tab-content" id="geracaoTabsContent">
                
                <!-- Aba Individual -->
                <div class="tab-pane fade show active" id="individual" role="tabpanel">
                  <form [formGroup]="formIndividual" (ngSubmit)="gerarHorarioIndividual()">
                    <div class="row">
                      <div class="col-md-6">
                        <h5 class="mb-3">
                          <i class="fas fa-cog me-2"></i>
                          Configurações Básicas
                        </h5>
                        
                        <div class="mb-3">
                          <label for="tituloIndividual" class="form-label">Título do Horário *</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            id="tituloIndividual"
                            formControlName="titulo"
                            placeholder="Ex: Horário 2025.1">
                        </div>

                        <div class="mb-3">
                          <label for="semestreIndividual" class="form-label">Semestre *</label>
                          <select class="form-select" id="semestreIndividual" formControlName="semestre">
                            <option value="">Selecione o semestre</option>
                            <option value="2024.2">2024.2</option>
                            <option value="2025.1">2025.1</option>
                            <option value="2025.2">2025.2</option>
                          </select>
                        </div>

                        <div class="mb-3">
                          <div class="form-check">
                            <input 
                              class="form-check-input" 
                              type="checkbox" 
                              id="usarPreferencias"
                              formControlName="usarPreferencias">
                            <label class="form-check-label" for="usarPreferencias">
                              Usar minhas preferências configuradas
                            </label>
                          </div>
                          <small class="form-text text-muted">
                            Recomendado: Configure suas preferências antes de gerar o horário
                          </small>
                        </div>

                        <div class="mb-3">
                          <label for="observacoesIndividual" class="form-label">Observações</label>
                          <textarea 
                            class="form-control" 
                            id="observacoesIndividual"
                            formControlName="observacoes"
                            rows="3"
                            placeholder="Observações adicionais sobre a geração..."></textarea>
                        </div>
                      </div>

                      <div class="col-md-6">
                        <h5 class="mb-3">
                          <i class="fas fa-sliders-h me-2"></i>
                          Parâmetros Avançados
                        </h5>
                        
                        <div class="alert alert-info">
                          <i class="fas fa-info-circle me-2"></i>
                          <strong>Dica:</strong> Os parâmetros padrão funcionam bem na maioria dos casos. 
                          Ajuste apenas se necessário.
                        </div>

                        <div class="mb-3">
                          <label for="populacao" class="form-label">População (10-200)</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            id="populacao"
                            formControlName="populacao"
                            min="10" 
                            max="200"
                            placeholder="50">
                          <small class="form-text text-muted">Número de soluções por geração</small>
                        </div>

                        <div class="mb-3">
                          <label for="geracoes" class="form-label">Gerações (10-1000)</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            id="geracoes"
                            formControlName="geracoes"
                            min="10" 
                            max="1000"
                            placeholder="100">
                          <small class="form-text text-muted">Número de iterações do algoritmo</small>
                        </div>

                        <div class="mb-3">
                          <label for="taxaMutacao" class="form-label">Taxa de Mutação (0.01-1.0)</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            id="taxaMutacao"
                            formControlName="taxaMutacao"
                            min="0.01" 
                            max="1" 
                            step="0.01"
                            placeholder="0.1">
                          <small class="form-text text-muted">Probabilidade de mutação</small>
                        </div>

                        <div class="mb-3">
                          <label for="tipoCruzamento" class="form-label">Tipo de Cruzamento</label>
                          <select class="form-select" id="tipoCruzamento" formControlName="tipoCruzamento">
                            <option value="1">Um ponto de corte</option>
                            <option value="2">Dois pontos de corte</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <div class="col-12">
                        <div class="d-flex justify-content-end gap-2">
                          <button type="button" class="btn btn-secondary" (click)="resetarFormIndividual()">
                            <i class="fas fa-undo me-2"></i>
                            Resetar
                          </button>
                          <button type="submit" class="btn btn-success" [disabled]="carregandoIndividual || formIndividual.invalid">
                            <i class="fas fa-magic me-2"></i>
                            <span *ngIf="carregandoIndividual">Gerando...</span>
                            <span *ngIf="!carregandoIndividual">Gerar Horário</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <!-- Aba Coletiva (apenas para admins) -->
                <div class="tab-pane fade" id="coletivo" role="tabpanel" *ngIf="isAdmin">
                  <form [formGroup]="formColetivo" (ngSubmit)="gerarHorarioColetivo()">
                    <div class="row">
                      <div class="col-md-6">
                        <h5 class="mb-3">
                          <i class="fas fa-cog me-2"></i>
                          Configurações Básicas
                        </h5>
                        
                        <div class="mb-3">
                          <label for="tituloColetivo" class="form-label">Título da Geração *</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            id="tituloColetivo"
                            formControlName="titulo"
                            placeholder="Ex: Horários Departamento 2025.1">
                        </div>

                        <div class="mb-3">
                          <label for="semestreColetivo" class="form-label">Semestre *</label>
                          <select class="form-select" id="semestreColetivo" formControlName="semestre">
                            <option value="">Selecione o semestre</option>
                            <option value="2024.2">2024.2</option>
                            <option value="2025.1">2025.1</option>
                            <option value="2025.2">2025.2</option>
                          </select>
                        </div>

                        <div class="mb-3">
                          <label for="professores" class="form-label">Professores *</label>
                          <div class="border rounded p-3" style="max-height: 200px; overflow-y: auto;">
                            <div class="form-check" *ngFor="let professor of professoresDisponiveis">
                              <input 
                                class="form-check-input" 
                                type="checkbox" 
                                [id]="'prof_' + professor._id"
                                [value]="professor._id"
                                (change)="toggleProfessor(professor._id, $event)">
                              <label class="form-check-label" [for]="'prof_' + professor._id">
                                {{professor.nome}} ({{professor.email}})
                              </label>
                            </div>
                          </div>
                          <small class="form-text text-muted">
                            Selecione os professores para geração coletiva
                          </small>
                        </div>

                        <div class="mb-3">
                          <label for="otimizacao" class="form-label">Tipo de Otimização</label>
                          <select class="form-select" id="otimizacao" formControlName="otimizacao">
                            <option value="equilibrio">Equilibrio geral</option>
                            <option value="preferencias">Priorizar preferências</option>
                            <option value="recursos">Otimizar recursos</option>
                          </select>
                        </div>
                      </div>

                      <div class="col-md-6">
                        <h5 class="mb-3">
                          <i class="fas fa-sliders-h me-2"></i>
                          Parâmetros Avançados
                        </h5>
                        
                        <div class="alert alert-warning">
                          <i class="fas fa-exclamation-triangle me-2"></i>
                          <strong>Atenção:</strong> A geração coletiva pode demorar mais tempo 
                          devido à complexidade do algoritmo.
                        </div>

                        <div class="mb-3">
                          <label for="populacaoColetivo" class="form-label">População (50-300)</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            id="populacaoColetivo"
                            formControlName="populacaoColetivo"
                            min="50" 
                            max="300"
                            placeholder="100">
                        </div>

                        <div class="mb-3">
                          <label for="geracoesColetivo" class="form-label">Gerações (50-2000)</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            id="geracoesColetivo"
                            formControlName="geracoesColetivo"
                            min="50" 
                            max="2000"
                            placeholder="200">
                        </div>

                        <div class="mb-3">
                          <label for="observacoesColetivo" class="form-label">Observações</label>
                          <textarea 
                            class="form-control" 
                            id="observacoesColetivo"
                            formControlName="observacoesColetivo"
                            rows="4"
                            placeholder="Observações sobre a geração coletiva..."></textarea>
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <div class="col-12">
                        <div class="d-flex justify-content-end gap-2">
                          <button type="button" class="btn btn-secondary" (click)="resetarFormColetivo()">
                            <i class="fas fa-undo me-2"></i>
                            Resetar
                          </button>
                          <button type="submit" class="btn btn-success" [disabled]="carregandoColetivo || formColetivo.invalid || professoresSelecionados.length === 0">
                            <i class="fas fa-magic me-2"></i>
                            <span *ngIf="carregandoColetivo">Gerando...</span>
                            <span *ngIf="!carregandoColetivo">Gerar Horários Coletivos</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status da Geração -->
      <div class="row mt-4" *ngIf="statusGeracao.ativo">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-spinner fa-spin me-2"></i>
                Status da Geração
              </h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <strong>{{statusGeracao.titulo}}</strong>
                  <span class="badge bg-info ms-2">{{statusGeracao.status}}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger" (click)="cancelarGeracao()" *ngIf="statusGeracao.status === 'gerando'">
                  <i class="fas fa-stop me-1"></i>
                  Cancelar
                </button>
              </div>
              
              <div class="progress mb-2">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated" 
                  [style.width.%]="statusGeracao.progresso"
                  [class.bg-success]="statusGeracao.status === 'concluido'"
                  [class.bg-danger]="statusGeracao.status === 'erro'">
                </div>
              </div>
              
              <small class="text-muted">
                {{statusGeracao.mensagem}}
              </small>
              
              <div class="mt-3" *ngIf="statusGeracao.status === 'concluido'">
                <button class="btn btn-primary me-2" (click)="verHorarioGerado()">
                  <i class="fas fa-eye me-1"></i>
                  Ver Horário
                </button>
                <button class="btn btn-outline-secondary" (click)="limparStatus()">
                  <i class="fas fa-times me-1"></i>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }
    
    .nav-tabs .nav-link {
      border: 1px solid transparent;
      border-top-left-radius: 0.375rem;
      border-top-right-radius: 0.375rem;
    }
    
    .nav-tabs .nav-link.active {
      background-color: #fff;
      border-color: #dee2e6 #dee2e6 #fff;
    }
    
    .gap-2 {
      gap: 0.5rem;
    }
    
    .form-check-input:checked {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
    
    .progress {
      height: 8px;
    }
    
    .alert {
      border: none;
      border-radius: 0.5rem;
    }
  `]
})
export class GerarHorarioComponent implements OnInit {
  formIndividual: FormGroup;
  formColetivo: FormGroup;
  carregandoIndividual = false;
  carregandoColetivo = false;
  isAdmin = false;
  
  professoresDisponiveis: any[] = [];
  professoresSelecionados: string[] = [];
  
  statusGeracao = {
    ativo: false,
    titulo: '',
    status: '',
    progresso: 0,
    mensagem: '',
    horarioId: ''
  };

  constructor(
    private fb: FormBuilder,
    private horariosService: HorariosService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.formIndividual = this.fb.group({
      titulo: ['', Validators.required],
      semestre: ['', Validators.required],
      usarPreferencias: [true],
      observacoes: [''],
      populacao: [50, [Validators.min(10), Validators.max(200)]],
      geracoes: [100, [Validators.min(10), Validators.max(1000)]],
      taxaMutacao: [0.1, [Validators.min(0.01), Validators.max(1)]],
      tipoCruzamento: [1]
    });

    this.formColetivo = this.fb.group({
      titulo: ['', Validators.required],
      semestre: ['', Validators.required],
      otimizacao: ['equilibrio'],
      populacaoColetivo: [100, [Validators.min(50), Validators.max(300)]],
      geracoesColetivo: [200, [Validators.min(50), Validators.max(2000)]],
      observacoesColetivo: ['']
    });
  }

  ngOnInit() {
    this.verificarPermissoes();
    this.carregarProfessores();
  }

  verificarPermissoes() {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.tipo === 'admin';
  }

  carregarProfessores() {
    if (this.isAdmin) {
      this.userService.getUsers().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.professoresDisponiveis = response.data.users?.filter(
              (user: any) => user.tipo === 'professor'
            ) || [];
          }
        },
        error: (error) => {
          console.error('Erro ao carregar professores:', error);
        }
      });
    }
  }

  toggleProfessor(professorId: string, event: any) {
    if (event.target.checked) {
      this.professoresSelecionados.push(professorId);
    } else {
      const index = this.professoresSelecionados.indexOf(professorId);
      if (index > -1) {
        this.professoresSelecionados.splice(index, 1);
      }
    }
  }

  gerarHorarioIndividual() {
    if (this.formIndividual.invalid) {
      return;
    }

    this.carregandoIndividual = true;
    
    const parametros: ParametrosGeracao = {
      titulo: this.formIndividual.value.titulo,
      semestre: this.formIndividual.value.semestre,
      usarPreferencias: this.formIndividual.value.usarPreferencias,
      observacoes: this.formIndividual.value.observacoes
    };

    // Adicionar parâmetros avançados se preenchidos
    if (this.formIndividual.value.populacao) {
      parametros.populacao = this.formIndividual.value.populacao;
    }
    if (this.formIndividual.value.geracoes) {
      parametros.geracoes = this.formIndividual.value.geracoes;
    }
    if (this.formIndividual.value.taxaMutacao) {
      parametros.taxaMutacao = this.formIndividual.value.taxaMutacao;
    }
    if (this.formIndividual.value.tipoCruzamento) {
      parametros.tipoCruzamento = this.formIndividual.value.tipoCruzamento;
    }

    this.horariosService.gerarHorarioIndividual(parametros).subscribe({
      next: (response) => {
        this.carregandoIndividual = false;
        if (response.success && response.data) {
          this.iniciarMonitoramento(response.data.horario, 'individual');
        }
      },
      error: (error) => {
        this.carregandoIndividual = false;
        console.error('Erro ao gerar horário individual:', error);
      }
    });
  }

  gerarHorarioColetivo() {
    if (this.formColetivo.invalid || this.professoresSelecionados.length === 0) {
      return;
    }

    this.carregandoColetivo = true;
    
    const parametros: ParametrosGeracaoColetiva = {
      titulo: this.formColetivo.value.titulo,
      semestre: this.formColetivo.value.semestre,
      professores: this.professoresSelecionados,
      observacoes: this.formColetivo.value.observacoesColetivo,
      parametros: {
        otimizacao: this.formColetivo.value.otimizacao,
        populacao: this.formColetivo.value.populacaoColetivo,
        geracoes: this.formColetivo.value.geracoesColetivo
      }
    };

    this.horariosService.gerarHorarioColetivo(parametros).subscribe({
      next: (response) => {
        this.carregandoColetivo = false;
        if (response.success && response.data) {
          this.iniciarMonitoramento(response.data.horarios[0], 'coletivo');
        }
      },
      error: (error) => {
        this.carregandoColetivo = false;
        console.error('Erro ao gerar horário coletivo:', error);
      }
    });
  }

  iniciarMonitoramento(horario: any, tipo: string) {
    this.statusGeracao = {
      ativo: true,
      titulo: horario.titulo,
      status: 'gerando',
      progresso: 10,
      mensagem: 'Iniciando geração do horário...',
      horarioId: horario._id
    };

    // Simular progresso
    this.simularProgresso();
  }

  simularProgresso() {
    const interval = setInterval(() => {
      if (this.statusGeracao.progresso < 90) {
        this.statusGeracao.progresso += Math.random() * 20;
        this.statusGeracao.mensagem = 'Processando algoritmo genético...';
      } else {
        // Verificar status real
        this.verificarStatusGeracao();
        clearInterval(interval);
      }
    }, 1000);
  }

  verificarStatusGeracao() {
    this.horariosService.verificarStatus(this.statusGeracao.horarioId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const horario = response.data.horario;
          
          if (horario.status === 'concluido') {
            this.statusGeracao.status = 'concluido';
            this.statusGeracao.progresso = 100;
            this.statusGeracao.mensagem = 'Horário gerado com sucesso!';
          } else if (horario.status === 'erro') {
            this.statusGeracao.status = 'erro';
            this.statusGeracao.progresso = 100;
            this.statusGeracao.mensagem = 'Erro na geração do horário.';
          } else {
            // Ainda processando, verificar novamente
            setTimeout(() => this.verificarStatusGeracao(), 2000);
          }
        }
      },
      error: (error) => {
        console.error('Erro ao verificar status:', error);
        this.statusGeracao.status = 'erro';
        this.statusGeracao.mensagem = 'Erro ao verificar status da geração.';
      }
    });
  }

  cancelarGeracao() {
    this.horariosService.cancelarGeracao(this.statusGeracao.horarioId).subscribe({
      next: (response) => {
        if (response.success) {
          this.statusGeracao.status = 'cancelado';
          this.statusGeracao.mensagem = 'Geração cancelada pelo usuário.';
        }
      },
      error: (error) => {
        console.error('Erro ao cancelar geração:', error);
      }
    });
  }

  verHorarioGerado() {
    this.router.navigate(['/horarios']);
  }

  limparStatus() {
    this.statusGeracao.ativo = false;
  }

  resetarFormIndividual() {
    this.formIndividual.reset({
      usarPreferencias: true,
      populacao: 50,
      geracoes: 100,
      taxaMutacao: 0.1,
      tipoCruzamento: 1
    });
  }

  resetarFormColetivo() {
    this.formColetivo.reset({
      otimizacao: 'equilibrio',
      populacaoColetivo: 100,
      geracoesColetivo: 200
    });
    this.professoresSelecionados = [];
    
    // Desmarcar todos os checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      if (checkbox.id.startsWith('prof_')) {
        checkbox.checked = false;
      }
    });
  }
}

