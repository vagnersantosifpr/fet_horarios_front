import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosService, HorarioGerado, GradeHorarios, HorarioItem } from '../../services/horarios.service';

@Component({
    selector: 'app-meus-horarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
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
                <div class="d-flex gap-2">
                  <select class="form-select" [(ngModel)]="semestreSelecionado" (change)="carregarHorarios()">
                    <option value="">Todos os semestres</option>
                    <option value="2024.1">2024.1</option>
                    <option value="2024.2">2024.2</option>
                    <option value="2025.1">2025.1</option>
                  </select>
                  <button class="btn btn-primary" (click)="carregarHorarios()">
                    <i class="fas fa-sync-alt"></i> Atualizar
                  </button>
                </div>
              </div>
            </div>
            <div class="card-body">
              
              <!-- Loading -->
              <div *ngIf="carregando" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2">Carregando horários...</p>
              </div>

              <!-- Lista de Horários -->
              <div *ngIf="!carregando && horarios.length > 0">
                <div class="row">
                  <div class="col-12 mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <h5>Horários Encontrados ({{horarios.length}})</h5>
                      <div class="btn-group" role="group">
                        <input type="radio" class="btn-check" name="visualizacao" id="lista" [(ngModel)]="modoVisualizacao" value="lista">
                        <label class="btn btn-outline-primary" for="lista">
                          <i class="fas fa-list"></i> Lista
                        </label>
                        <input type="radio" class="btn-check" name="visualizacao" id="grade" [(ngModel)]="modoVisualizacao" value="grade">
                        <label class="btn btn-outline-primary" for="grade">
                          <i class="fas fa-table"></i> Grade
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Visualização em Lista -->
                <div *ngIf="modoVisualizacao === 'lista'" class="row">
                  <div class="col-12">
                    <div class="accordion" id="horariosAccordion">
                      <div class="accordion-item" *ngFor="let horario of horarios; let i = index">
                        <h2 class="accordion-header">
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
                                  Score: {{horario.fitnessScore}}% | 
                                  {{horario.criadoEm | date:'dd/MM/yyyy HH:mm'}}
                                </small>
                              </div>
                            </div>
                          </button>
                        </h2>
                        <div 
                          [id]="'collapse' + i" 
                          class="accordion-collapse collapse"
                          [class.show]="i === 0"
                          data-bs-parent="#horariosAccordion">
                          <div class="accordion-body">
                            <div class="grade-horarios">
                              <ng-container [ngTemplateOutlet]="gradeTemplate" [ngTemplateOutletContext]="{grade: horario.grade}"></ng-container>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Visualização em Grade -->
                <div *ngIf="modoVisualizacao === 'grade'" class="row">
                  <div class="col-12 mb-3">
                    <select class="form-select" [(ngModel)]="horarioSelecionado" (change)="selecionarHorario()">
                      <option value="">Selecione um horário para visualizar</option>
                      <option *ngFor="let horario of horarios; let i = index" [value]="i">
                        {{horario.titulo}} - {{horario.semestre}} (Score: {{horario.fitnessScore}}%)
                      </option>
                    </select>
                  </div>
                  <div class="col-12" *ngIf="gradeSelecionada">
                    <ng-container [ngTemplateOutlet]="gradeTemplate" [ngTemplateOutletContext]="{grade: gradeSelecionada}"></ng-container>
                  </div>
                </div>
              </div>

              <!-- Estado Vazio -->
              <div *ngIf="!carregando && horarios.length === 0" class="text-center py-5">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Nenhum horário encontrado</h5>
                <p class="text-muted">Você ainda não possui horários gerados para o período selecionado.</p>
                <button class="btn btn-primary" routerLink="/gerar-horario">
                  <i class="fas fa-plus me-2"></i>
                  Gerar Novo Horário
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template da Grade de Horários -->
    <ng-template #gradeTemplate let-grade="grade">
      <div class="table-responsive">
        <table class="table table-bordered grade-table">
          <thead class="table-dark">
            <tr>
              <th style="width: 100px;">Horário</th>
              <th>Segunda</th>
              <th>Terça</th>
              <th>Quarta</th>
              <th>Quinta</th>
              <th>Sexta</th>
              <th>Sábado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let slot of getHorariosSlots(grade)">
              <td class="horario-slot">
                <strong>{{slot.horario}}</strong>
              </td>
              <td [innerHTML]="slot.segunda"></td>
              <td [innerHTML]="slot.terca"></td>
              <td [innerHTML]="slot.quarta"></td>
              <td [innerHTML]="slot.quinta"></td>
              <td [innerHTML]="slot.sexta"></td>
              <td [innerHTML]="slot.sabado"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>
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
    
    .grade-table {
      font-size: 0.875rem;
    }
    
    .grade-table td {
      vertical-align: top;
      padding: 0.5rem;
      min-height: 60px;
    }
    
    .horario-slot {
      background-color: #f8f9fa;
      text-align: center;
      font-weight: 600;
    }
    
    .disciplina-card {
      background-color: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      margin-bottom: 0.25rem;
      font-size: 0.75rem;
    }
    
    .disciplina-codigo {
      font-weight: 600;
      color: #1976d2;
    }
    
    .disciplina-nome {
      color: #424242;
    }
    
    .disciplina-sala {
      color: #666;
      font-style: italic;
    }
    
    .btn-check:checked + .btn-outline-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
      color: white;
    }
    
    .gap-2 {
      gap: 0.5rem;
    }
    
    .accordion-button:not(.collapsed) {
      background-color: #e7f1ff;
      color: #0c63e4;
    }
  `]
})
export class MeusHorariosComponent implements OnInit {
    carregando = false;
    horarios: HorarioGerado[] = [];
    semestreSelecionado = '';
    modoVisualizacao = 'lista';
    horarioSelecionado = '';
    gradeSelecionada: GradeHorarios | null = null;

    constructor(private horariosService: HorariosService) { }

    ngOnInit() {
        this.carregarHorarios();
    }

    carregarHorarios() {
        this.carregando = true;

        this.horariosService.getMeusHorarios(this.semestreSelecionado || undefined).subscribe({
            next: (response) => {
                this.carregando = false;
                if (response.success && response.data) {
                    this.horarios = response.data.horarios || [];
                } else {
                    this.horarios = [];
                }
            },
            error: (error) => {
                this.carregando = false;
                console.error('Erro ao carregar horários:', error);
                this.horarios = [];
            }
        });
    }

    selecionarHorario() {
        if (this.horarioSelecionado !== '') {
            const index = parseInt(this.horarioSelecionado);
            if (index >= 0 && index < this.horarios.length) {
                this.gradeSelecionada = this.horarios[index].grade;
            }
        } else {
            this.gradeSelecionada = null;
        }
    }

    getHorariosSlots(grade: GradeHorarios): any[] {
        // Coletar todos os horários únicos
        const horariosSet = new Set<string>();


        // Supondo que 'grade' é do tipo GradeHorarios e 'horariosSet' é um Set<string>
        Object.values(grade).forEach(dia => { // dia é HorarioItem[]
            dia.forEach((item: HorarioItem) => { // <--- Adicione o tipo HorarioItem aqui
                if (item && item.horarioInicio) { // Boa prática: verificar se item e horarioInicio existem
                    horariosSet.add(item.horarioInicio);
                }
            });
        });

        // Ordenar horários
        const horariosOrdenados = Array.from(horariosSet).sort();

        // Criar slots
        return horariosOrdenados.map(horario => {
            const slot: any = { horario };

            // Para cada dia da semana
            ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].forEach(dia => {
                const disciplinasNesteHorario = grade[dia as keyof GradeHorarios].filter(
                    item => item.horarioInicio === horario
                );

                if (disciplinasNesteHorario.length > 0) {
                    slot[dia] = disciplinasNesteHorario.map(item =>
                        this.formatarDisciplinaParaGrade(item)
                    ).join('');
                } else {
                    slot[dia] = '';
                }
            });

            return slot;
        });
    }

    formatarDisciplinaParaGrade(item: any): string {
        const codigo = item.disciplina?.codigo || 'N/A';
        const nome = item.disciplina?.nome || 'Disciplina';
        const sala = item.sala?.codigo || 'Sala TBD';
        const horarioFim = item.horarioFim || '';

        return `
      <div class="disciplina-card">
        <div class="disciplina-codigo">${codigo}</div>
        <div class="disciplina-nome">${nome}</div>
        <div class="disciplina-sala">${sala}</div>
        <small>${item.horarioInicio} - ${horarioFim}</small>
      </div>
    `;
    }
}

