import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, Linking, Share } from 'react-native';
import { Text, ActivityIndicator, Menu, IconButton, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { paymentApi } from '../../api/paymentApi';
import { useAuth } from '../../context/AuthContext';
import ErrorState from '../../components/ErrorState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

const MODE_LABELS = { cash: 'Cash', bank_transfer: 'Bank Transfer', upi: 'UPI', cheque: 'Cheque', other: 'Other' };

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

  const handleShareReceipt = async () => {
    const total = (payment.principalPaid || 0) + (payment.interestPaid || 0);
    const lines = [
      'PAYMENT RECEIPT',
      '',
      `Borrower: ${payment.borrower?.name}`,
      `Date: ${formatDateTime(payment.paymentDate)}`,
      `Principal: ${formatCurrency(payment.principalPaid)}`,
      `Interest: ${formatCurrency(payment.interestPaid)}`,
      `Total: ${formatCurrency(total)}`,
      `Payment Mode: ${MODE_LABELS[payment.paymentMode] || payment.paymentMode}`,
      payment.referenceNumber ? `Reference: ${payment.referenceNumber}` : null,
    ].filter(Boolean);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // user cancelled share sheet — nothing to do
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
        <ActivityIndicator size="large" color={colors.indigo} />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.indigo]} />}
      >
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
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

        {/* Receipt card */}
        <View style={styles.receiptCard}>
          <View style={styles.successBadge}>
            <MaterialCommunityIcons name="check" size={22} color={colors.white} />
          </View>
          <Text style={styles.receiptAmount}>{formatCurrency(total)}</Text>
          <Text style={styles.receiptSub}>{payment.borrower?.name}</Text>
          <Text style={styles.receiptDate}>{formatDateTime(payment.paymentDate)}</Text>

          <View style={styles.dashedDivider} />

          <ReceiptRow label="Principal" value={formatCurrency(payment.principalPaid)} />
          <ReceiptRow label="Interest" value={formatCurrency(payment.interestPaid)} />
          <View style={styles.receiptTotalRow}>
            <Text style={styles.receiptTotalLabel}>Total</Text>
            <Text style={styles.receiptTotalValue}>{formatCurrency(total)}</Text>
          </View>

          <View style={styles.dashedDivider} />

          <ReceiptRow label="Payment Mode" value={MODE_LABELS[payment.paymentMode] || payment.paymentMode} />
          {payment.referenceNumber ? <ReceiptRow label="Reference No." value={payment.referenceNumber} /> : null}
          {payment.principalOutstandingAfter != null ? (
            <ReceiptRow label="Outstanding After" value={formatCurrency(payment.principalOutstandingAfter)} />
          ) : null}
          {payment.recordedBy?.name ? <ReceiptRow label="Recorded By" value={payment.recordedBy.name} /> : null}
          {payment.remarks ? <ReceiptRow label="Remarks" value={payment.remarks} /> : null}
        </View>

        <View style={styles.actionsRow}>
          <Button mode="outlined" icon="share-variant-outline" onPress={handleShareReceipt} style={styles.actionButton}>
            Share
          </Button>
        </View>

        {/* Receipt photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Photo</Text>
          {payment.receiptFile?.secureUrl ? (
            <View>
              <Image source={{ uri: payment.receiptFile.secureUrl }} style={styles.receiptImage} resizeMode="cover" />
              <Button mode="text" icon="open-in-new" onPress={() => Linking.openURL(payment.receiptFile.secureUrl)} style={styles.openButton}>
                Open Full Size
              </Button>
            </View>
          ) : (
            <View>
              <Text style={styles.noReceiptText}>No receipt photo attached.</Text>
              <View style={styles.receiptButtonsRow}>
                <Button mode="outlined" icon="camera-outline" onPress={() => handleAttachReceipt(true)} loading={uploading} disabled={uploading} style={styles.receiptButton}>
                  Camera
                </Button>
                <Button mode="outlined" icon="image-outline" onPress={() => handleAttachReceipt(false)} loading={uploading} disabled={uploading} style={styles.receiptButton}>
                  Gallery
                </Button>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={deleteDialogVisible}
        onDismiss={() => setDeleteDialogVisible(false)}
        icon="delete-outline"
        tone="coral"
        title="Delete Payment"
        message="This permanently reverses this payment's effect on the loan balance and interest ledger. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </View>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptRowLabel}>{label}</Text>
      <Text style={styles.receiptRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 110 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: -8 },
  receiptCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', ...shadow.md },
  successBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  receiptAmount: { ...typography.display, color: colors.ink },
  receiptSub: { ...typography.bodyLarge, color: colors.inkMuted, marginTop: 4, fontWeight: '600' },
  receiptDate: { ...typography.caption, color: colors.inkFaint, marginTop: 2 },
  dashedDivider: {
    width: '100%',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.lg,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 6 },
  receiptRowLabel: { ...typography.body, color: colors.inkMuted },
  receiptRowValue: { ...typography.body, color: colors.ink, fontWeight: '700' },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8 },
  receiptTotalLabel: { ...typography.h3, color: colors.ink },
  receiptTotalValue: { ...typography.h3, color: colors.teal },
  actionsRow: { flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.lg },
  actionButton: { flex: 1, borderColor: colors.indigo },
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.sm },
  sectionTitle: { ...typography.h3, color: colors.ink, marginBottom: spacing.md },
  receiptImage: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  openButton: { alignSelf: 'flex-start', marginTop: 4 },
  noReceiptText: { color: colors.inkMuted, marginBottom: spacing.md },
  receiptButtonsRow: { flexDirection: 'row', gap: spacing.md },
  receiptButton: { flex: 1, borderColor: colors.indigo },
  deleteText: { color: colors.coral },
});
