import { View, StyleSheet } from 'react-native';
import { Avatar, Text, List, Button, Divider } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
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

      <List.Item
        title="Documents"
        description="Upload, browse, and archive KYC and loan paperwork"
        left={(props) => <List.Icon {...props} icon="file-document-multiple-outline" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => navigation.navigate('Documents')}
      />
      <Divider />
      <List.Item
        title="Reports & Analytics"
        description="Collections, pending/overdue interest, exports"
        left={(props) => <List.Icon {...props} icon="chart-box-outline" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => navigation.navigate('Reports')}
      />
      <Divider />
      <List.Item title="Change Password" left={(props) => <List.Icon {...props} icon="lock-outline" />} disabled />

      <Button mode="outlined" onPress={logout} style={styles.logoutButton} textColor="#DC2626">
        Log Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 110 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { backgroundColor: '#4338CA' },
  profileText: { marginLeft: 16 },
  name: { fontWeight: '700' },
  email: { color: '#6B7280' },
  role: { marginTop: 2, color: '#0D9488', fontWeight: '600' },
  divider: { marginVertical: 16 },
  logoutButton: { marginTop: 24, borderColor: '#DC2626' },
});
