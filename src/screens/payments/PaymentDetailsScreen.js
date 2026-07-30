import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, Linking } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, Menu, IconButton, Button, Dialog, Portal } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { paymentApi } from '../../api/paymentApi';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/ErrorState';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

const MODE_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  other: 'Other',
};

export default function PaymentDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const { data } = await paymentApi.getById(id);
        setPayment(data.data.payment);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load payment.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAttachReceipt = async (fromCamera) => {
    setMenuVisible(false);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(fromCamera ? 'Camera permission is required.' : 'Photo library permission is required.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      const uriParts = asset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('receipt', { uri: asset.uri, name: `receipt.${fileType}`, type: asset.mimeType || `image/${fileType}` });
      await paymentApi.uploadReceipt(id, formData);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload receipt.'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await paymentApi.remove(id);
      navigation.goBack();
    } catch (err) {
      setDeleteDialogVisible(false);
      setError(getErrorMessage(err, 'Could not delete payment.'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (error && !payment) {
    return <ErrorState message={error} onRetry={() => load()} />;
  }

  const total = (payment.principalPaid || 0) + (payment.interestPaid || 0);

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#1E3A5F']} />}
      >
        <Card style={styles.headerCard} mode="elevated">
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text variant="titleLarge" style={styles.amount}>
                  {formatCurrency(total)}
                </Text>
                <Text variant="bodyMedium" style={styles.subLine}>
                  {payment.borrower?.name} · {formatDateTime(payment.paymentDate)}
                </Text>
              </View>
              {isAdmin && (
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} disabled={uploading} />}
                >
                  <Menu.Item
                    leadingIcon="pencil-outline"
                    title="Edit"
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate('PaymentEdit', { id });
                    }}
                  />
                  <Menu.Item leadingIcon="camera-outline" title="Add Receipt (Camera)" onPress={() => handleAttachReceipt(true)} />
                  <Menu.Item leadingIcon="image-outline" title="Add Receipt (Gallery)" onPress={() => handleAttachReceipt(false)} />
                  <Divider />
                  <Menu.Item
                    leadingIcon="delete-outline"
                    title="Delete"
                    titleStyle={styles.deleteText}
                    onPress={() => {
                      setMenuVisible(false);
                      setDeleteDialogVisible(true);
                    }}
                  />
                </Menu>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.section} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Details
            </Text>
            <Row label="Principal Paid" value={formatCurrency(payment.principalPaid)} />
            <Row label="Interest Paid" value={formatCurrency(payment.interestPaid)} />
            <Row label="Payment Mode" value={MODE_LABELS[payment.paymentMode] || payment.paymentMode} />
            {payment.referenceNumber ? <Row label="Reference No." value={payment.referenceNumber} /> : null}
            {payment.principalOutstandingAfter != null ? (
              <Row label="Principal Outstanding After" value={formatCurrency(payment.principalOutstandingAfter)} />
            ) : null}
            {payment.remarks ? <Row label="Remarks" value={payment.remarks} /> : null}
            {payment.recordedBy?.name ? <Row label="Recorded By" value={payment.recordedBy.name} /> : null}
          </Card.Content>
        </Card>

        <Card style={[styles.section, styles.lastSection]} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Receipt
            </Text>
            {payment.receiptFile?.secureUrl ? (
              <View>
                <Image source={{ uri: payment.receiptFile.secureUrl }} style={styles.receiptImage} resizeMode="cover" />
                <Button
                  mode="text"
                  icon="open-in-new"
                  onPress={() => Linking.openURL(payment.receiptFile.secureUrl)}
                  style={styles.openButton}
                >
                  Open Full Size
                </Button>
              </View>
            ) : (
              <View>
                <Text variant="bodyMedium" style={styles.noReceiptText}>
                  No receipt attached.
                </Text>
                <View style={styles.receiptButtonsRow}>
                  <Button
                    mode="outlined"
                    icon="camera-outline"
                    onPress={() => handleAttachReceipt(true)}
                    loading={uploading}
                    disabled={uploading}
                    style={styles.receiptButton}
                  >
                    Camera
                  </Button>
                  <Button
                    mode="outlined"
                    icon="image-outline"
                    onPress={() => handleAttachReceipt(false)}
                    loading={uploading}
                    disabled={uploading}
                    style={styles.receiptButton}
                  >
                    Gallery
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Payment</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This permanently reverses this payment's effect on the loan balance and interest ledger. This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} loading={deleting} disabled={deleting} textColor="#B3261E">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text variant="bodySmall" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  headerCard: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1 },
  amount: { fontWeight: '700', color: '#2E7D5B' },
  subLine: { marginTop: 4, color: '#3A4453' },
  section: { marginBottom: 16 },
  lastSection: { marginBottom: 0 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8EEF4' },
  rowLabel: { color: '#6B7280', flex: 1 },
  rowValue: { flex: 1, textAlign: 'right', fontWeight: '600' },
  deleteText: { color: '#B3261E' },
  receiptImage: { width: '100%', height: 220, borderRadius: 8, backgroundColor: '#E8EEF4' },
  openButton: { alignSelf: 'flex-start', marginTop: 4 },
  noReceiptText: { color: '#6B7280', marginBottom: 12 },
  receiptButtonsRow: { flexDirection: 'row', gap: 12 },
  receiptButton: { flex: 1, borderColor: '#1E3A5F' },
});
