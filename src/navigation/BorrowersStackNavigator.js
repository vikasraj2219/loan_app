import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BorrowersScreen from '../screens/borrowers/BorrowersScreen';
import BorrowerDetailsScreen from '../screens/borrowers/BorrowerDetailsScreen';
import BorrowerFormScreen from '../screens/borrowers/BorrowerFormScreen';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: '#12153A' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
};

export default function BorrowersStackNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="BorrowersList" component={BorrowersScreen} options={{ title: 'Borrowers' }} />
      <Stack.Screen
        name="BorrowerDetails"
        component={BorrowerDetailsScreen}
        options={({ route }) => ({ title: route.params?.name || 'Borrower' })}
      />
      <Stack.Screen name="BorrowerForm" component={BorrowerFormScreen} />
    </Stack.Navigator>
  );
}
