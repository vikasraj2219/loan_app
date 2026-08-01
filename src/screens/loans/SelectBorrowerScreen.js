import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, ActivityIndicator, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { borrowerApi } from '../../api/borrowerApi';
import EmptyState from '../../components/EmptyState';
import MobileRecordCard from '../../components/MobileRecordCard';
import { useDebounce } from '../../hooks/useDebounce';

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
        <ActivityIndicator style={styles.loader} size="large" color="#4338CA" />
      ) : (
        <FlatList
          data={borrowers}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <EmptyState
              icon="account-search-outline"
              title="No active borrowers found"
              description="Add a borrower first, or adjust your search."
            />
          }
          renderItem={({ item }) => (
            <MobileRecordCard
              title={item.name}
              subtitle={item.phone}
              onPress={() =>
                navigation.navigate(returnTo, { selectedBorrowerId: item._id, selectedBorrowerName: item.name })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  searchbar: { margin: 16, marginBottom: 8, elevation: 0, backgroundColor: '#F0F2F5' },
  loader: { marginTop: 48 },
});
