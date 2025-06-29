import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Define interfaces for data types
export interface Discipline {
  _id?: string; // MongoDB ID
  id: string; // Original ID like 'port1_1ano_a'
  name: string;
  shortName: string;
  professorKey: string;
  cssClass?: string;
  blockHours: number;
}

export interface Timetable {
  _id?: string; // MongoDB ID
  turmaCode: string;
  semester: string;
  yearLevel: number;
  schedule: { [slotId: string]: string | null }; // Map slotId to disciplineId or null
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = "https://fet-horarios-back.onrender.com/api";
 // private apiUrl = environment.production ? environment.apiUrlProd : environment.apiUrlLocal;


  constructor(private http: HttpClient) { }

  getDisciplines(): Observable<Discipline[]> {
    console.log(`${this.apiUrl}/timetable/disciplines`);
    return this.http.get<Discipline[]>(`${this.apiUrl}/timetable/disciplines`).pipe(
      catchError(this.handleError<Discipline[]>('getDisciplines', []))
    );
  }

  getTimetable(turmaCode: string, semester: string): Observable<Timetable | null> {
    return this.http.get<Timetable>(`${this.apiUrl}/timetable/${turmaCode}/${semester}`).pipe(
      catchError(err => {
        if (err.status === 404) {
           console.warn(`Timetable not found for ${turmaCode}/${semester}`, err);
           return of(null); // Return null observable on 404
        }
        this.handleError<Timetable>(`getTimetable ${turmaCode}/${semester}`, undefined)(err);
        return of(null); // Return null observable on other errors too
      })
    );
  }

  // Fetch timetables for multiple turmas/semester
  getTimetablesForTurmas(turmaCodes: string[], semester: string): Observable<{ [turmaCode: string]: Timetable | null }> {
      const requests = turmaCodes.reduce((acc, code) => {
          acc[code] = this.getTimetable(code, semester);
          return acc;
      }, {} as { [key: string]: Observable<Timetable | null> });

      return forkJoin(requests).pipe(
          catchError(this.handleError<{ [turmaCode: string]: Timetable | null }>('getTimetablesForTurmas', {}))
      );
  }


  saveTimetable(timetable: Timetable): Observable<any> {
     // Send the entire timetable document with the updated schedule
    return this.http.put(`${this.apiUrl}/timetable/${timetable.turmaCode}/${timetable.semester}`, { schedule: timetable.schedule }).pipe(
        catchError(this.handleError<any>('saveTimetable'))
    );
  }


  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error); // log to console instead
      // Let the app keep running by returning an empty result or default value.
      return of(result as T);
    };
  }
}