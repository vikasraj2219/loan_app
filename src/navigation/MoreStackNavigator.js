import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/settings/SettingsScreen';
import DocumentsStackNavigator from './DocumentsStackNavigator';
import ReportsStackNavigator from './ReportsStackNavigator';

const Stack = createNativeStackNavigator();

export default function MoreStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#12153A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="MoreHome" component={SettingsScreen} options={{ title: 'More' }} />
      {/* Nested stack — has its own headers, so hide this outer one for it. */}
      <Stack.Screen name="Documents" component={DocumentsStackNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Reports" component={ReportsStackNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
