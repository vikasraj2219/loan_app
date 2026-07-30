import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BorrowersStackNavigator from './BorrowersStackNavigator';
import LoansStackNavigator from './LoansStackNavigator';
import PaymentsStackNavigator from './PaymentsStackNavigator';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: 'view-dashboard-outline',
  Borrowers: 'account-group-outline',
  Loans: 'cash-multiple',
  Payments: 'credit-card-outline',
  More: 'dots-horizontal-circle-outline',
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={ICONS[route.name]} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#1E3A5F',
        headerStyle: { backgroundColor: '#1E3A5F' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Borrowers" component={BorrowersStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Loans" component={LoansStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Payments" component={PaymentsStackNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="More" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
