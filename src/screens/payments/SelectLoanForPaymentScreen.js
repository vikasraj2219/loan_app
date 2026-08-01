import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ActivityIndicator, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { loanApi } from '../../api/loanApi';
import EmptyState from '../../components/EmptyState';
import MobileRecordCard from '../../components/MobileRecordCard';
import StatusChip from '../../components/StatusChip';
import { formatCurrency } from '../../utils/format';

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
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={loans}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <EmptyState
            icon="cash-remove"
            title="No open loans"
            description={`${borrowerName} has no active or overdue loans to pay against.`}
          />
        }
        renderItem={({ item }) => (
          <MobileRecordCard
            title={formatCurrency(item.loanAmount)}
            subtitle={`Outstanding: ${formatCurrency(item.principalOutstanding)}`}
            statusChip={<StatusChip status={item.status} />}
            onPress={() =>
              navigation.navigate('PaymentForm', {
                loanId: item._id,
                borrowerName,
                principalOutstanding: item.principalOutstanding,
              })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
});
