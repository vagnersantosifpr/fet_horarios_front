import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Sistema de Geração de Horários</h1>
          <p>Faça login para continuar</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              placeholder="seu.email@universidade.edu.br"
            >
            <div class="error-message" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              Email é obrigatório e deve ser válido
            </div>
          </div>

          <div class="form-group">
            <label for="senha">Senha</label>
            <input
              type="password"
              id="senha"
              formControlName="senha"
              class="form-control"
              [class.error]="loginForm.get('senha')?.invalid && loginForm.get('senha')?.touched"
              placeholder="Sua senha"
            >
            <div class="error-message" *ngIf="loginForm.get('senha')?.invalid && loginForm.get('senha')?.touched">
              Senha é obrigatória
            </div>
          </div>

          <button 
            type="submit" 
            class="btn-primary"
            [disabled]="loginForm.invalid || loading"
          >
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>

        <div class="login-footer">
          <p>Não tem uma conta? <a href="/register">Cadastre-se aqui</a></p>
          
          <div class="demo-credentials">
            <h3>Credenciais de Demonstração:</h3>
            <div class="credential-item">
              <strong>Professor:</strong> joao.silva&#64;universidade.edu.br / professor123
            </div>
            <div class="credential-item">
              <strong>Admin:</strong> admin&#64;universidade.edu.br / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 40px;
      width: 100%;
      max-width: 450px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-header h1 {
      color: #333;
      margin-bottom: 8px;
      font-size: 24px;
      font-weight: 600;
    }

    .login-header p {
      color: #666;
      margin: 0;
    }

    .login-form {
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: #333;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-control.error {
      border-color: #e74c3c;
    }

    .btn-primary {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      color: #e74c3c;
      font-size: 14px;
      margin-top: 6px;
    }

    .login-footer {
      text-align: center;
      border-top: 1px solid #e1e5e9;
      padding-top: 20px;
    }

    .login-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .login-footer a:hover {
      text-decoration: underline;
    }

    .demo-credentials {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      text-align: left;
    }

    .demo-credentials h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }

    .credential-item {
      font-size: 12px;
      margin-bottom: 5px;
      color: #555;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = ''; // Limpa mensagens de erro anteriores

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.router.navigate(['/dashboard']);
          } else {
            // Se o backend retorna success: false, mas com status 200 OK
            // Você pode querer exibir uma mensagem específica aqui também.
            // Exemplo:
            // this.errorMessage = response.message || 'Falha no login reportada pelo servidor.';
          }
        },
        error: (err: HttpErrorResponse) => { // <<< CALLBACK DE ERRO ATUALIZADO
          this.loading = false;
          let messageToDisplay = 'Ocorreu um erro inesperado ao tentar fazer login.'; // Fallback final

          if (err.error) {
            // 1. Tenta pegar a mensagem de um objeto JSON no corpo do erro (comum)
            // Ex: { "message": "Credenciais inválidas" } ou { "errors": [{ "msg": "..." }] }
            if (typeof err.error === 'object') {
              if (err.error.message) {
                messageToDisplay = err.error.message;
              } else if (err.error.errors && Array.isArray(err.error.errors) && err.error.errors.length > 0 && err.error.errors[0].msg) {
                // Exemplo para um array de erros, pegando a primeira mensagem
                messageToDisplay = err.error.errors[0].msg;
              } else if (Object.keys(err.error).length > 0) {
                 // Se for um objeto com outras propriedades, tente concatená-las (pode precisar de ajuste)
                 // Ou simplesmente use uma mensagem genérica se a estrutura for desconhecida.
                 // Para este exemplo, vou manter simples, mas você pode querer ser mais específico.
                 // messageToDisplay = JSON.stringify(err.error); // Pode não ser amigável
              }
            }
            // 2. Tenta pegar a mensagem se o corpo do erro for uma string simples
            else if (typeof err.error === 'string') {
              messageToDisplay = err.error;
            }
          }
          // 3. Se não encontrou uma mensagem no corpo do erro (err.error),
          //    usa a mensagem do próprio HttpErrorResponse (útil para erros de rede, CORS, etc.)
          //    ou se as condições anteriores não foram satisfeitas.
          //    Priorizamos as mensagens de err.error porque geralmente são mais específicas do backend.
          else if (err.message) { // Adicionado 'else if' para evitar sobrescrever se já pegou de err.error
            messageToDisplay = err.message;
          }
          // 4. (Opcional) Poderia adicionar um tratamento para err.statusText se quisesse
          // else if (err.statusText && err.statusText !== 'OK') { // 'OK' não é um erro útil
          //   messageToDisplay = err.statusText;
          // }

          this.errorMessage = messageToDisplay;

          // É SEMPRE uma boa prática logar o objeto de erro completo no console
          // para facilitar a depuração, pois você verá toda a estrutura.
          console.error('Erro no login:', err);
          console.error('Status do erro:', err.status);
          console.error('Mensagem do erro (HttpErrorResponse):', err.message);
          console.error('Corpo do erro (backend):', err.error);
        }
      });
    }
  }
}

