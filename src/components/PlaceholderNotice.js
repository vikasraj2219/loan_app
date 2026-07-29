import { StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';

export default function PlaceholderNotice({ title, phase, description }) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Chip style={styles.chip} compact>
          {phase}
        </Chip>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 8 },
  chip: { alignSelf: 'flex-start', marginBottom: 12, backgroundColor: '#E8EEF4' },
  title: { fontWeight: '600', marginBottom: 6 },
  description: { color: '#6B7280' },
});
