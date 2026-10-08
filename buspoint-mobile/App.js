/* BusPoint — aplicativo React Native (Expo).
   Conversão do protótipo web (HTML/CSS/JS) e da API Spring Boot para React Native. */
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
import { Sora_400Regular } from '@expo-google-fonts/sora/400Regular';
import { Sora_500Medium } from '@expo-google-fonts/sora/500Medium';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import { Sora_800ExtraBold } from '@expo-google-fonts/sora/800ExtraBold';
import { colors } from './src/theme';
import { RouterProvider, useRouter } from './src/navigation/router';
import { ROLE_INFO, SessionProvider, useSession } from './src/state/session';
import { ToastProvider } from './src/ui/Toast';
import AccessScreen from './src/screens/AccessScreen';
import AdminScreen from './src/screens/admin/AdminScreen';
import MobileScreen from './src/screens/mobile/MobileScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SystemScreen, { Forbidden } from './src/screens/SystemScreen';
import UserSwitcher from './src/screens/UserSwitcher';

const PROTEGIDAS = ['admin', 'motorista', 'aluno', 'perfil'];

function Root() {
  const { path, reset } = useRouter();
  const session = useSession();
  const [top, ...rest] = path.replace(/^\/+/, '').split('/');
  const slug = rest.join('/');

  // Redireciona conforme a sessão: splash → área do perfil; áreas protegidas → login
  useEffect(() => {
    if (!session.pronto) return;
    if (top === 'acesso' && slug === 'splash') {
      const t = setTimeout(() => reset(session.role ? ROLE_INFO[session.role].home : '/acesso/login'), 700);
      return () => clearTimeout(t);
    }
    if (PROTEGIDAS.includes(top) && !session.role) reset('/acesso/login');
    if (!top) reset(session.role ? ROLE_INFO[session.role].home : '/acesso/login');
    return undefined;
  }, [session.pronto, session.role, top, slug, reset]);

  let screen;
  if (top === 'acesso' || !session.pronto) screen = <AccessScreen key={slug} slug={session.pronto ? slug || 'login' : 'splash'} />;
  else if (PROTEGIDAS.includes(top) && !session.role) screen = <AccessScreen slug="login" />;
  else if (top === 'admin') screen = session.role === 'admin' ? <AdminScreen slug={slug || 'dashboard'} /> : <Forbidden allow="admin" />;
  else if (top === 'motorista' || top === 'aluno') screen = session.role === top ? <MobileScreen key={top} role={top} slug={slug || 'inicio'} /> : <Forbidden allow={top} />;
  else if (top === 'perfil') {
    const r = ['motorista', 'aluno'].includes(slug) ? slug : 'admin';
    screen = session.role === r ? <ProfileScreen role={r} /> : <Forbidden allow={r} />;
  } else if (top === 'estado') screen = <SystemScreen slug={slug || '404'} />;
  else screen = <SystemScreen slug="404" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {screen}
      {top !== 'acesso' ? <UserSwitcher /> : null}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold,
    Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionProvider>
        <RouterProvider initial="/acesso/splash">
          <ToastProvider>
            <Root />
          </ToastProvider>
        </RouterProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
