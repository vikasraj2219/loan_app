import { View, StyleSheet } from 'react-native';
import { Avatar, Text, List, Button, Divider } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import PlaceholderNotice from '../../components/PlaceholderNotice';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <Avatar.Text size={56} label={initials} style={styles.avatar} />
        <View style={styles.profileText}>
          <Text variant="titleMedium" style={styles.name}>
            {user?.name}
          </Text>
          <Text variant="bodySmall" style={styles.email}>
            {user?.email}
          </Text>
          <Text variant="labelSmall" style={styles.role}>
            {user?.role === 'admin' ? 'Administrator' : 'Staff'}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <List.Item title="Change Password" left={(props) => <List.Icon {...props} icon="lock-outline" />} disabled />

      <PlaceholderNotice
        title="Reports & Analytics"
        phase="Phase 6"
        description="Collections report, pending/overdue interest, and export tools will live here."
      />

      <Button mode="outlined" onPress={logout} style={styles.logoutButton} textColor="#B3261E">
        Log Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: '#1E3A5F' },
  profileText: { marginLeft: 16 },
  name: { fontWeight: '700' },
  email: { color: '#6B7280' },
  role: { marginTop: 2, color: '#2E7D5B', fontWeight: '600' },
  divider: { marginVertical: 16 },
  logoutButton: { marginTop: 24, borderColor: '#B3261E' },
});
