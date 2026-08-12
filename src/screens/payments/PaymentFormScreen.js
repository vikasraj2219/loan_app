import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, HelperText, Menu, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { paymentApi } from '../../api/paymentApi';
import { loanApi } from '../../api/loanApi';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency } from '../../utils/format';
import StepProgress from '../../components/StepProgress';
import { colors, radius, shadow, typography, spacing } from '../../theme/tokens';

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const STEPS = ['Amount', 'Allocate', 'Method', 'Confirm'];

export default function PaymentFormScreen({ route, navigation }) {
  const { loanId, borrowerName, principalOutstanding: initialOutstanding } = route.params;

  const [step, setStep] = useState(0);
  const [loanContext, setLoanContext] = useState({ principalOutstanding: initialOutstanding, pendingInterest: 0, loading: true });

  const [paymentAmount, setPaymentAmount] = useState('');
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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await loanApi.getById(loanId);
        const loan = data.data.loan;
        const pendingInterest = Math.max((loan.totalInterestAccrued || 0) - (loan.totalInterestPaid || 0), 0);
        setLoanContext({ principalOutstanding: loan.principalOutstanding, pendingInterest, loading: false });
      } catch {
        setLoanContext((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, [loanId]);

  const amountNum = Number(paymentAmount) || 0;
  const principalNum = Number(principalPaid) || 0;
  const interestNum = Number(interestPaid) || 0;
  const unallocated = amountNum - principalNum - interestNum;

  const applySmartSplit = (amount) => {
    const interestPortion = Math.min(amount, loanContext.pendingInterest);
    const principalPortion = Math.max(amount - interestPortion, 0);
    setInterestPaid(interestPortion ? String(interestPortion) : '');
    setPrincipalPaid(principalPortion ? String(principalPortion) : '');
  };

  const handleAmountNext = () => {
    setError('');
    if (amountNum <= 0) {
      setError('Enter a payment amount greater than 0.');
      return;
    }
    applySmartSplit(amountNum);
    setStep(1);
  };

  const handleAllocateNext = () => {
    setError('');
    if (principalNum <= 0 && interestNum <= 0) {
      setError('Enter at least a principal or interest amount.');
      return;
    }
    if (Math.abs(unallocated) > 0.5) {
      setError(`Principal + Interest must equal the payment amount (${formatCurrency(unallocated > 0 ? unallocated : -unallocated)} ${unallocated > 0 ? 'unallocated' : 'over'}).`);
      return;
    }
    if (principalNum > loanContext.principalOutstanding) {
      setError(`Principal paid cannot exceed the outstanding amount of ${formatCurrency(loanContext.principalOutstanding)}.`);
      return;
    }
    setStep(2);
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
    if (!result.canceled && result.assets?.[0]) setReceiptImage(result.assets[0]);
  };

  const uploadReceiptFor = async (paymentId) => {
    if (!receiptImage) return;
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      const uriParts = receiptImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('receipt', { uri: receiptImage.uri, name: `receipt.${fileType}`, type: receiptImage.mimeType || `image/${fileType}` });
      await paymentApi.uploadReceipt(paymentId, formData);
    } catch (err) {
      setError(getErrorMessage(err, 'Payment recorded, but the receipt upload failed. You can retry from Payment Details.'));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = { loan: loanId, principalPaid: principalNum, interestPaid: interestNum, paymentMode };
      if (referenceNumber.trim()) payload.referenceNumber = referenceNumber.trim();
      if (remarks.trim()) payload.remarks = remarks.trim();

      const { data } = await paymentApi.create(payload);
      const paymentId = data.data.payment._id;
      if (receiptImage) await uploadReceiptFor(paymentId);

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
      <View style={styles.progressWrap}>
        <StepProgress steps={STEPS} activeIndex={step} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.contextCard}>
          <Text style={styles.contextName}>{borrowerName}</Text>
          {loanContext.loading ? (
            <ActivityIndicator size="small" color={colors.indigo} style={{ marginTop: 8 }} />
          ) : (
            <View style={styles.contextRow}>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>Outstanding Principal</Text>
                <Text style={styles.contextValue}>{formatCurrency(loanContext.principalOutstanding)}</Text>
              </View>
              <View style={styles.contextItem}>
                <Text style={styles.contextLabel}>Pending Interest</Text>
                <Text style={[styles.contextValue, { color: colors.amber }]}>{formatCurrency(loanContext.pendingInterest)}</Text>
              </View>
            </View>
          )}
        </View>

        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>How much is being paid?</Text>
            <TextInput
              label="Payment Amount (₹)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              mode="outlined"
              keyboardType="numeric"
              autoFocus
              style={styles.input}
            />
            <HelperText type="error" visible={!!error}>{error}</HelperText>
            <Button mode="contained" onPress={handleAmountNext} style={styles.primaryButton}>
              Continue
            </Button>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Allocate the payment</Text>
            <Text style={styles.stepSubtitle}>We've suggested a split — adjust if needed.</Text>
            <TextInput label="Interest (₹)" value={interestPaid} onChangeText={setInterestPaid} mode="outlined" keyboardType="numeric" style={styles.input} />
            <TextInput label="Principal (₹)" value={principalPaid} onChangeText={setPrincipalPaid} mode="outlined" keyboardType="numeric" style={styles.input} />

            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Payment Amount</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(amountNum)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Allocated</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(principalNum + interestNum)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, unallocated !== 0 && { color: colors.amber, fontWeight: '700' }]}>
                  {unallocated >= 0 ? 'Unallocated' : 'Over-allocated'}
                </Text>
                <Text style={[styles.breakdownValue, unallocated !== 0 && { color: colors.amber }]}>
                  {formatCurrency(Math.abs(unallocated))}
                </Text>
              </View>
            </View>

            <HelperText type="error" visible={!!error}>{error}</HelperText>
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setStep(0)} style={styles.secondaryButton}>Back</Button>
              <Button mode="contained" onPress={handleAllocateNext} style={styles.primaryButtonFlex}>Continue</Button>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Payment method</Text>
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
                <Menu.Item key={m.value} title={m.label} onPress={() => { setPaymentMode(m.value); setModeMenuVisible(false); }} />
              ))}
            </Menu>
            <TextInput label="Reference Number" value={referenceNumber} onChangeText={setReferenceNumber} mode="outlined" placeholder="UTR / cheque no. / transaction id" style={styles.input} />
            <TextInput label="Remarks" value={remarks} onChangeText={setRemarks} mode="outlined" multiline numberOfLines={2} style={styles.input} />

            <Text style={styles.subLabel}>Receipt (optional)</Text>
            {receiptImage ? (
              <View style={styles.receiptPreviewWrap}>
                <Image source={{ uri: receiptImage.uri }} style={styles.receiptPreview} />
                <Button compact onPress={() => setReceiptImage(null)}>Remove</Button>
              </View>
            ) : (
              <View style={styles.receiptButtonsRow}>
                <Button mode="outlined" icon="camera-outline" onPress={() => pickReceipt(true)} style={styles.receiptButton}>Camera</Button>
                <Button mode="outlined" icon="image-outline" onPress={() => pickReceipt(false)} style={styles.receiptButton}>Gallery</Button>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setStep(1)} style={styles.secondaryButton}>Back</Button>
              <Button mode="contained" onPress={() => setStep(3)} style={styles.primaryButtonFlex}>Review</Button>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Confirm payment</Text>
            <View style={styles.breakdownCard}>
              <ConfirmRow label="Borrower" value={borrowerName} />
              <ConfirmRow label="Principal" value={formatCurrency(principalNum)} />
              <ConfirmRow label="Interest" value={formatCurrency(interestNum)} />
              <ConfirmRow label="Total" value={formatCurrency(principalNum + interestNum)} emphasize />
              <ConfirmRow label="Payment Mode" value={selectedModeLabel} />
              {referenceNumber.trim() ? <ConfirmRow label="Reference" value={referenceNumber.trim()} /> : null}
              <ConfirmRow label="Receipt" value={receiptImage ? 'Attached' : 'None'} />
            </View>

            <HelperText type="error" visible={!!error}>{error}</HelperText>
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={() => setStep(2)} style={styles.secondaryButton} disabled={busy}>Back</Button>
              <Button mode="contained" onPress={handleSubmit} loading={busy} disabled={busy} style={styles.primaryButtonFlex}>
                {uploadingReceipt ? 'Uploading…' : 'Record Payment'}
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ConfirmRow({ label, value, emphasize }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, emphasize && { color: colors.teal, fontSize: 17 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  progressWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 110 },
  contextCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.sm },
  contextName: { ...typography.h3, color: colors.ink },
  contextRow: { flexDirection: 'row', marginTop: spacing.md },
  contextItem: { flex: 1 },
  contextLabel: { ...typography.caption, color: colors.inkFaint, marginBottom: 2 },
  contextValue: { ...typography.bodyLarge, color: colors.ink, fontWeight: '700' },
  stepTitle: { ...typography.h2, color: colors.ink, marginBottom: spacing.xs },
  stepSubtitle: { ...typography.body, color: colors.inkMuted, marginBottom: spacing.md },
  input: { marginBottom: spacing.md },
  subLabel: { ...typography.h3, fontSize: 15, color: colors.ink, marginBottom: spacing.sm },
  breakdownCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md, ...shadow.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { ...typography.body, color: colors.inkMuted },
  breakdownValue: { ...typography.body, color: colors.ink, fontWeight: '700' },
  receiptButtonsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  receiptButton: { flex: 1, borderColor: colors.indigo },
  receiptPreviewWrap: { alignItems: 'flex-start', marginBottom: spacing.md },
  receiptPreview: { width: 120, height: 120, borderRadius: radius.md, marginBottom: 8, backgroundColor: colors.surfaceAlt },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  secondaryButton: { flex: 1, borderColor: colors.indigo },
  primaryButton: { marginTop: spacing.sm, paddingVertical: 4 },
  primaryButtonFlex: { flex: 1 },
});
