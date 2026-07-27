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

## Estrutura principal

- src/components: componentes reutilizáveis
- src/screens: telas da aplicação
- src/services: integração com APIs e serviços
- src/navigation: navegação do app
- e2e: testes end-to-end
