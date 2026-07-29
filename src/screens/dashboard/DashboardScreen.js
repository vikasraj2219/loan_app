import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import PlaceholderNotice from '../../components/PlaceholderNotice';

export default function DashboardScreen() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.greeting}>
        Welcome, {user?.name?.split(' ')[0] || 'there'}
      </Text>
      <PlaceholderNotice
        title="Dashboard"
        phase="Phase 2"
        description="Summary stats, collection trend, loan status chart, overdue loans and top borrowers will appear here."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  greeting: { marginBottom: 16, fontWeight: '700', color: '#1E3A5F' },
});
