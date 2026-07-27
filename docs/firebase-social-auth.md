# Firebase Auth - Login social no React Native

## Google
1. Ative o provedor Google no Firebase Console > Authentication > Sign-in method.
2. Instale o pacote:
   ```bash
   npm install @react-native-google-signin/google-signin
   ```
3. Configure o projeto e chame o fluxo:
   ```ts
   import { GoogleSignin } from '@react-native-google-signin/google-signin';
   import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
   import { auth } from '../services/firebase';

   GoogleSignin.configure({ webClientId: 'SEU_WEB_CLIENT_ID' });

   const result = await GoogleSignin.signIn();
   const idToken = await result.idToken;
   const googleCredential = GoogleAuthProvider.credential(idToken);
   await signInWithCredential(auth, googleCredential);
   ```

## Facebook
1. Ative o provedor Facebook no Firebase Console.
2. Instale o pacote:
   ```bash
   npm install react-native-fbsdk-next
   ```
3. Exemplo de integração:
   ```ts
   import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
   import { FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
   import { auth } from '../services/firebase';

   const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
   if (!result.isCancelled) {
     const data = await AccessToken.getCurrentAccessToken();
     const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
     await signInWithCredential(auth, facebookCredential);
   }
   ```

## Apple
1. Ative o provedor Apple no Firebase Console.
2. Para iOS, habilite Sign in with Apple no Xcode.
3. Exemplo de integração:
   ```ts
   import { appleAuth } from '@invertase/react-native-apple-authentication';
   import { OAuthProvider, signInWithCredential } from 'firebase/auth';
   import { auth } from '../services/firebase';

   const appleIdToken = await appleAuth.performRequest({
     requestedOperation: appleAuth.Operation.LOGIN,
     requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
   });

   const provider = new OAuthProvider('apple.com');
   const credential = provider.credential({
     idToken: appleIdToken.identityToken,
     accessToken: appleIdToken.authorizationCode,
   });

   await signInWithCredential(auth, credential);
   ```
