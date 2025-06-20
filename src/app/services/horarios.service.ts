import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HorarioItem {
    disciplina: {
        _id: string;
        codigo: string;
        nome: string;
        cargaHoraria: number;
    };
    sala: {
        _id: string;
        codigo: string;
        nome: string;
    } | null;
    diaSemana: string;
    horarioInicio: string;
    horarioFim: string;
    turno: string;
}

export interface GradeHorarios {
    segunda: HorarioItem[];
    terca: HorarioItem[];
    quarta: HorarioItem[];
    quinta: HorarioItem[];
    sexta: HorarioItem[];
    sabado: HorarioItem[];
}

export interface HorarioGerado {
    id: string;
    titulo: string;
    semestre: string;
    fitnessScore: number;
    criadoEm: string;
    grade: GradeHorarios;
    status?: string;
    professor?: string;
}

export interface ParametrosGeracao {
    titulo: string;
    semestre: string;
    usarPreferencias?: boolean;
    observacoes?: string;
    populacao?: number;
    geracoes?: number;
    taxaMutacao?: number;
    tipoCruzamento?: number;
}

export interface ParametrosGeracaoColetiva extends ParametrosGeracao {
    professores: string[];
    parametros?: {
        otimizacao?: 'equilibrio' | 'preferencias' | 'recursos';
        populacao?: number;
        geracoes?: number;
        taxaMutacao?: number;
        tipoCruzamento?: number;
    };
}
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class HorariosService {
    private apiUrl = 'https://fet-horarios-back.onrender.com/api/horarios';

    constructor(private http: HttpClient) { }

    // Obter meus horários
    // Obter meus horários
    getMeusHorarios(semestre?: string): Observable<ApiResponse<{ horarios: HorarioGerado[] }>> {
        let params = new HttpParams(); // Usar HttpParams para melhor manuseio
        if (semestre) {
            params = params.set('semestre', semestre);
        }

        return this.http.get<ApiResponse<{ horarios: HorarioGerado[] }>>(
            `${this.apiUrl}/meus-horarios`,
            {
                params: params, // Passa os HttpParams
                responseType: 'json' // <--- ADICIONE ESTA LINHA
            }
        );
    }

    // Obter horários detalhados (versão completa)
    getHorariosDetalhados(page: number = 1, limit: number = 10, semestre?: string, status?: string): Observable<ApiResponse<any>> {
        const params: any = { page: page.toString(), limit: limit.toString() };
        if (semestre) params.semestre = semestre;
        if (status) params.status = status;

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/my-horarios`, { params });
    }

    // Obter horário específico
    getHorario(id: string): Observable<ApiResponse<{ horario: any }>> {
        return this.http.get<ApiResponse<{ horario: any }>>(`${this.apiUrl}/${id}`);
    }

    // Gerar horário individual
    gerarHorarioIndividual(parametros: ParametrosGeracao): Observable<ApiResponse<{ horario: any }>> {
        return this.http.post<ApiResponse<{ horario: any }>>(`${this.apiUrl}/gerar-individual`, parametros);
    }

    // Gerar horário coletivo (apenas para administradores)
    gerarHorarioColetivo(parametros: ParametrosGeracaoColetiva): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/gerar-coletivo`, parametros);
    }

    // Gerar horário (versão original)
    gerarHorario(parametros: any): Observable<ApiResponse<{ horario: any }>> {
        return this.http.post<ApiResponse<{ horario: any }>>(`${this.apiUrl}/gerar`, parametros);
    }

    // Cancelar geração de horário
    cancelarGeracao(id: string): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/cancelar`, {});
    }

    // Excluir horário
    excluirHorario(id: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }

    // Verificar status de geração
    verificarStatus(id: string): Observable<ApiResponse<{ horario: any }>> {
        return this.http.get<ApiResponse<{ horario: any }>>(`${this.apiUrl}/${id}`);
    }

    // Formatar horários para exibição em grade
    formatarParaGrade(horarios: HorarioItem[]): GradeHorarios {
        const grade: GradeHorarios = {
            segunda: [],
            terca: [],
            quarta: [],
            quinta: [],
            sexta: [],
            sabado: []
        };

        horarios.forEach(horario => {
            if (grade[horario.diaSemana as keyof GradeHorarios]) {
                grade[horario.diaSemana as keyof GradeHorarios].push(horario);
            }
        });

        // Ordenar por horário de início
        Object.keys(grade).forEach(dia => {
            grade[dia as keyof GradeHorarios].sort((a, b) =>
                a.horarioInicio.localeCompare(b.horarioInicio)
            );
        });

        return grade;
    }

    // Obter horários disponíveis para seleção
    getHorariosDisponiveis(): string[] {
        return [
            '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
            '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
        ];
    }

    // Obter dias da semana
    getDiasSemana(): { valor: string; label: string }[] {
        return [
            { valor: 'segunda', label: 'Segunda-feira' },
            { valor: 'terca', label: 'Terça-feira' },
            { valor: 'quarta', label: 'Quarta-feira' },
            { valor: 'quinta', label: 'Quinta-feira' },
            { valor: 'sexta', label: 'Sexta-feira' },
            { valor: 'sabado', label: 'Sábado' }
        ];
    }

    // Obter turnos
    getTurnos(): { valor: string; label: string }[] {
        return [
            { valor: 'manha', label: 'Manhã' },
            { valor: 'tarde', label: 'Tarde' },
            { valor: 'noite', label: 'Noite' }
        ];
    }
}

