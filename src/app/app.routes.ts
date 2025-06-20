import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmDesenvolvimentoComponent } from './components/emdesenvolvimento/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { DisciplinasComponent } from './components/admin/disciplinas.component';
import { SalasComponent } from './components/admin/salas.component';
import { UsuariosComponent } from './components/admin/usuarios.component';

import { PublicPageComponent } from './components/public-page/public-page.component';

import { PreferenciasComponent } from './components/preferencias/preferencias.component';
import { MeusHorariosComponent } from './components/meus-horarios/meus-horarios.component';
import { GerarHorarioComponent } from './components/gerar-horario/gerar-horario.component';



export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'public',
    component: PublicPageComponent
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'preferencias', 
    component: PreferenciasComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'horarios', 
    component: MeusHorariosComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'gerar-horario', 
    component: GerarHorarioComponent,
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

