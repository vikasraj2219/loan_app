import { View, StyleSheet } from 'react-native';
import PlaceholderNotice from '../../components/PlaceholderNotice';

export default function BorrowersScreen() {
  return (
    <View style={styles.container}>
      <PlaceholderNotice
        title="Borrowers"
        phase="Phase 2"
        description="List, search, add, edit borrowers and view their KYC documents."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
