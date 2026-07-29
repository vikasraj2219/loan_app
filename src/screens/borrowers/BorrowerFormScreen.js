import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, Menu, ActivityIndicator } from 'react-native-paper';
import { borrowerApi } from '../../api/borrowerApi';
import { getErrorMessage } from '../../utils/errors';

const ID_PROOF_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  idProofType: 'other',
  idProofNumber: '',
  occupation: '',
  guarantorName: '',
  guarantorPhone: '',
  notes: '',
};

export default function BorrowerFormScreen({ route, navigation }) {
  const editId = route.params?.id;
  const isEdit = !!editId;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [idMenuVisible, setIdMenuVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Borrower' : 'Add Borrower' });
  }, [isEdit, navigation]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await borrowerApi.getById(editId);
        const b = data.data.borrower;
        setForm({
          name: b.name || '',
          phone: b.phone || '',
          email: b.email || '',
          address: b.address || '',
          idProofType: b.idProofType || 'other',
          idProofNumber: b.idProofNumber || '',
          occupation: b.occupation || '',
          guarantorName: b.guarantorName || '',
          guarantorPhone: b.guarantorPhone || '',
          notes: b.notes || '',
        });
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load borrower.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, editId]);

  const update = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.phone.trim() || !/^[0-9+\-\s()]{7,15}$/.test(form.phone.trim())) {
      return 'Please provide a valid phone number.';
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return 'Please provide a valid email.';
    }
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
      const payload = { ...form };
      if (!payload.email.trim()) delete payload.email;
      if (isEdit) {
        await borrowerApi.update(editId, payload);
      } else {
        await borrowerApi.create(payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save borrower.'));
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

  const selectedIdLabel = ID_PROOF_TYPES.find((t) => t.value === form.idProofType)?.label || 'Other';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleSmall" style={styles.sectionLabel}>
          Basic Details
        </Text>
        <TextInput label="Full Name *" value={form.name} onChangeText={update('name')} mode="outlined" style={styles.input} />
        <TextInput
          label="Phone *"
          value={form.phone}
          onChangeText={update('phone')}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          label="Email"
          value={form.email}
          onChangeText={update('email')}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          label="Address"
          value={form.address}
          onChangeText={update('address')}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.sectionLabel}>
          Identification
        </Text>
        <Menu
          visible={idMenuVisible}
          onDismiss={() => setIdMenuVisible(false)}
          anchor={
            <TextInput
              label="ID Proof Type"
              value={selectedIdLabel}
              mode="outlined"
              editable={false}
              onPressIn={() => setIdMenuVisible(true)}
              right={<TextInput.Icon icon="menu-down" onPress={() => setIdMenuVisible(true)} />}
              style={styles.input}
            />
          }
        >
          {ID_PROOF_TYPES.map((t) => (
            <Menu.Item
              key={t.value}
              title={t.label}
              onPress={() => {
                update('idProofType')(t.value);
                setIdMenuVisible(false);
              }}
            />
          ))}
        </Menu>
        <TextInput
          label="ID Proof Number"
          value={form.idProofNumber}
          onChangeText={update('idProofNumber')}
          mode="outlined"
          style={styles.input}
        />
        <TextInput label="Occupation" value={form.occupation} onChangeText={update('occupation')} mode="outlined" style={styles.input} />

        <Text variant="titleSmall" style={styles.sectionLabel}>
          Guarantor (optional)
        </Text>
        <TextInput
          label="Guarantor Name"
          value={form.guarantorName}
          onChangeText={update('guarantorName')}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Guarantor Phone"
          value={form.guarantorPhone}
          onChangeText={update('guarantorPhone')}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.sectionLabel}>
          Notes
        </Text>
        <TextInput
          label="Notes"
          value={form.notes}
          onChangeText={update('notes')}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.submitButton}>
          {isEdit ? 'Save Changes' : 'Add Borrower'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { marginTop: 8, marginBottom: 8, color: '#1E3A5F', fontWeight: '700' },
  input: { marginBottom: 12 },
  submitButton: { marginTop: 8, paddingVertical: 4 },
});
