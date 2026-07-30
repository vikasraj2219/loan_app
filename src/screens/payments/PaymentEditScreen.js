import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, Menu, ActivityIndicator, Banner } from 'react-native-paper';
import { paymentApi } from '../../api/paymentApi';
import { getErrorMessage } from '../../utils/errors';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export default function PaymentEditScreen({ route, navigation }) {
  const { id } = route.params;

  const [principalPaid, setPrincipalPaid] = useState('');
  const [interestPaid, setInterestPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [modeMenuVisible, setModeMenuVisible] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await paymentApi.getById(id);
        const p = data.data.payment;
        setPrincipalPaid(String(p.principalPaid ?? 0));
        setInterestPaid(String(p.interestPaid ?? 0));
        setPaymentDate(p.paymentDate ? p.paymentDate.slice(0, 10) : '');
        setPaymentMode(p.paymentMode || 'cash');
        setReferenceNumber(p.referenceNumber || '');
        setRemarks(p.remarks || '');
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load payment.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const validate = () => {
    const principal = Number(principalPaid) || 0;
    const interest = Number(interestPaid) || 0;
    if (principal <= 0 && interest <= 0) return 'At least one of principal or interest must be greater than 0.';
    if (paymentDate && !ISO_DATE_RE.test(paymentDate)) return 'Date must be in YYYY-MM-DD format.';
    return '';
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
        principalPaid: Number(principalPaid) || 0,
        interestPaid: Number(interestPaid) || 0,
        paymentMode,
      };
      if (paymentDate) payload.paymentDate = paymentDate;
      payload.referenceNumber = referenceNumber.trim();
      payload.remarks = remarks.trim();
      await paymentApi.update(id, payload);
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update payment.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  const selectedModeLabel = PAYMENT_MODES.find((m) => m.value === paymentMode)?.label;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Banner visible icon="information-outline" style={styles.banner}>
          Editing re-runs interest allocation from scratch — any months this payment cleared may shift.
        </Banner>

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
        <TextInput
          label="Payment Date (YYYY-MM-DD)"
          value={paymentDate}
          onChangeText={setPaymentDate}
          mode="outlined"
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
          style={styles.input}
        />
        <TextInput label="Remarks" value={remarks} onChangeText={setRemarks} mode="outlined" multiline numberOfLines={2} style={styles.input} />

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.submitButton}>
          Save Changes
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { marginBottom: 16, borderRadius: 8, overflow: 'hidden' },
  input: { marginBottom: 12 },
  submitButton: { marginTop: 8, paddingVertical: 4 },
});
