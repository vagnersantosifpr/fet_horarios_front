// src/app/components/public-page/public-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicContentService, PublicContent, Feature, Update, FAQ } from '../../services/public-content.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-public-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="public-page">
      <!-- Header -->
      <header class="public-header">
        <div class="container">
          <div class="header-content">
            <div class="logo-section">
              <h1 class="system-title">FET Horários</h1>
              <p class="system-subtitle">Sistema de Geração de Horários</p>
            </div>
            <div class="header-actions">
              <a routerLink="/login" class="btn btn-primary">Fazer Login</a>
            </div>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Carregando informações...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-container">
        <div class="error-message">
          <h3>Ops! Algo deu errado</h3>
          <p>{{ error }}</p>
          <button class="btn btn-secondary" (click)="loadContent()">Tentar Novamente</button>
        </div>
      </div>

      <!-- Main Content -->
      <main *ngIf="content && !loading" class="main-content">
        <!-- Welcome Section -->
        <section class="welcome-section">
          <div class="container">
            <div class="welcome-content">
              <h1 class="welcome-title">{{ content.title }}</h1>
              <p class="welcome-message">{{ content.welcomeMessage }}</p>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="features-section">
          <div class="container">
            <h2 class="section-title">Recursos e Funcionalidades</h2>
            <div class="features-grid">
              <div *ngFor="let feature of content.features" class="feature-card">
                <div class="feature-icon">{{ feature.icon }}</div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Updates Section -->
        <section class="updates-section">
          <div class="container">
            <h2 class="section-title">Histórico de Atualizações</h2>
            <div class="updates-timeline">
              <div *ngFor="let update of content.updates" class="update-item">
                <div class="update-badge" [class]="'badge-' + update.type">
                  {{ getUpdateTypeLabel(update.type) }}
                </div>
                <div class="update-content">
                  <div class="update-header">
                    <span class="update-version">v{{ update.version }}</span>
                    <span class="update-date">{{ formatDate(update.date) }}</span>
                  </div>
                  <p class="update-description">{{ update.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- FAQ Section -->
        <section class="faq-section">
          <div class="container">
            <h2 class="section-title">Perguntas Frequentes</h2>
            <div class="faq-grid">
              <div *ngFor="let faqItem of content.faq; let i = index" class="faq-item">
                <div class="faq-question" (click)="toggleFAQ(i)" [class.active]="activeFAQ === i">
                  <h3>{{ faqItem.question }}</h3>
                  <span class="faq-toggle">{{ activeFAQ === i ? '−' : '+' }}</span>
                </div>
                <div class="faq-answer" [class.active]="activeFAQ === i">
                  <p>{{ faqItem.answer }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Technologies Section -->
        <section class="tech-section">
          <div class="container">
            <h2 class="section-title">Tecnologias Utilizadas</h2>
            <div class="tech-grid">
              <div class="tech-category">
                <h3>Frontend</h3>
                <div class="tech-items">
                  <span class="tech-item">Angular</span>
                  <span class="tech-item">TypeScript</span>
                  <span class="tech-item">SCSS</span>
                  <span class="tech-item">RxJS</span>
                </div>
              </div>
              <div class="tech-category">
                <h3>Backend</h3>
                <div class="tech-items">
                  <span class="tech-item">Node.js</span>
                  <span class="tech-item">Express</span>
                  <span class="tech-item">MongoDB</span>
                  <span class="tech-item">JWT</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="public-footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-info">
              <h4>FET Horários</h4>
              <p>Sistema de Geração de Horários - IFPR Campus Assis Chateaubriand</p>
            </div>
            <div class="footer-links">
              <a routerLink="/login">Fazer Login</a>
              <a href="https://github.com/vagnersantosifpr" target="_blank">GitHub</a>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2025 FET Horários. Desenvolvido com ❤️ para o IFPR.</p>
            <p *ngIf="content" class="last-updated">
              Última atualização: {{ formatDate(content.lastUpdated) }}
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./public-page.component.scss']  
})
export class PublicPageComponent implements OnInit {
  content: PublicContent | null = null;
  loading: boolean = true;
  error: string = '';
  activeFAQ: number = -1;

  constructor(private publicContentService: PublicContentService) {}

  ngOnInit(): void {
    this.loadContent();
  }

  loadContent(): void {
    this.loading = true;
    this.error = '';
    
    this.publicContentService.getPublicContent().subscribe({
      next: (response) => {
        if (response.success) {
          this.content = response.data;
        } else {
          this.error = 'Erro ao carregar conteúdo da página.';
        }
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erro ao carregar conteúdo público:', error);
        this.error = 'Não foi possível carregar as informações. Verifique sua conexão e tente novamente.';
        this.loading = false;
      }
    });
  }

  toggleFAQ(index: number): void {
    this.activeFAQ = this.activeFAQ === index ? -1 : index;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getUpdateTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'feature': 'Novo Recurso',
      'bugfix': 'Correção',
      'improvement': 'Melhoria',
      'security': 'Segurança'
    };
    return labels[type] || 'Atualização';
  }
}

