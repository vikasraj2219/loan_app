import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReportsHomeScreen from '../screens/reports/ReportsHomeScreen';
import CollectionsReportScreen from '../screens/reports/CollectionsReportScreen';
import PendingInterestReportScreen from '../screens/reports/PendingInterestReportScreen';
import OverdueInterestReportScreen from '../screens/reports/OverdueInterestReportScreen';
import InterestHistoryReportScreen from '../screens/reports/InterestHistoryReportScreen';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: '#12153A' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
};

export default function ReportsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="ReportsHome" component={ReportsHomeScreen} options={{ title: 'Reports & Analytics' }} />
      <Stack.Screen name="Collections" component={CollectionsReportScreen} options={{ title: 'Collection Report' }} />
      <Stack.Screen name="PendingInterest" component={PendingInterestReportScreen} options={{ title: 'Pending Interest' }} />
      <Stack.Screen name="OverdueInterest" component={OverdueInterestReportScreen} options={{ title: 'Overdue Interest' }} />
      <Stack.Screen name="InterestHistory" component={InterestHistoryReportScreen} options={{ title: 'Interest History' }} />
    </Stack.Navigator>
  );
}
