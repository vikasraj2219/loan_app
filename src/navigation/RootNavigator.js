import { View, StyleSheet, Image } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { colors, typography, spacing } from '../theme/tokens';

function SplashLoading() {
  return (
    <View style={styles.splash}>
      <Image source={require('../../assets/icon.png')} style={styles.splashLogo} resizeMode="contain" />
      <ActivityIndicator size="large" color={colors.indigo} style={styles.splashLoader} />
      <Text style={styles.splashText}>Loading Waghmare Vikas…</Text>
    </View>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <SplashLoading />;

  return <NavigationContainer>{isAuthenticated ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  splashLogo: { width: 96, height: 96, marginBottom: spacing.lg },
  splashLoader: { marginBottom: spacing.sm },
  splashText: { ...typography.body, color: colors.inkMuted },
});
