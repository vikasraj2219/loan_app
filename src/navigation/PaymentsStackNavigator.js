import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import SelectBorrowerForPaymentScreen from '../screens/payments/SelectBorrowerForPaymentScreen';
import SelectLoanForPaymentScreen from '../screens/payments/SelectLoanForPaymentScreen';
import PaymentFormScreen from '../screens/payments/PaymentFormScreen';
import PaymentDetailsScreen from '../screens/payments/PaymentDetailsScreen';
import PaymentEditScreen from '../screens/payments/PaymentEditScreen';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: '#12153A' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
};

export default function PaymentsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="PaymentsList" component={PaymentsScreen} options={{ title: 'Payments' }} />
      <Stack.Screen
        name="SelectBorrowerForPayment"
        component={SelectBorrowerForPaymentScreen}
        options={{ title: 'Select Borrower' }}
      />
      <Stack.Screen
        name="SelectLoanForPayment"
        component={SelectLoanForPaymentScreen}
        options={({ route }) => ({ title: route.params?.borrowerName || 'Select Loan' })}
      />
      <Stack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: 'Record Payment' }} />
      <Stack.Screen
        name="PaymentDetails"
        component={PaymentDetailsScreen}
        options={({ route }) => ({ title: route.params?.borrowerName || 'Payment' })}
      />
      <Stack.Screen name="PaymentEdit" component={PaymentEditScreen} options={{ title: 'Edit Payment' }} />
    </Stack.Navigator>
  );
}
