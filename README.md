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

## Estrutura principal

- src/components: componentes reutilizáveis
- src/screens: telas da aplicação
- src/services: integração com APIs e serviços
- src/navigation: navegação do app
- e2e: testes end-to-end
