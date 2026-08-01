import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
      <Text variant="titleMedium" style={styles.title}>
        {message}
      </Text>
      {onRetry ? (
        <Button mode="outlined" onPress={onRetry} style={styles.button}>
          Try Again
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { marginTop: 12, color: '#3A4453', fontWeight: '600', textAlign: 'center' },
  button: { marginTop: 16 },
});
