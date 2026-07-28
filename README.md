# JogaMuito Mobile

Aplicativo React Native com TypeScript para a marca JogaMuito.

## Setup

1. Entre na pasta do app:

```bash
cd apps/JogaMuito
```

2. Instale as dependências:

```bash
npm install
```

3. Execute o Metro Bundler:

```bash
npm start
```

4. Em outro terminal, rode o app:

```bash
npx react-native run-android
```

ou

```bash
npx react-native run-ios
```

## Autenticação

- Login com email e senha
- Cadastro com validação básica
- Login social preparado para Google, Facebook e Apple

## Testes

### Testes unitários

```bash
npm test -- --runInBand
```

### Testes E2E com Detox

```bash
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug --cleanup
```

## Grupos e convites

O app JogaMuito permite criar grupos de jogo e compartilhar convites:

- Grupos são criados na tela de `Grupos de Jogo` após login.
- Cada grupo salva nome, descrição, visibilidade pública/privada, proprietário, lista de membros e administradores.
- Para grupos públicos, o app também gera um link direto para o grupo.
- Para grupos privados, o administrador pode gerar um convite único e compartilhar via WhatsApp.
- Outro usuário pode aceitar o convite na tela `Aceitar convite` usando o link ou código gerado.

### Coleções Firebase usadas

- `groups`
  - documento de grupo com campos:
    - `name`: string
    - `description`: string
    - `isPublic`: boolean
    - `ownerId`: string
    - `members`: string[]
    - `admins`: string[]
    - `paymentExemptions`: string[]
    - `createdAt`: timestamp
- `groupInvites`
  - documento de convite com campos:
    - `groupId`: string
    - `code`: string
    - `valid`: boolean
    - `createdAt`: timestamp
- `groups/{groupId}/events`
  - subcoleção opcional para eventos de grupo, criada por administradores.

## Eventos de jogo

O fluxo completo de eventos acontece apos o login e possui tres etapas principais:

1. Criacao do evento
- Tela: Criar evento de jogo
- Campos obrigatorios: ID do grupo, data, horario, local, participantes
- Apenas administradores do grupo podem salvar o evento

2. Escalacao dos times
- Ainda na criacao (ou edicao posterior), o administrador distribui participantes entre Time A e Time B
- Regras de validacao:
  - ambos os times precisam ter ao menos um jogador
  - jogador nao pode estar em dois times ao mesmo tempo
  - todos os jogadores da escala precisam estar na lista de participantes

3. Registro de gols e resultado final
- Tela: Registrar gols
- O admin registra gol informando jogador, time e minuto (opcional)
- O resultado da partida e recalculado automaticamente a cada gol

### Permissoes (admin do grupo)

Antes de qualquer escrita no Firestore, o app valida se o usuario autenticado esta em `groups/{groupId}.admins`.

A validacao e aplicada em:
- criacao de evento
- edicao de escalacao
- registro de gol

Se o usuario nao for admin, a operacao e bloqueada com erro de permissao.

### Colecoes Firebase usadas para eventos

- `gameEvents`
  - colecao principal dos eventos
  - campos:
    - `groupId`: string
    - `date`: string (formato AAAA-MM-DD)
    - `time`: string (formato HH:MM)
    - `location`: string
    - `participants`: string[]
    - `lineup.teamA`: string[]
    - `lineup.teamB`: string[]
    - `goals`: array de objetos com `player`, `team`, `minute`, `createdBy`, `createdAt`
    - `result.teamA`: number
    - `result.teamB`: number
    - `result.winner`: `A` | `B` | `draw`
    - `createdBy`: string
    - `createdAt`: timestamp
    - `updatedAt`: timestamp (quando houver alteracao)

- `groups`
  - usada para validar permissoes de administracao
  - campo utilizado no fluxo de eventos:
    - `admins`: string[]

### Operacoes de dados (camada de servico)

As operacoes de eventos ficam em `src/services/eventService.ts`:

- `createGameEvent`: cria evento com validacao de admin
- `updateEventLineup`: atualiza escalacao com validacao de admin
- `registerEventGoal`: registra gol, recalcula placar e salva resultado
- `getGameEventById`: busca evento por ID
- `getLatestGameEventByGroup`: busca o evento mais recente de um grupo

## Teste E2E do fluxo de eventos (Detox)

Foi adicionado um fluxo E2E completo em `e2e/events.e2e.ts` cobrindo:
- criar jogo
- escalar times
- registrar gol
- validar placar final

Para executar apenas esse fluxo:

```bash
npm run detox:test:events
```

Variaveis de ambiente esperadas no teste:
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_GROUP_ID` (grupo onde o usuario de teste seja admin)

## Teste E2E do fluxo financeiro (Detox)

Foi adicionado um fluxo E2E completo em `e2e/finance.e2e.ts` cobrindo:
- criar custo da partida com valor total
- dividir automaticamente entre jogadores
- aplicar isencao para um jogador
- abrir historico financeiro e validar relatorio por grupo

Para executar apenas esse fluxo:

```bash
npm run detox:test:finance
```

Variaveis de ambiente esperadas no teste:
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_GROUP_ID` (grupo onde o usuario de teste seja admin)

## Modulo financeiro

O modulo financeiro permite:
- registrar o valor total de uma partida
- dividir automaticamente entre jogadores
- aplicar isencao por jogador
- confirmar pagamento total ou parcial por jogador
- consultar historico financeiro agregado por grupo

### Colecoes Firebase usadas para financas

- `matchCosts`
  - colecao principal de custos por partida
  - cada documento representa um registro financeiro de uma partida
  - campos:
    - `groupId`: string (grupo dono do registro)
    - `eventId`: string | null (evento relacionado, opcional)
    - `totalAmount`: number (valor total da partida)
    - `amountPerPlayer`: number (valor calculado por jogador pagante)
    - `chargeablePlayers`: number (quantidade de pagantes)
    - `exemptPlayers`: number (quantidade de isentos)
    - `breakdown`: array de objetos por jogador
      - `name`: string
      - `isExempt`: boolean
      - `amount`: number (valor devido por aquele jogador)
      - `paidAmount`: number opcional (valor ja pago, usado na confirmacao de pagamento)
    - `createdBy`: string (uid do usuario que criou)
    - `createdAt`: timestamp
    - `updatedAt`: timestamp (quando houver edicao ou confirmacao de pagamento)

- `groups`
  - usada para validacao de permissao administrativa antes de qualquer escrita financeira
  - campo usado no modulo:
    - `admins`: string[]

### Validacao de permissao antes de salvar

Antes de salvar, editar, aplicar isencao ou confirmar pagamento, o app valida:
1. usuario autenticado
2. grupo existente
3. usuario presente em `groups/{groupId}.admins`

Se a validacao falhar, a operacao e bloqueada com erro de permissao.

### Operacoes de dados (servico financeiro)

As operacoes ficam em `src/services/matchCostService.ts`:

- `calculateMatchCostSummary`
  - calcula divisao automatica e aplica isencoes

- `saveMatchCost`
  - cria um novo documento em `matchCosts`
  - valida permissao de admin antes da escrita

- `updateMatchCost`
  - atualiza valor total e redistribui custos/isenções em um registro existente
  - valida permissao de admin antes da escrita

- `confirmMatchCostPayment`
  - atualiza `breakdown[].paidAmount` para marcar pagamento de jogador
  - valida permissao de admin antes da escrita

- `getMatchCostsByGroup`
  - consulta `matchCosts` por `groupId`
  - ordena por `createdAt` decrescente

- `getGroupFinancialHistory`
  - agrega dados por jogador
  - retorna totais pagos, devidos e acumulados por grupo

### Consultas Firestore usadas no modulo financeiro

- Escritas:
  - `addDoc(matchCosts, ...)`
  - `runTransaction` para atualizacoes de custo e confirmacao de pagamento

- Leituras:
  - `getDoc(groups/{groupId})` para validar admin
  - `query(matchCosts, where('groupId', '==', groupId), orderBy('createdAt', 'desc'))`

## Estrutura principal

- src/components: componentes reutilizáveis
- src/screens: telas da aplicação
- src/services: integração com APIs e serviços
- src/navigation: navegação do app
- e2e: testes end-to-end
