// src/app/services/public-content.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface Update {
  version: string;
  date: string;
  description: string;
  type: 'feature' | 'bugfix' | 'improvement' | 'security';
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export interface PublicContent {
  title: string;
  welcomeMessage: string;
  features: Feature[];
  updates: Update[];
  faq: FAQ[];
  lastUpdated: string;
}

export interface PublicContentResponse {
  success: boolean;
  data: PublicContent;
}

@Injectable({
  providedIn: 'root'
})
export class PublicContentService {
  private apiUrl = 'https://fet-horarios-back.onrender.com/api/public';

  constructor(private http: HttpClient) {}

  getPublicContent(): Observable<PublicContentResponse> {
    return this.http.get<PublicContentResponse>(`${this.apiUrl}/content`);
  }
}

