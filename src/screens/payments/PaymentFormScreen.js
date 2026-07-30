import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, HelperText, Menu, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { paymentApi } from '../../api/paymentApi';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency } from '../../utils/format';

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export default function PaymentFormScreen({ route, navigation }) {
  const { loanId, borrowerName, principalOutstanding } = route.params;

  const [principalPaid, setPrincipalPaid] = useState('');
  const [interestPaid, setInterestPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [modeMenuVisible, setModeMenuVisible] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const validate = () => {
    const principal = Number(principalPaid) || 0;
    const interest = Number(interestPaid) || 0;
    if (principal <= 0 && interest <= 0) {
      return 'Enter at least a principal or interest amount.';
    }
    if (principal > principalOutstanding) {
      return `Principal paid cannot exceed the outstanding amount of ${formatCurrency(principalOutstanding)}.`;
    }
    return '';
  };

  const pickReceipt = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(fromCamera ? 'Camera permission is required to take a photo.' : 'Photo library permission is required.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled && result.assets?.[0]) {
      setReceiptImage(result.assets[0]);
    }
  };

  const uploadReceiptFor = async (paymentId) => {
    if (!receiptImage) return;
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      const uriParts = receiptImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('receipt', {
        uri: receiptImage.uri,
        name: `receipt.${fileType}`,
        type: receiptImage.mimeType || `image/${fileType}`,
      });
      await paymentApi.uploadReceipt(paymentId, formData);
    } catch (err) {
      // Payment itself already succeeded — surface this as a soft warning, not a blocker.
      setError(getErrorMessage(err, 'Payment recorded, but the receipt upload failed. You can retry from Payment Details.'));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        loan: loanId,
        principalPaid: Number(principalPaid) || 0,
        interestPaid: Number(interestPaid) || 0,
        paymentMode,
      };
      if (referenceNumber.trim()) payload.referenceNumber = referenceNumber.trim();
      if (remarks.trim()) payload.remarks = remarks.trim();

      const { data } = await paymentApi.create(payload);
      const paymentId = data.data.payment._id;

      if (receiptImage) {
        await uploadReceiptFor(paymentId);
      }

      navigation.popToTop();
      navigation.navigate('PaymentDetails', { id: paymentId, borrowerName });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not record payment.'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedModeLabel = PAYMENT_MODES.find((m) => m.value === paymentMode)?.label;
  const busy = submitting || uploadingReceipt;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.contextCard} mode="outlined">
          <Card.Content>
            <Text variant="bodyMedium" style={styles.contextText}>
              {borrowerName}
            </Text>
            <Text variant="bodySmall" style={styles.contextHint}>
              Outstanding Principal: {formatCurrency(principalOutstanding)}
            </Text>
          </Card.Content>
        </Card>

        <TextInput
          label="Principal Paid (₹)"
          value={principalPaid}
          onChangeText={setPrincipalPaid}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          label="Interest Paid (₹)"
          value={interestPaid}
          onChangeText={setInterestPaid}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <Menu
          visible={modeMenuVisible}
          onDismiss={() => setModeMenuVisible(false)}
          anchor={
            <TextInput
              label="Payment Mode"
              value={selectedModeLabel}
              mode="outlined"
              editable={false}
              onPressIn={() => setModeMenuVisible(true)}
              right={<TextInput.Icon icon="menu-down" onPress={() => setModeMenuVisible(true)} />}
              style={styles.input}
            />
          }
        >
          {PAYMENT_MODES.map((m) => (
            <Menu.Item
              key={m.value}
              title={m.label}
              onPress={() => {
                setPaymentMode(m.value);
                setModeMenuVisible(false);
              }}
            />
          ))}
        </Menu>

        <TextInput
          label="Reference Number"
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          mode="outlined"
          placeholder="UTR / cheque no. / transaction id"
          style={styles.input}
        />
        <TextInput
          label="Remarks"
          value={remarks}
          onChangeText={setRemarks}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.sectionLabel}>
          Receipt (optional)
        </Text>
        {receiptImage ? (
          <View style={styles.receiptPreviewWrap}>
            <Image source={{ uri: receiptImage.uri }} style={styles.receiptPreview} />
            <Button compact onPress={() => setReceiptImage(null)}>
              Remove
            </Button>
          </View>
        ) : (
          <View style={styles.receiptButtonsRow}>
            <Button mode="outlined" icon="camera-outline" onPress={() => pickReceipt(true)} style={styles.receiptButton}>
              Camera
            </Button>
            <Button mode="outlined" icon="image-outline" onPress={() => pickReceipt(false)} style={styles.receiptButton}>
              Gallery
            </Button>
          </View>
        )}

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button mode="contained" onPress={handleSubmit} loading={busy} disabled={busy} style={styles.submitButton}>
          {uploadingReceipt ? 'Uploading receipt…' : 'Record Payment'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  contextCard: { marginBottom: 16, backgroundColor: '#F5F7FA' },
  contextText: { fontWeight: '700', color: '#1E3A5F' },
  contextHint: { color: '#6B7280', marginTop: 4 },
  input: { marginBottom: 12 },
  sectionLabel: { marginTop: 4, marginBottom: 8, color: '#1E3A5F', fontWeight: '700' },
  receiptButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  receiptButton: { flex: 1, borderColor: '#1E3A5F' },
  receiptPreviewWrap: { alignItems: 'flex-start', marginBottom: 12 },
  receiptPreview: { width: 140, height: 140, borderRadius: 8, marginBottom: 8, backgroundColor: '#E8EEF4' },
  submitButton: { marginTop: 8, paddingVertical: 4 },
});
