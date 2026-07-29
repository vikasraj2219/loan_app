import { View, StyleSheet } from 'react-native';
import PlaceholderNotice from '../../components/PlaceholderNotice';

export default function LoansScreen() {
  return (
    <View style={styles.container}>
      <PlaceholderNotice
        title="Loans"
        phase="Phase 3"
        description="List, create loans, view interest schedules, close or mark loans overdue."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
