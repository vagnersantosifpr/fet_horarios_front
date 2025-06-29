import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { HttpClientModule } from '@angular/common/http'; // Importar HttpClientModule (pelo DataService)

import { DataService, Discipline, Timetable } from '../../services/data.service';
import { forkJoin } from 'rxjs';

// Importar o TimetableComponent (já que ele é usado no template do GradeComponent)
import { TimetableComponent } from '../timetable/timetable.component';

@Component({
  selector: 'app-grade-page', // Mudei o seletor para algo mais específico que 'app-root'
  standalone: true,           // Marque como standalone
  imports: [                  // Adicionar as importações necessárias aqui
    CommonModule,
    HttpClientModule, // O DataService usa HttpClient, então o componente que usa o DataService precisa importar HttpClientModule
    TimetableComponent // Importar o componente filho usado no template
  ],
  templateUrl: './grade.component.html', 
  styleUrls: ['./grade.component.css']
})
export class GradePageComponent implements OnInit {
  title = 'Horário por Turma';
  disciplineMap: { [id: string]: Discipline } = {};
  turmaTimetables: { [turmaCode: string]: Timetable | null } = {};
  isLoading = true;
  errorMessage: string | null = null;

  // Define the turmas and semester to display
  turmasToDisplay = [
      { code: 'IIW2025A', title: '1º Ano' },
      { code: 'IIW2024A', title: '2º Ano' },
      { code: 'IIW2023A', title: '3º Ano' }
  ];
  currentSemester = '2025.1'; // Set the semester

  // O DataService já é injetado corretamente no constructor
  constructor(private dataService: DataService) {}

  ngOnInit(): void {
     this.loadData();
  }

  loadData(): void {
     this.isLoading = true;
     this.errorMessage = null;

     forkJoin({
         disciplines: this.dataService.getDisciplines(),
         timetables: this.dataService.getTimetablesForTurmas(
             this.turmasToDisplay.map(t => t.code),
             this.currentSemester
         )
     }).subscribe({
         next: (results) => {
             this.disciplineMap = results.disciplines.reduce((map, disc) => {
                map[disc.id] = disc;
                return map;
             }, {} as { [id: string]: Discipline });

             this.turmaTimetables = results.timetables;

             console.log('Data loaded:', { disciplineMap: this.disciplineMap, turmaTimetables: this.turmaTimetables });
             this.isLoading = false;
         },
         error: (err) => {
             console.error('Failed to load data:', err);
             this.errorMessage = 'Erro ao carregar os dados do horário.';
             this.isLoading = false;
         }
     });
  }

  saveChanges(): void {
      console.log("Saving changes...");
      const timetablesToSave: Timetable[] = Object.values(this.turmaTimetables).filter(t => t !== null) as Timetable[];

      if (timetablesToSave.length === 0) {
           console.log("No timetables loaded to save.");
           return;
      }

      const saveRequests = timetablesToSave.map(tt => this.dataService.saveTimetable(tt!));

      forkJoin(saveRequests).subscribe({
          next: (results) => {
              console.log('Save successful!', results);
              alert("Alterações salvas com sucesso!");
          },
          error: (err) => {
              console.error('Save failed:', err);
              alert("Falha ao salvar alterações. Verifique o console.");
          }
      });
  }
}