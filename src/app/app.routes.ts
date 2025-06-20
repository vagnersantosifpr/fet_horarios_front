import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmDesenvolvimentoComponent } from './components/emdesenvolvimento/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { DisciplinasComponent } from './components/admin/disciplinas.component';
import { SalasComponent } from './components/admin/salas.component';
import { UsuariosComponent } from './components/admin/usuarios.component';


export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'preferencias', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'horarios', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'gerar-horario', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin/disciplinas', 
    component: DisciplinasComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin/salas', 
    component: SalasComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin/usuarios', 
    component: UsuariosComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];

