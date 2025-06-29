import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop'; // Importar DragDropModule e tipos do CDK

import { Discipline, Timetable } from '../../services/data.service';

interface Slot {
  id: string; // e.g., 'seg_h1'
  day: string;
  time: string;
  turma: string; // e.g., 'IIW2025A'
  discipline: Discipline | null;
  isEmpty: boolean;
  isAfternoon: boolean;
  isNonScheduledAfternoon: boolean; // New class logic
}

interface TimetableRow {
  timeLabel: string;
  slots: Slot[];
  isAfternoonSeparator?: boolean; // For the "TARDE" row
  isAfternoonRow?: boolean; // For regular afternoon rows
}

@Component({
  selector: 'app-timetable',
  standalone: true,           // Marque como standalone
  imports: [                  // Adicionar as importações necessárias aqui
    CommonModule,
    DragDropModule
  ],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.css']
})
export class TimetableComponent implements OnInit, OnChanges {
  @Input() turmaTimetable: Timetable | null = null; // Input for the timetable data
  @Input() disciplineMap: { [id: string]: Discipline } = {}; // Input for discipline lookup
  @Input() turmaTitle: string = 'Horário'; // Title for the table

  timetableRows: TimetableRow[] = []; // Data structure to render the table

  // Configuration (can be moved to a service or config file)
  public dias = ['seg', 'ter', 'qua', 'qui', 'sex'];
  private horariosManha = ['h1', 'h2', 'h3', 'h4', 'h5'];
  private horariosTarde = ['h6', 'h7', 'h8', 'h9', 'h10'];
  private horariosValidosTarde: { [key: string]: string[] } = {
      'ter': ['h6', 'h7', 'h8', 'h9', 'h10'],
      'sex': ['h6']
  };
   private horarioLabels: { [key: string]: string } = {
        h1: "H1 (07:30)", h2: "H2 (08:20)", h3: "H3 (09:25)",
        h4: "H4 (10:15)", h5: "H5 (11:05)", h6: "H6 (Tarde)",
        h7: "H7 (Tarde)", h8: "H8 (Tarde)", h9: "H9 (Tarde)",
        h10: "H10 (Tarde)"
   };


  constructor() { }

  ngOnInit(): void {
     if (this.turmaTimetable && this.getDisciplineMapKeyCount() > 0) {
          this.generateTimetableRows();
     }
  }

  ngOnChanges(changes: SimpleChanges): void {
     if (changes['turmaTimetable'] || changes['disciplineMap']) {
        if (this.turmaTimetable && this.getDisciplineMapKeyCount()) { // Corrigido: use getDisciplineMapKeyCount()
            this.generateTimetableRows();
        } else {
            this.timetableRows = []; // Clear if data is missing
        }
     }
  }

  private generateTimetableRows(): void {
     if (!this.turmaTimetable || !this.turmaTimetable.schedule
         || this.getDisciplineMapKeyCount() === 0) {
         this.timetableRows = [];
         return;
     }

     const rows: TimetableRow[] = [];
     const allHorarios = [...this.horariosManha, ...this.horariosTarde];
     const turmaCode = this.turmaTimetable.turmaCode;
     // Use scheduleMap directly from the Timetable object
     const scheduleMap = this.turmaTimetable.schedule;

     allHorarios.forEach((hora, index) => {
        if (hora === 'h6' && index > 0) {
           rows.push({ timeLabel: 'TARDE', slots: [], isAfternoonSeparator: true });
        }

        const isAfternoonRow = this.horariosTarde.includes(hora);
        const slots: Slot[] = [];

        this.dias.forEach(dia => {
           // Reconstruct the old slot ID style for lookup in the schedule map
           const slotId = `${turmaCode.toLowerCase().replace('iiw', '')}_${dia}_${hora}`;
           const disciplineId = scheduleMap[slotId]; // Access scheduleMap using bracket notation

           const discipline = disciplineId ? this.disciplineMap[disciplineId] || null : null;

           const isNonScheduledAfternoon = isAfternoonRow && (!this.horariosValidosTarde[dia] || !this.horariosValidosTarde[dia].includes(hora));

           slots.push({
              id: slotId,
              day: dia,
              time: hora,
              turma: turmaCode, // Use turmaCode from this.turmaTimetable
              discipline: discipline,
              isEmpty: !discipline,
              isAfternoon: isAfternoonRow,
              isNonScheduledAfternoon: isNonScheduledAfternoon // Add the new class flag
           });
        });

        rows.push({
           timeLabel: this.horarioLabels[hora] || hora,
           slots: slots,
           isAfternoonRow: isAfternoonRow
        });
     });

     this.timetableRows = rows;
     console.log(`Generated timetable rows for ${turmaCode}`);
  }


  // MÉTODO ADICIONADO PARA ACESSAR OBJECT.KEYS NO TEMPLATE
  getDisciplineMapKeyCount(): number {
    // Retorna 0 se disciplineMap for null ou undefined para evitar erro
    return Object.keys(this.disciplineMap || {}).length;
  }

  // CDK Drag and Drop handler
  drop(event: CdkDragDrop<Slot>) {
    const draggedSlotData: Slot = event.previousContainer.data;
    const targetSlotData: Slot = event.container.data;

    console.log('Drop event:', {
         draggedFrom: draggedSlotData.id,
         droppedOn: targetSlotData.id,
         draggedDiscipline: draggedSlotData.discipline?.id || 'Empty',
         targetDiscipline: targetSlotData.discipline?.id || 'Empty'
    });

    // --- Update the underlying timetable data model ---
    if (!this.turmaTimetable) {
         console.error("Timetable data is not available to update.");
         return;
    }

    const timetableSchedule = this.turmaTimetable.schedule;

    // Get discipline IDs involved in the swap/move
    const draggedDiscId = draggedSlotData.discipline ? draggedSlotData.discipline.id : null;
    const targetDiscId = targetSlotData.discipline ? targetSlotData.discipline.id : null;

    // Perform the swap/move in the data model (the schedule map)
    // Use bracket notation for plain JS object/Map access
    timetableSchedule[targetSlotData.id] = draggedDiscId;
    timetableSchedule[draggedSlotData.id] = targetDiscId; // Move the target item (or null) back to the source

    // Update the Slot objects in the rendered timetableRows array for immediate view update
    const sourceRow = this.timetableRows.find(row => row.slots.some(slot => slot.id === draggedSlotData.id));
    const targetRow = this.timetableRows.find(row => row.slots.some(slot => slot.id === targetSlotData.id));

    if (sourceRow && targetRow) {
        const sourceSlot = sourceRow.slots.find(slot => slot.id === draggedSlotData.id);
        const targetSlot = targetRow.slots.find(slot => slot.id === targetSlotData.id);

        if (sourceSlot && targetSlot) {
            // Update the discipline reference and empty status on the Slot objects
            sourceSlot.discipline = targetDiscId ? this.disciplineMap[targetDiscId] : null;
            sourceSlot.isEmpty = !sourceSlot.discipline;

            targetSlot.discipline = draggedDiscId ? this.disciplineMap[draggedDiscId] : null;
            targetSlot.isEmpty = !targetSlot.discipline;

            console.log(`Updated internal model and view for ${this.turmaTimetable.turmaCode} schedule.`);
        }
    } else {
         console.error("Could not find source or target slots in the timetableRows array.");
    }

    // The save logic happens outside this component, typically on a button click in the parent (GradeComponent)
  }

  // Helper function to get the connected drop lists for a slot
  getConnectedListIds(currentSlot: Slot): string[] {
      const allSlotIdsInTurma = this.timetableRows
        .filter(row => !row.isAfternoonSeparator)
        .flatMap(row => row.slots)
        .map(slot => slot.id);

      return allSlotIdsInTurma.filter(id => id !== currentSlot.id);
  }

  // Helper function to get the CSS class for a slot (td)
  getSlotClasses(slot: Slot): any {
      return {
          'timetable-slot': true,
          'empty-slot': slot.isEmpty && !slot.isAfternoon,
          'empty-afternoon': slot.isEmpty && slot.isAfternoon && !slot.isNonScheduledAfternoon,
          'non-scheduled-afternoon': slot.isNonScheduledAfternoon,
      };
  }

  // Helper function to get the CSS class for a card (div)
  getCardClasses(discipline: Discipline | null): any {
     if (!discipline) return {};
     return {
         'discipline-card': true,
         [discipline.cssClass || '']: true
     };
  }
}