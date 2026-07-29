import { View, StyleSheet } from 'react-native';
import PlaceholderNotice from '../../components/PlaceholderNotice';

export default function PaymentsScreen() {
  return (
    <View style={styles.container}>
      <PlaceholderNotice
        title="Payments"
        phase="Phase 4"
        description="Record principal/interest payments and upload receipts."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
