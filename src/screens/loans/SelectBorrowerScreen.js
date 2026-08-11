import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { borrowerApi } from '../../api/borrowerApi';
import EmptyState from '../../components/EmptyState';
import BorrowerCard from '../../components/BorrowerCard';
import { useDebounce } from '../../hooks/useDebounce';
import { colors, spacing } from '../../theme/tokens';

export default function SelectBorrowerScreen({ navigation, route }) {
  const returnTo = route.params?.returnTo || 'LoanForm';
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
      <Searchbar
        placeholder="Search active borrowers"
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.indigo} />
      ) : (
        <FlatList
          data={borrowers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="account-search-outline"
              title="No active borrowers found"
              description="Add a borrower first, or adjust your search."
            />
          }
          renderItem={({ item }) => (
            <BorrowerCard
              borrower={item}
              onPress={() => navigation.navigate(returnTo, { selectedBorrowerId: item._id, selectedBorrowerName: item.name })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchbar: { margin: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.surface },
  loader: { marginTop: 48 },
  listContent: { padding: spacing.lg, paddingTop: 0 },
});
