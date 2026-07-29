import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, IconButton, Menu, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borrowerApi } from '../../api/borrowerApi';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import StatusChip from '../../components/StatusChip';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export default function BorrowerDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [borrower, setBorrower] = useState(null);
  const [interestSummary, setInterestSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const loadBorrower = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const { data } = await borrowerApi.getById(id);
        setBorrower(data.data.borrower);
        setInterestSummary(data.data.interestSummary);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load borrower.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      loadBorrower();
    }, [loadBorrower])
  );

  const handleDeactivate = async () => {
    setMenuVisible(false);
    try {
      await borrowerApi.remove(id);
      loadBorrower();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not deactivate borrower.'));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (error && !borrower) {
    return <ErrorState message={error} onRetry={() => loadBorrower()} />;
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBorrower(true)} colors={['#1E3A5F']} />}
      >
        <Card style={styles.headerCard} mode="elevated">
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text variant="titleLarge" style={styles.name}>
                  {borrower.name}
                </Text>
                <StatusChip status={borrower.status} />
              </View>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
              >
                <Menu.Item
                  leadingIcon="pencil-outline"
                  title="Edit"
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate('BorrowerForm', { id });
                  }}
                />
                {isAdmin && borrower.status === 'active' && (
                  <Menu.Item leadingIcon="account-off-outline" title="Deactivate" onPress={handleDeactivate} />
                )}
              </Menu>
            </View>

            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#6B7280" />
              <Text
                variant="bodyMedium"
                style={styles.contactText}
                onPress={() => Linking.openURL(`tel:${borrower.phone}`)}
              >
                {borrower.phone}
              </Text>
            </View>
            {borrower.email ? (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="email-outline" size={16} color="#6B7280" />
                <Text variant="bodyMedium" style={styles.contactText}>
                  {borrower.email}
                </Text>
              </View>
            ) : null}
            {borrower.address ? (
              <View style={styles.contactRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color="#6B7280" />
                <Text variant="bodyMedium" style={styles.contactText}>
                  {borrower.address}
                </Text>
              </View>
            ) : null}
          </Card.Content>
        </Card>

        {interestSummary && (interestSummary.pendingMonths > 0 || interestSummary.lastInterestPaidOn) && (
          <Card style={styles.section} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Interest Summary
              </Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Pending Months
                  </Text>
                  <Text variant="titleMedium" style={styles.summaryValue}>
                    {interestSummary.pendingMonths}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Pending Amount
                  </Text>
                  <Text variant="titleMedium" style={[styles.summaryValue, { color: '#B08900' }]}>
                    {formatCurrency(interestSummary.pendingInterestAmount)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Next Due
                  </Text>
                  <Text variant="titleMedium" style={styles.summaryValue}>
                    {formatDate(interestSummary.nextInterestDueDate)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="bodySmall" style={styles.summaryLabel}>
                    Last Paid
                  </Text>
                  <Text variant="titleMedium" style={styles.summaryValue}>
                    {formatDate(interestSummary.lastInterestPaidOn)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {(borrower.occupation || borrower.guarantorName || borrower.idProofNumber) && (
          <Card style={styles.section} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Additional Details
              </Text>
              {borrower.occupation ? (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Occupation
                  </Text>
                  <Text variant="bodyMedium">{borrower.occupation}</Text>
                </View>
              ) : null}
              {borrower.idProofNumber ? (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    ID Proof
                  </Text>
                  <Text variant="bodyMedium">
                    {borrower.idProofType} · {borrower.idProofNumber}
                  </Text>
                </View>
              ) : null}
              {borrower.guarantorName ? (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Guarantor
                  </Text>
                  <Text variant="bodyMedium">
                    {borrower.guarantorName}
                    {borrower.guarantorPhone ? ` · ${borrower.guarantorPhone}` : ''}
                  </Text>
                </View>
              ) : null}
            </Card.Content>
          </Card>
        )}

        <Card style={[styles.section, styles.lastSection]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Loans
            </Text>
            {!borrower.loans || borrower.loans.length === 0 ? (
              <EmptyState icon="cash-multiple" title="No loans yet" description="Loans management arrives in Phase 3." />
            ) : (
              borrower.loans.map((loan, idx) => (
                <View key={loan._id}>
                  {idx > 0 && <Divider />}
                  <View style={styles.loanRow}>
                    <View style={styles.loanRowText}>
                      <Text variant="bodyMedium" style={styles.rowTitle}>
                        {formatCurrency(loan.loanAmount)}
                      </Text>
                      <Text variant="bodySmall" style={styles.rowSubtitle}>
                        {loan.interestRate}% monthly · {formatDate(loan.createdAt)}
                      </Text>
                    </View>
                    <StatusChip status={loan.status} />
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  headerCard: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1, gap: 6 },
  name: { fontWeight: '700', color: '#1E3A5F' },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  contactText: { color: '#3A4453' },
  section: { marginBottom: 16 },
  lastSection: { marginBottom: 0 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  summaryItem: { width: '50%', marginBottom: 12 },
  summaryLabel: { color: '#6B7280', marginBottom: 2 },
  summaryValue: { fontWeight: '700', color: '#1E3A5F' },
  detailRow: { marginBottom: 10 },
  detailLabel: { color: '#6B7280', marginBottom: 2 },
  loanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  loanRowText: { flex: 1 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#6B7280', marginTop: 2 },
});
