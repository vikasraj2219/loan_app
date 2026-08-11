import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { loanApi } from '../../api/loanApi';
import EmptyState from '../../components/EmptyState';
import LoanCard from '../../components/LoanCard';
import { colors, typography, spacing } from '../../theme/tokens';

export default function SelectLoanForPaymentScreen({ route, navigation }) {
  const { borrowerId, borrowerName } = route.params;
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await loanApi.list({ borrower: borrowerId, limit: 50 });
      // Only loans that can still accept a payment.
      setLoans(data.data.loans.filter((l) => l.status !== 'closed'));
    } catch {
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [borrowerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Which loan is this for?</Text>
      <FlatList
        data={loans}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="cash-remove" title="No open loans" description={`${borrowerName} has no active or overdue loans to pay against.`} />
        }
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            onPress={() =>
              navigation.navigate('PaymentForm', { loanId: item._id, borrowerName, principalOutstanding: item.principalOutstanding })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { ...typography.h2, color: colors.ink, padding: spacing.lg, paddingBottom: spacing.md },
  listContent: { padding: spacing.lg, paddingTop: 0 },
});
