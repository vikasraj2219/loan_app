import { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, SegmentedButtons, ActivityIndicator, Divider, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { documentApi } from '../../api/documentApi';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import MobileRecordCard from '../../components/MobileRecordCard';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const PAGE_LIMIT = 20;

const FILE_ICONS = {
  image: 'file-image-outline',
  raw: 'file-pdf-box',
  video: 'file-video-outline',
};

export default function DocumentsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState('active');
  const [documents, setDocuments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDocuments = useCallback(
    async ({ pageToLoad = 1, append = false, isRefresh = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const params = { page: pageToLoad, limit: PAGE_LIMIT, status: statusFilter };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

        const { data } = await documentApi.listAll(params);
        const list = data.data.documents;
        setDocuments((prev) => (append ? [...prev, ...list] : list));
        setHasNextPage(!!data.meta?.hasNextPage);
        setPage(pageToLoad);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load documents.'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [statusFilter, debouncedSearch]
  );

  useFocusEffect(
    useCallback(() => {
      fetchDocuments({ pageToLoad: 1 });
    }, [fetchDocuments])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchDocuments({ pageToLoad: page + 1, append: true });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <Searchbar
          placeholder="Search documents, tags, description"
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
        <SegmentedButtons
          value={statusFilter}
          onValueChange={setStatusFilter}
          buttons={[
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
            { value: 'all', label: 'All' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4338CA" />
      ) : error && documents.length === 0 ? (
        <ErrorState message={error} onRetry={() => fetchDocuments({ pageToLoad: 1 })} />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDocuments({ pageToLoad: 1, isRefresh: true })}
              colors={['#4338CA']}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            <EmptyState
              icon="file-document-outline"
              title="No documents found"
              description={debouncedSearch ? 'Try a different search term.' : 'Upload a document to get started.'}
            />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#4338CA" /> : null}
          renderItem={({ item }) => (
            <MobileRecordCard
              title={item.documentName}
              subtitle={`${item.category}${item.borrower?.name ? ' · ' + item.borrower.name : ''} · ${formatDate(item.createdAt)}`}
              right={
                <MaterialCommunityIcons
                  name={FILE_ICONS[item.resourceType] || 'file-outline'}
                  size={22}
                  color="#6B7280"
                  style={styles.fileIcon}
                />
              }
              onPress={() => navigation.navigate('DocumentDetails', { document: item })}
            />
          )}
        />
      )}

      <FAB icon="plus" color="#FFFFFF" style={styles.fab} label="Upload" onPress={() => navigation.navigate('DocumentUpload')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  filters: { padding: 16, paddingBottom: 8, backgroundColor: '#fff' },
  searchbar: { marginBottom: 12, elevation: 0, backgroundColor: '#F0F2F5' },
  searchInput: { fontSize: 15, minHeight: 40 },
  loader: { marginTop: 48 },
  footerLoader: { marginVertical: 16 },
  listContent: { flexGrow: 1, paddingBottom: 96 },
  fileIcon: { marginRight: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#4338CA' },
});
