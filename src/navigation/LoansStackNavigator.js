import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoansScreen from '../screens/loans/LoansScreen';
import LoanDetailsScreen from '../screens/loans/LoanDetailsScreen';
import LoanFormScreen from '../screens/loans/LoanFormScreen';
import SelectBorrowerScreen from '../screens/loans/SelectBorrowerScreen';
import InterestScheduleScreen from '../screens/loans/InterestScheduleScreen';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: '#12153A' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
};

export default function LoansStackNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="LoansList" component={LoansScreen} options={{ title: 'Loans' }} />
      <Stack.Screen
        name="LoanDetails"
        component={LoanDetailsScreen}
        options={({ route }) => ({ title: route.params?.borrowerName || 'Loan' })}
      />
      <Stack.Screen name="LoanForm" component={LoanFormScreen} />
      <Stack.Screen name="SelectBorrower" component={SelectBorrowerScreen} options={{ title: 'Select Borrower' }} />
      <Stack.Screen
        name="InterestSchedule"
        component={InterestScheduleScreen}
        options={({ route }) => ({ title: route.params?.borrowerName ? `${route.params.borrowerName} · Interest` : 'Interest Schedule' })}
      />
    </Stack.Navigator>
  );
}
