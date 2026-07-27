# Proteção de rotas privadas

O app usa AsyncStorage para persistir a sessão do usuário e redirecionar usuários não autenticados para a tela de Login.

## Fluxo
1. Ao autenticar, a sessão é salva com AsyncStorage.
2. Ao sair, a sessão é removida.
3. O guard de rotas verifica a presença da sessão antes de liberar o acesso à área privada.

## Exemplo de uso
```tsx
<PrivateRoute>
  <AuthenticatedHomeScreen />
</PrivateRoute>
```
