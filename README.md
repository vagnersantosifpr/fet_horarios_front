# Sistema de Geração de Horários (FET Horários)

## Visão Geral do Projeto

O Sistema de Geração de Horários, carinhosamente apelidado de FET Horários, é uma aplicação robusta e intuitiva desenvolvida para otimizar o processo de criação e gestão de horários acadêmicos. Projetado para atender às necessidades de instituições de ensino, ele oferece uma plataforma centralizada para administradores gerenciarem disciplinas, salas e usuários, enquanto professores e alunos podem visualizar seus horários de forma eficiente. A complexidade inerente à alocação de recursos (disciplinas, professores, salas) em uma grade horária é simplificada por meio de uma interface de usuário amigável e um backend poderoso, garantindo flexibilidade e precisão na geração de horários que respeitam diversas restrições e preferências.

Este projeto é dividido em duas partes principais: um frontend desenvolvido com Angular, que proporciona uma experiência de usuário rica e responsiva, e um backend construído com Node.js e Express, que gerencia a lógica de negócios, a persistência de dados no MongoDB e a autenticação segura via JWT. A arquitetura desacoplada permite que ambas as partes evoluam independentemente, facilitando a manutenção e a escalabilidade.

## Tecnologias Utilizadas

### Frontend (fet_horarios_front)

O frontend do FET Horários é uma Single Page Application (SPA) desenvolvida com Angular, um framework poderoso para a construção de aplicações web dinâmicas. A escolha do Angular se justifica pela sua estrutura modular, suporte a TypeScript, e um ecossistema robusto que inclui ferramentas de linha de comando (CLI) para agilizar o desenvolvimento. A gestão de estado e a reatividade são tratadas de forma eficiente, proporcionando uma experiência de usuário fluida e interativa.

- **Angular**: Framework para construção de interfaces de usuário.
- **TypeScript**: Superset de JavaScript que adiciona tipagem estática, melhorando a manutenibilidade e a detecção de erros em tempo de desenvolvimento.
- **HTML5**: Linguagem de marcação para estruturação do conteúdo web.
- **SCSS (Sass)**: Pré-processador CSS que adiciona funcionalidades como variáveis, aninhamento e mixins, tornando o CSS mais organizado e reutilizável.
- **RxJS**: Biblioteca para programação reativa, utilizada para lidar com eventos assíncronos e fluxos de dados.
- **Angular Material (ou similar)**: Componentes de UI pré-construídos que seguem as diretrizes do Material Design, garantindo uma aparência moderna e consistente (assumindo uso de componentes visuais).

### Backend (fet_horarios_back)

O backend do FET Horários é uma API RESTful construída com Node.js e o framework Express. Node.js é escolhido por sua capacidade de construir aplicações escaláveis e de alta performance, especialmente para operações de I/O intensivas. Express.js, por sua vez, oferece uma camada fina e flexível para a construção de APIs web, facilitando o roteamento, o tratamento de requisições e a integração com bancos de dados.

- **Node.js**: Ambiente de execução JavaScript server-side.
- **Express.js**: Framework web minimalista e flexível para Node.js, utilizado para construir APIs RESTful.
- **MongoDB**: Banco de dados NoSQL baseado em documentos, escolhido pela sua flexibilidade e escalabilidade, ideal para armazenar dados semi-estruturados como disciplinas, salas e usuários.
- **Mongoose**: ODM (Object Data Modeling) para MongoDB e Node.js, que simplifica a interação com o banco de dados, fornecendo validação de esquema e ferramentas de consulta.
- **JWT (JSON Web Tokens)**: Padrão aberto para a criação de tokens de acesso que permitem a autenticação segura e a autorização de usuários em APIs. Utilizado para gerenciar sessões de usuário de forma stateless.
- **Bcrypt**: Biblioteca para hash de senhas, garantindo que as credenciais dos usuários sejam armazenadas de forma segura no banco de dados.
- **CORS (Cross-Origin Resource Sharing)**: Middleware para Express.js que permite que o frontend, hospedado em um domínio diferente, faça requisições ao backend.

## Funcionalidades Principais

O sistema FET Horários oferece um conjunto abrangente de funcionalidades para gerenciar e visualizar horários:

- **Autenticação e Autorização de Usuários**: Sistema de login seguro com JWT, permitindo diferentes níveis de acesso (administrador, professor, aluno).
- **Gestão de Disciplinas**: Administradores podem cadastrar, visualizar, editar e excluir disciplinas, incluindo informações como código, nome, departamento, carga horária, créditos e período.
- **Gestão de Salas**: Cadastro e gerenciamento de salas, com detalhes sobre capacidade, tipo e disponibilidade.
- **Gestão de Usuários**: Criação e manutenção de contas de usuário, com atribuição de papéis (admin, professor, aluno).
- **Geração de Horários**: Funcionalidade central para gerar grades horárias otimizadas, considerando restrições de disponibilidade de salas, professores e alunos.
- **Visualização de Horários**: Interface intuitiva para professores e alunos visualizarem seus horários personalizados.
- **Pesquisa e Filtragem**: Ferramentas de busca e filtragem para localizar rapidamente disciplinas, salas ou usuários específicos.
- **Paginação**: Implementação de paginação para lidar eficientemente com grandes volumes de dados, melhorando a performance da aplicação.

## Estrutura do Projeto

O projeto é organizado em dois repositórios distintos, um para o frontend e outro para o backend, seguindo a arquitetura de microserviços ou aplicações distribuídas. Essa separação facilita o desenvolvimento paralelo, a implantação independente e a escalabilidade de cada componente.

### `fet_horarios_front` (Frontend)

Este repositório contém todo o código-fonte da aplicação cliente Angular. A estrutura de pastas segue as convenções do Angular CLI, com módulos, componentes, serviços, interceptors e modelos bem definidos.

- `src/app/`: Contém os módulos e componentes principais da aplicação.
  - `components/`: Componentes reutilizáveis da UI.
  - `guards/`: Guards de rota para controle de acesso.
  - `interceptors/`: Interceptors HTTP para manipulação de requisições (ex: adição de tokens de autenticação).
  - `models/`: Definições de interfaces e classes para os dados da aplicação.
  - `services/`: Serviços Angular para comunicação com o backend e lógica de negócios.
- `src/assets/`: Arquivos estáticos como imagens, ícones, etc.
- `src/environments/`: Configurações de ambiente (desenvolvimento, produção).

### `fet_horarios_back` (Backend)

Este repositório hospeda a API RESTful construída com Node.js e Express. A organização visa a modularidade e a clareza, separando as responsabilidades em rotas, modelos e middlewares.

- `middleware/`: Funções middleware para processamento de requisições (ex: autenticação, validação).
- `models/`: Definições de esquemas de dados para o MongoDB (usando Mongoose).
- `routes/`: Definição das rotas da API e seus respectivos controladores.
- `server.js`: Ponto de entrada da aplicação backend, onde o servidor Express é configurado e iniciado.
- `seed.js`: Script para popular o banco de dados com dados iniciais (opcional).

## Como Configurar e Rodar o Projeto

Para configurar e rodar o sistema FET Horários em seu ambiente local, siga os passos abaixo para o backend e o frontend, respectivamente.

### Configuração do Backend

1. **Clone o repositório do backend:**
   ```bash
   git clone https://github.com/vagnersantosifpr/fet_horarios_back.git
   cd fet_horarios_back
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/fethorarios # Ou sua URI do MongoDB Atlas
   JWT_SECRET=seu_segredo_jwt_muito_seguro
   ```
   - `PORT`: Porta em que o servidor backend será executado.
   - `MONGODB_URI`: URI de conexão com o seu banco de dados MongoDB. Se estiver usando MongoDB Atlas, substitua pela sua string de conexão.
   - `JWT_SECRET`: Uma string secreta forte para assinar e verificar os JSON Web Tokens. **Mude esta string para um valor único e complexo em produção.**

4. **Inicie o servidor backend:**
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000` (ou na porta que você configurou).

### Configuração do Frontend

1. **Clone o repositório do frontend:**
   ```bash
   git clone https://github.com/vagnersantosifpr/fet_horarios_front.git
   cd fet_horarios_front
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure a URL da API:**
   No arquivo `src/environments/environment.ts` (e `environment.prod.ts` para produção), certifique-se de que a `apiUrl` aponte para o seu backend. Por exemplo:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api' // Ajuste conforme a porta do seu backend
   };
   ```

4. **Inicie a aplicação frontend:**
   ```bash
   ng serve
   ```
   A aplicação estará disponível em `http://localhost:4200` (ou na porta padrão do Angular CLI).

## Histórico de Problemas e Soluções

Durante o desenvolvimento e a fase de testes, dois problemas críticos relacionados à autenticação e listagem de dados foram identificados e solucionados. Esta seção detalha as causas, as soluções implementadas e as lições aprendidas.

### Problema 1: "Acesso negado. Token não fornecido."

#### Descrição

Usuários autenticados recebiam a mensagem de erro "Acesso negado. Token não fornecido." ao tentar acessar rotas protegidas no backend, como a listagem de salas (`/admin/salas`), mesmo após um login bem-sucedido. Isso impedia a interação com as funcionalidades administrativas do sistema.

#### Causa Raiz

O problema foi rastreado até o interceptor de autenticação no frontend (`src/app/interceptors/auth-interceptor.ts`). A lógica original do interceptor era excessivamente restritiva, adicionando o token JWT ao cabeçalho `Authorization` apenas se a URL da requisição começasse com uma string específica de produção (`https://fet-horarios-back.onrender.com/api/`). Requisições para URLs de desenvolvimento (como `http://localhost:3000/api/salas`) ou outras URLs da API que não seguiam esse prefixo exato não tinham o token anexado, resultando na falha de autenticação no backend.

#### Solução Implementada

A solução envolveu a modificação da condição no `auth-interceptor.ts` para ser mais abrangente, garantindo que o token seja incluído em todas as requisições destinadas à API do backend. A condição foi expandida para verificar se a URL da requisição contém `/api/` ou a string `fet-horarios-back`, cobrindo tanto ambientes de desenvolvimento quanto de produção e diferentes endpoints da API.

**Trecho de Código Corrigido (`auth-interceptor.ts`):**

```typescript
if (token && (
  request.url.startsWith("https://fet-horarios-back.onrender.com/api/") ||
  request.url.includes("/api/") ||
  request.url.includes("fet-horarios-back")
)) {
  request = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
```

Além disso, foi fornecida uma versão funcional do interceptor (para Angular 15+) e um arquivo de configuração (`app.config.ts`) para garantir que o interceptor fosse registrado corretamente no sistema de injeção de dependências do Angular.

#### Lições Aprendidas

- A importância de condições flexíveis em interceptors HTTP para garantir que a lógica de autenticação funcione em diferentes ambientes (desenvolvimento, produção) e para todas as rotas da API.
- A necessidade de testar a aplicação em ambientes de desenvolvimento e produção para identificar inconsistências de configuração.

### Problema 2: Disciplinas Cadastradas Não Listadas

#### Descrição

Após a resolução do problema de autenticação, foi observado que, embora as disciplinas pudessem ser cadastradas com sucesso no banco de dados, elas não eram exibidas na interface de listagem (`/admin/disciplinas`). A mensagem "Nenhuma disciplina cadastrada. Clique em "Nova Disciplina" para adicionar." persistia, sugerindo um problema na forma como o frontend processava a resposta da API.

#### Causa Raiz

O problema residia na incompatibilidade entre o formato da resposta enviada pelo backend e o formato esperado pelo frontend para a exibição das disciplinas. O backend estava retornando um objeto aninhado com a estrutura `{ success: true, data: { disciplinas: [...], pagination: {...} } }`, enquanto o componente Angular (`DisciplinasComponent`) esperava que o array de disciplinas estivesse diretamente na propriedade `data` do objeto de resposta, ou que a resposta fosse um array direto. Isso resultava no erro `NG02200` do Angular, que ocorre quando `*ngFor` tenta iterar sobre um objeto não iterável.

#### Solução Implementada

A solução focou em ajustar o método `loadDisciplinas()` no `DisciplinasComponent` para acessar corretamente o array de disciplinas dentro da estrutura aninhada da resposta da API. A lógica foi atualizada para extrair o array de `response.data.disciplinas` e as informações de paginação de `response.data.pagination`.

**Trecho de Código Corrigido (`DisciplinasComponent.ts` - método `loadDisciplinas`):**

```typescript
// Dentro do subscribe do getDisciplinas
next: (response: any) => {
  try {
    if (response && response.success && response.data && Array.isArray(response.data.disciplinas)) {
      this.disciplinas = response.data.disciplinas;
      this.totalPages = response.data.pagination?.totalPages || 1;
      this.currentPage = response.data.pagination?.page || 1;
    } else if (Array.isArray(response)) {
      // Fallback para array direto (se a API mudar o formato)
      this.disciplinas = response;
      this.totalPages = 1;
      this.currentPage = 1;
    } else {
      // Formato desconhecido
      this.disciplinas = [];
    }
  } catch (error) {
    this.disciplinas = [];
  }
  this.loading = false;
},
```

Para auxiliar no diagnóstico de problemas futuros, foram adicionados logs detalhados e um modo de depuração (`debugMode`) ao `DisciplinasComponent`, permitindo visualizar a estrutura exata da resposta da API no console do navegador. Isso se mostrou crucial para identificar rapidamente a causa do problema.

#### Lições Aprendidas

- A importância de uma comunicação clara e consistente sobre o formato das respostas da API entre o frontend e o backend.
- A utilidade de ferramentas de depuração e logs detalhados para diagnosticar problemas de integração e parsing de dados.
- A necessidade de robustez no código do frontend para lidar com variações (mesmo que inesperadas) no formato da resposta da API, evitando falhas na interface do usuário.

## Contribuição

Contribuições são bem-vindas! Se você encontrar bugs, tiver sugestões de melhoria ou quiser adicionar novas funcionalidades, sinta-se à vontade para abrir uma issue ou enviar um pull request. Por favor, siga as boas práticas de desenvolvimento e garanta que seus commits sejam claros e descritivos.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE). Sinta-se à vontade para usar, modificar e distribuir o código, desde que a licença seja mantida.

## Contato

Para dúvidas ou suporte, entre em contato com [Vagner Santos](https://github.com/vagnersantosifpr) ou abra uma issue neste repositório.

---

**Desenvolvido com o apoio de Manus AI.**


