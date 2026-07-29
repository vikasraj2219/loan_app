import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EmptyState({ icon = 'inbox-outline', title = 'Nothing here yet', description }) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={48} color="#C4CDD9" />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { marginTop: 12, color: '#3A4453', fontWeight: '600' },
  description: { marginTop: 4, color: '#8892A0', textAlign: 'center' },
});
