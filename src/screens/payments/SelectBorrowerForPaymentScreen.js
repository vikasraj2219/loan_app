import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, ActivityIndicator, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { borrowerApi } from '../../api/borrowerApi';
import EmptyState from '../../components/EmptyState';
import BorrowerCard from '../../components/BorrowerCard';
import { useDebounce } from '../../hooks/useDebounce';
import { colors, typography, spacing } from '../../theme/tokens';

export default function SelectBorrowerForPaymentScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: 'active', limit: 50 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await borrowerApi.list(params);
      setBorrowers(data.data.borrowers);
    } catch {
      setBorrowers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Who's paying?</Text>
        <Searchbar placeholder="Search active borrowers" value={search} onChangeText={setSearch} style={styles.searchbar} />
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.indigo} />
      ) : (
        <FlatList
          data={borrowers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon="account-search-outline" title="No active borrowers found" />}
          renderItem={({ item }) => (
            <BorrowerCard borrower={item} onPress={() => navigation.navigate('SelectLoanForPayment', { borrowerId: item._id, borrowerName: item.name })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.ink, marginBottom: spacing.md },
  searchbar: { backgroundColor: colors.surface },
  loader: { marginTop: 48 },
  listContent: { padding: spacing.lg, paddingTop: 0 },
});
