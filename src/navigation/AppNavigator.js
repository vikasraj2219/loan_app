import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BorrowersStackNavigator from './BorrowersStackNavigator';
import LoansStackNavigator from './LoansStackNavigator';
import PaymentsStackNavigator from './PaymentsStackNavigator';
import MoreStackNavigator from './MoreStackNavigator';
import FloatingTabBar from '../components/nav/FloatingTabBar';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Borrowers" component={BorrowersStackNavigator} />
      <Tab.Screen name="Loans" component={LoansStackNavigator} />
      <Tab.Screen name="Payments" component={PaymentsStackNavigator} />
      <Tab.Screen name="More" component={MoreStackNavigator} />
    </Tab.Navigator>
  );
}
