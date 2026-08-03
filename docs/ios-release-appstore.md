# iOS build e envio para App Store Connect (JogaMuito)

Este guia cobre a configuracao segura do build iOS, archive no Xcode e upload para App Store Connect com suporte a iOS 15+.

## 1. Pre-requisitos

- Mac com Xcode atualizado.
- Conta Apple Developer ativa.
- Bundle Identifier do app configurado no Apple Developer.
- Certificados e Profiles de distribuicao (ou signing automatico no Xcode).
- Arquivo `GoogleService-Info.plist` do projeto Firebase iOS.

## 2. Configuracao Firebase no iOS

1. Coloque o arquivo `GoogleService-Info.plist` dentro de `ios/JogaMuito/`.
2. No Xcode, abra `JogaMuito.xcworkspace` e confirme se o arquivo foi adicionado ao target `JogaMuito`.
3. O app inicializa Firebase no `AppDelegate` com `FIRApp configure` ao iniciar.

Seguranca:

- Nao commite `GoogleService-Info.plist` em repositorios publicos.
- O projeto ja ignora esse arquivo via `.gitignore`.

## 3. Instalar pods

No diretorio `apps/JogaMuito/ios`:

```bash
pod install
```

Depois, abra sempre o workspace:

```bash
open JogaMuito.xcworkspace
```

## 4. Compatibilidade iOS 15+

Este projeto esta configurado para iOS 15+ em:

- `platform :ios, '15.0'` no Podfile
- `IPHONEOS_DEPLOYMENT_TARGET = 15.0` no projeto Xcode
- arquitetura requerida `arm64` no Info.plist

## 5. Gerar archive no Xcode

1. No Xcode, selecione target `JogaMuito`.
2. Em Signing & Capabilities:
   - Team correto
   - Bundle Identifier correto
   - Signing Certificate/Provisioning corretos (Automatic recomendado)
3. Selecione o esquema `JogaMuito` e destino `Any iOS Device (arm64)`.
4. Menu: Product > Archive.
5. Aguarde abrir o Organizer com o archive gerado.

## 6. Enviar para App Store Connect

No Organizer:

1. Selecione o archive.
2. Clique em Distribute App.
3. Escolha App Store Connect.
4. Escolha Upload.
5. Mantenha as validacoes padrao e conclua o envio.

Depois do upload:

- Acesse App Store Connect > My Apps > JogaMuito.
- Espere o processamento da build.
- Vincule a build em TestFlight ou na versao de release.

## 7. Checklist antes do envio

- `CFBundleShortVersionString` incrementado.
- `CFBundleVersion` (build number) incrementado.
- Build em modo Release sem erros.
- Testes criticos executados.
- Permissoes e textos de privacidade revisados no App Store Connect.
