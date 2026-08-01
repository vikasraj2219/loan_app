import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, ActivityIndicator, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { borrowerApi } from '../../api/borrowerApi';
import { loanApi } from '../../api/loanApi';
import EmptyState from '../../components/EmptyState';
import MobileRecordCard from '../../components/MobileRecordCard';
import StatusChip from '../../components/StatusChip';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/format';

export default function SelectDocumentOwnerScreen({ route, navigation }) {
  const { ownerType } = route.params;
  const isLoan = ownerType === 'loan';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isLoan) {
        const { data } = await loanApi.list({ limit: 50, status: 'active' });
        setItems(data.data.loans);
      } else {
        const params = { status: 'active', limit: 50 };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const { data } = await borrowerApi.list(params);
        setItems(data.data.borrowers);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isLoan, debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredItems = isLoan && debouncedSearch.trim()
    ? items.filter((l) => l.borrower?.name?.toLowerCase().includes(debouncedSearch.trim().toLowerCase()))
    : items;

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={isLoan ? 'Search by borrower name' : 'Search borrowers'}
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4338CA" />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <EmptyState
              icon="account-search-outline"
              title={isLoan ? 'No active loans found' : 'No active borrowers found'}
            />
          }
          renderItem={({ item }) =>
            isLoan ? (
              <MobileRecordCard
                title={item.borrower?.name}
                subtitle={formatCurrency(item.loanAmount)}
                statusChip={<StatusChip status={item.status} />}
                onPress={() =>
                  navigation.navigate('DocumentUpload', { ownerId: item._id, ownerName: `${item.borrower?.name} · ${formatCurrency(item.loanAmount)}` })
                }
              />
            ) : (
              <MobileRecordCard
                title={item.name}
                subtitle={item.phone}
                onPress={() => navigation.navigate('DocumentUpload', { ownerId: item._id, ownerName: item.name })}
              />
            )
          }
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
