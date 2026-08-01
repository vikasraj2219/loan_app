import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import DocumentDetailsScreen from '../screens/documents/DocumentDetailsScreen';
import DocumentUploadScreen from '../screens/documents/DocumentUploadScreen';
import SelectDocumentOwnerScreen from '../screens/documents/SelectDocumentOwnerScreen';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: '#12153A' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
};

export default function DocumentsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="DocumentsList" component={DocumentsScreen} options={{ title: 'Documents' }} />
      <Stack.Screen
        name="DocumentDetails"
        component={DocumentDetailsScreen}
        options={({ route }) => ({ title: route.params?.document?.documentName || 'Document' })}
      />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Upload Document' }} />
      <Stack.Screen
        name="SelectDocumentOwner"
        component={SelectDocumentOwnerScreen}
        options={({ route }) => ({ title: route.params?.ownerType === 'loan' ? 'Select Loan' : 'Select Borrower' })}
      />
    </Stack.Navigator>
  );
}
