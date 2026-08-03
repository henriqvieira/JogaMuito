# Android release signing (JogaMuito)

Este guia configura a assinatura de release para gerar `app-release.apk` assinado.

## 1. Gerar keystore de release

No diretorio `apps/JogaMuito/android`, execute:

```bash
keytool -genkeypair -v \
  -keystore app/jogamuito-release-key.jks \
  -alias jogamuito_key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Preencha os dados solicitados e guarde as senhas com seguranca.

## 2. Configurar credenciais no gradle.properties

Edite `apps/JogaMuito/android/gradle.properties` e preencha:

```properties
RELEASE_STORE_FILE=app/jogamuito-release-key.jks
RELEASE_STORE_PASSWORD=SUA_SENHA_DO_KEYSTORE
RELEASE_KEY_ALIAS=jogamuito_key
RELEASE_KEY_PASSWORD=SUA_SENHA_DA_CHAVE
```

Observacoes:

- `RELEASE_STORE_FILE` pode ser relativo ao diretorio `android/` ou absoluto.
- Nunca suba senhas reais para o repositorio remoto.

## 3. Build Gradle de release

O arquivo `android/app/build.gradle` ja esta configurado para:

- ler `RELEASE_STORE_FILE`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD`;
- aplicar `signingConfig signingConfigs.release` no `buildTypes.release`;
- interromper o build com erro claro se alguma credencial nao estiver definida.

## 4. Gerar APK assinado

No diretorio `apps/JogaMuito/android`, execute:

```bash
./gradlew clean assembleRelease
```

No Windows PowerShell, tambem funciona:

```powershell
.\gradlew.bat clean assembleRelease
```

APK de saida:

- `apps/JogaMuito/android/app/build/outputs/apk/release/app-release.apk`

## 5. Verificar assinatura do APK

Opcional, mas recomendado:

```bash
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

Se o comando terminar sem erro de assinatura, o APK esta pronto para distribuicao/publicacao.
