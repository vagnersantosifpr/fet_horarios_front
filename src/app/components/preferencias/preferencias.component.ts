import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PreferenciasService, Preferencia } from '../../services/preferencias.service';
import { DisciplinaService } from '../../services/disciplina.service';
import { HorariosService } from '../../services/horarios.service';

@Component({
  selector: 'app-preferencias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
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
                <div class="row mb-4">
                  <div class="col-12">
                    <h5 class="mb-3">
                      <i class="fas fa-book me-2"></i>
                      Disciplinas Preferidas
                    </h5>
                    
                    <div class="mb-3">
                      <div class="row">
                        <div class="col-md-8">
                          <select class="form-select" [(ngModel)]="novaDisciplina" [ngModelOptions]="{standalone: true}">
                            <option value="">Selecione uma disciplina</option>
                            <option *ngFor="let disciplina of disciplinasDisponiveis" [value]="disciplina._id">
                              {{disciplina.codigo}} - {{disciplina.nome}}
                            </option>
                          </select>
                        </div>
                        <div class="col-md-2">
                          <select class="form-select" [(ngModel)]="novaPreferencia" [ngModelOptions]="{standalone: true}">
                            <option value="1">1 - Baixa</option>
                            <option value="2">2</option>
                            <option value="3" selected>3 - Média</option>
                            <option value="4">4</option>
                            <option value="5">5 - Alta</option>
                          </select>
                        </div>
                        <div class="col-md-2">
                          <button type="button" class="btn btn-primary" (click)="adicionarDisciplina()">
                            <i class="fas fa-plus"></i> Adicionar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="table-responsive" *ngIf="disciplinasSelecionadas.length > 0">
                      <table class="table table-striped">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Nome</th>
                            <th>Carga Horária</th>
                            <th>Preferência</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let item of disciplinasSelecionadas; let i = index">
                            <td>{{item.disciplina.codigo}}</td>
                            <td>{{item.disciplina.nome}}</td>
                            <td>{{item.disciplina.cargaHoraria}}h</td>
                            <td>
                              <select class="form-select form-select-sm" [(ngModel)]="item.preferencia" [ngModelOptions]="{standalone: true}">
                                <option value="1">1 - Baixa</option>
                                <option value="2">2</option>
                                <option value="3">3 - Média</option>
                                <option value="4">4</option>
                                <option value="5">5 - Alta</option>
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
                  </div>
                </div>

                <!-- Seção de Disponibilidade de Horários -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h5 class="mb-3">
                      <i class="fas fa-clock me-2"></i>
                      Disponibilidade de Horários
                    </h5>
                    
                    <div class="mb-3">
                      <div class="row">
                        <div class="col-md-3">
                          <select class="form-select" [(ngModel)]="novaDisponibilidade.diaSemana" [ngModelOptions]="{standalone: true}">
                            <option value="">Dia da semana</option>
                            <option *ngFor="let dia of diasSemana" [value]="dia.valor">{{dia.label}}</option>
                          </select>
                        </div>
                        <div class="col-md-2">
                          <select class="form-select" [(ngModel)]="novaDisponibilidade.turno" [ngModelOptions]="{standalone: true}">
                            <option value="">Turno</option>
                            <option *ngFor="let turno of turnos" [value]="turno.valor">{{turno.label}}</option>
                          </select>
                        </div>
                        <div class="col-md-2">
                          <select class="form-select" [(ngModel)]="novaDisponibilidade.horarioInicio" [ngModelOptions]="{standalone: true}">
                            <option value="">Início</option>
                            <option *ngFor="let horario of horariosDisponiveis" [value]="horario">{{horario}}</option>
                          </select>
                        </div>
                        <div class="col-md-2">
                          <select class="form-select" [(ngModel)]="novaDisponibilidade.horarioFim" [ngModelOptions]="{standalone: true}">
                            <option value="">Fim</option>
                            <option *ngFor="let horario of horariosDisponiveis" [value]="horario">{{horario}}</option>
                          </select>
                        </div>
                        <div class="col-md-3">
                          <button type="button" class="btn btn-primary" (click)="adicionarDisponibilidade()">
                            <i class="fas fa-plus"></i> Adicionar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="table-responsive" *ngIf="disponibilidadeHorarios.length > 0">
                      <table class="table table-striped">
                        <thead>
                          <tr>
                            <th>Dia da Semana</th>
                            <th>Turno</th>
                            <th>Horário</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let disp of disponibilidadeHorarios; let i = index">
                            <td>{{getDiaLabel(disp.diaSemana)}}</td>
                            <td>{{getTurnoLabel(disp.turno)}}</td>
                            <td>
                              <span *ngFor="let horario of disp.horarios; let j = index">
                                {{horario.inicio}} - {{horario.fim}}
                                <span *ngIf="j < disp.horarios.length - 1">, </span>
                              </span>
                            </td>
                            <td>
                              <button type="button" class="btn btn-sm btn-danger" (click)="removerDisponibilidade(i)">
                                <i class="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Seção de Configurações Gerais -->
                <div class="row mb-4">
                  <div class="col-md-6">
                    <h5 class="mb-3">
                      <i class="fas fa-sliders-h me-2"></i>
                      Configurações Gerais
                    </h5>
                    
                    <div class="mb-3">
                      <label for="cargaHorariaMaxima" class="form-label">Carga Horária Máxima Semanal</label>
                      <input 
                        type="number" 
                        class="form-control" 
                        id="cargaHorariaMaxima"
                        formControlName="cargaHorariaMaxima"
                        min="1" 
                        max="40"
                        placeholder="Ex: 20">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h5 class="mb-3">
                      <i class="fas fa-comment me-2"></i>
                      Observações
                    </h5>
                    
                    <div class="mb-3">
                      <textarea 
                        class="form-control" 
                        formControlName="observacoes"
                        rows="4"
                        placeholder="Observações adicionais sobre suas preferências..."></textarea>
                    </div>
                  </div>
                </div>

                <!-- Botões de Ação -->
                <div class="row">
                  <div class="col-12">
                    <div class="d-flex justify-content-end gap-2">
                      <button type="button" class="btn btn-secondary" (click)="resetarForm()">
                        <i class="fas fa-undo me-2"></i>
                        Resetar
                      </button>
                      <button type="submit" class="btn btn-success" [disabled]="carregando">
                        <i class="fas fa-save me-2"></i>
                        <span *ngIf="carregando">Salvando...</span>
                        <span *ngIf="!carregando">Salvar Preferências</span>
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

    <!-- Modal de Sucesso/Erro -->
    <div class="modal fade" id="mensagemModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i [class]="mensagem.tipo === 'success' ? 'fas fa-check-circle text-success' : 'fas fa-exclamation-triangle text-danger'"></i>
              {{mensagem.titulo}}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            {{mensagem.texto}}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
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
    
    .table th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
    }
    
    .gap-2 {
      gap: 0.5rem;
    }
    
    .form-select-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
  `]
})
export class PreferenciasComponent implements OnInit {
  preferenciasForm: FormGroup;
  carregando = false;
  
  // Dados
  disciplinasDisponiveis: any[] = [];
  disciplinasSelecionadas: any[] = [];
  disponibilidadeHorarios: any[] = [];
  
  // Formulário auxiliar
  novaDisciplina = '';
  novaPreferencia = 3;
  novaDisponibilidade = {
    diaSemana: '',
    turno: '',
    horarioInicio: '',
    horarioFim: ''
  };
  
  // Opções
  diasSemana: any[] = [];
  turnos: any[] = [];
  horariosDisponiveis: string[] = [];
  
  // Mensagens
  mensagem = {
    tipo: 'success',
    titulo: '',
    texto: ''
  };

  constructor(
    private fb: FormBuilder,
    private preferenciasService: PreferenciasService,
    private disciplinaService: DisciplinaService,
    private horariosService: HorariosService
  ) {
    this.preferenciasForm = this.fb.group({
      cargaHorariaMaxima: [20, [Validators.min(1), Validators.max(40)]],
      observacoes: ['']
    });
  }

  ngOnInit() {
    this.carregarDados();
    this.carregarOpcoes();
  }

  carregarDados() {
    this.carregando = true;
    
    // Carregar disciplinas disponíveis
    this.disciplinaService.getDisciplinas().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.disciplinasDisponiveis = response.data.disciplinas || [];
        }
      },
      error: (error) => {
        console.error('Erro ao carregar disciplinas:', error);
      }
    });

    // Carregar preferências existentes
    this.preferenciasService.getMinhasPreferencias().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.disciplinasSelecionadas = response.data.disciplinas || [];
          this.disponibilidadeHorarios = response.data.disponibilidadeHorarios || [];
          
          this.preferenciasForm.patchValue({
            cargaHorariaMaxima: response.data.cargaHorariaMaxima || 20,
            observacoes: response.data.observacoes || ''
          });
        }
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar preferências:', error);
        this.carregando = false;
      }
    });
  }

  carregarOpcoes() {
    this.diasSemana = this.horariosService.getDiasSemana();
    this.turnos = this.horariosService.getTurnos();
    this.horariosDisponiveis = this.horariosService.getHorariosDisponiveis();
  }

  adicionarDisciplina() {
    if (!this.novaDisciplina) {
      this.mostrarMensagem('error', 'Erro', 'Selecione uma disciplina');
      return;
    }

    const disciplinaExistente = this.disciplinasSelecionadas.find(
      item => item.disciplina._id === this.novaDisciplina
    );

    if (disciplinaExistente) {
      this.mostrarMensagem('error', 'Erro', 'Disciplina já adicionada');
      return;
    }

    const disciplina = this.disciplinasDisponiveis.find(d => d._id === this.novaDisciplina);
    if (disciplina) {
      this.disciplinasSelecionadas.push({
        disciplina: disciplina,
        preferencia: this.novaPreferencia
      });

      this.novaDisciplina = '';
      this.novaPreferencia = 3;
    }
  }

  removerDisciplina(index: number) {
    this.disciplinasSelecionadas.splice(index, 1);
  }

  adicionarDisponibilidade() {
    const { diaSemana, turno, horarioInicio, horarioFim } = this.novaDisponibilidade;
    
    if (!diaSemana || !turno || !horarioInicio || !horarioFim) {
      this.mostrarMensagem('error', 'Erro', 'Preencha todos os campos da disponibilidade');
      return;
    }

    if (horarioInicio >= horarioFim) {
      this.mostrarMensagem('error', 'Erro', 'Horário de início deve ser menor que o horário de fim');
      return;
    }

    const disponibilidadeExistente = this.disponibilidadeHorarios.find(
      disp => disp.diaSemana === diaSemana && disp.turno === turno
    );

    if (disponibilidadeExistente) {
      // Adicionar horário à disponibilidade existente
      disponibilidadeExistente.horarios.push({
        inicio: horarioInicio,
        fim: horarioFim
      });
    } else {
      // Criar nova disponibilidade
      this.disponibilidadeHorarios.push({
        diaSemana,
        turno,
        horarios: [{
          inicio: horarioInicio,
          fim: horarioFim
        }],
        disponivel: true
      });
    }

    this.novaDisponibilidade = {
      diaSemana: '',
      turno: '',
      horarioInicio: '',
      horarioFim: ''
    };
  }

  removerDisponibilidade(index: number) {
    this.disponibilidadeHorarios.splice(index, 1);
  }

  salvarPreferencias() {
    if (this.preferenciasForm.invalid) {
      this.mostrarMensagem('error', 'Erro', 'Verifique os dados do formulário');
      return;
    }

    this.carregando = true;

    const preferencias = {
      disciplinas: this.disciplinasSelecionadas.map(item => ({
        disciplina: item.disciplina._id,
        preferencia: item.preferencia
      })),
      disponibilidadeHorarios: this.disponibilidadeHorarios,
      cargaHorariaMaxima: this.preferenciasForm.value.cargaHorariaMaxima,
      observacoes: this.preferenciasForm.value.observacoes
    };

    this.preferenciasService.salvarMinhasPreferencias(preferencias).subscribe({
      next: (response) => {
        this.carregando = false;
        if (response.success) {
          this.mostrarMensagem('success', 'Sucesso', 'Preferências salvas com sucesso!');
        } else {
          this.mostrarMensagem('error', 'Erro', response.message || 'Erro ao salvar preferências');
        }
      },
      error: (error) => {
        this.carregando = false;
        console.error('Erro ao salvar preferências:', error);
        this.mostrarMensagem('error', 'Erro', 'Erro interno do servidor');
      }
    });
  }

  resetarForm() {
    this.preferenciasForm.reset({
      cargaHorariaMaxima: 20,
      observacoes: ''
    });
    this.disciplinasSelecionadas = [];
    this.disponibilidadeHorarios = [];
    this.novaDisciplina = '';
    this.novaPreferencia = 3;
    this.novaDisponibilidade = {
      diaSemana: '',
      turno: '',
      horarioInicio: '',
      horarioFim: ''
    };
  }

  getDiaLabel(valor: string): string {
    const dia = this.diasSemana.find(d => d.valor === valor);
    return dia ? dia.label : valor;
  }

  getTurnoLabel(valor: string): string {
    const turno = this.turnos.find(t => t.valor === valor);
    return turno ? turno.label : valor;
  }

  mostrarMensagem(tipo: string, titulo: string, texto: string) {
    this.mensagem = { tipo, titulo, texto };
    // Aqui você pode usar Bootstrap Modal ou outro sistema de notificação
    console.log(`${tipo}: ${titulo} - ${texto}`);
  }
}

