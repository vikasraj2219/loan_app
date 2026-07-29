import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatCard({ label, value, icon, color = '#1E3A5F', onPress }) {
  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text variant="titleLarge" style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '48%', marginBottom: 12 },
  content: { alignItems: 'flex-start' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: { fontWeight: '700' },
  label: { color: '#6B7280', marginTop: 2 },
});
