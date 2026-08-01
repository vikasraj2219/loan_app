import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons, Menu, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { documentApi } from '../../api/documentApi';
import { getErrorMessage } from '../../utils/errors';

const FALLBACK_CATEGORIES = {
  borrower: ['Aadhaar Card', 'PAN Card', 'Address Proof', 'Income Proof', 'Bank Passbook', 'Other Documents'],
  loan: ['Loan Agreement', 'Security Documents', 'Signed Agreements', 'Payment Receipts', 'Other Supporting Documents'],
};

export default function DocumentUploadScreen({ route, navigation }) {
  const [ownerType, setOwnerType] = useState(route.params?.ownerType || 'borrower');
  const [ownerId, setOwnerId] = useState(route.params?.ownerId || '');
  const [ownerName, setOwnerName] = useState(route.params?.ownerName || '');

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES[ownerType]);
  const [category, setCategory] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await documentApi.getCategories(ownerType);
        if (data.data.categories?.length) setCategories(data.data.categories);
      } catch {
        // Fallback list already set — categories are suggestions only, not critical.
      }
    })();
    setCategory('');
  }, [ownerType]);

  // Picking an owner from SelectOwnerScreen merges these params back in.
  useEffect(() => {
    if (route.params?.ownerId) {
      setOwnerId(route.params.ownerId);
      setOwnerName(route.params.ownerName);
    }
  }, [route.params?.ownerId, route.params?.ownerName]);

  const pickFile = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(fromCamera ? 'Camera permission is required.' : 'Photo library permission is required.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets?.[0]) {
      setFile(result.assets[0]);
    }
  };

  const validate = () => {
    if (!ownerId) return `Please select a ${ownerType}.`;
    if (!category) return 'Please select a category.';
    if (!file) return 'Please attach a photo of the document.';
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
      const formData = new FormData();
      const uriParts = file.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('files', {
        uri: file.uri,
        name: `document.${fileType}`,
        type: file.mimeType || `image/${fileType}`,
      });
      formData.append('category', category);
      if (documentName.trim()) formData.append('documentName', documentName.trim());
      if (description.trim()) formData.append('description', description.trim());

      const ownerField = ownerType === 'borrower' ? 'borrowers' : 'loans';
      await documentApi.upload(ownerField, ownerId, formData);
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload document.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleSmall" style={styles.sectionLabel}>
          Belongs To
        </Text>
        <SegmentedButtons
          value={ownerType}
          onValueChange={(v) => {
            setOwnerType(v);
            setOwnerId('');
            setOwnerName('');
          }}
          style={styles.segmented}
          buttons={[
            { value: 'borrower', label: 'Borrower' },
            { value: 'loan', label: 'Loan' },
          ]}
        />
        <Button
          mode="outlined"
          icon="account-search-outline"
          onPress={() => navigation.navigate('SelectDocumentOwner', { ownerType })}
          style={styles.selectButton}
          contentStyle={styles.selectButtonContent}
        >
          {ownerName || `Select a ${ownerType}`}
        </Button>

        <Text variant="titleSmall" style={styles.sectionLabel}>
          Document Details
        </Text>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <TextInput
              label="Category *"
              value={category}
              mode="outlined"
              editable={false}
              onPressIn={() => setCategoryMenuVisible(true)}
              right={<TextInput.Icon icon="menu-down" onPress={() => setCategoryMenuVisible(true)} />}
              style={styles.input}
            />
          }
        >
          {categories.map((c) => (
            <Menu.Item
              key={c}
              title={c}
              onPress={() => {
                setCategory(c);
                setCategoryMenuVisible(false);
              }}
            />
          ))}
        </Menu>
        <TextInput
          label="Document Name"
          value={documentName}
          onChangeText={setDocumentName}
          mode="outlined"
          placeholder="Defaults to the file name"
          style={styles.input}
        />
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.input}
        />

        <Text variant="titleSmall" style={styles.sectionLabel}>
          File *
        </Text>
        {file ? (
          <View style={styles.filePreviewWrap}>
            <Image source={{ uri: file.uri }} style={styles.filePreview} />
            <Button compact onPress={() => setFile(null)}>
              Remove
            </Button>
          </View>
        ) : (
          <View style={styles.fileButtonsRow}>
            <Button mode="outlined" icon="camera-outline" onPress={() => pickFile(true)} style={styles.fileButton}>
              Camera
            </Button>
            <Button mode="outlined" icon="image-outline" onPress={() => pickFile(false)} style={styles.fileButton}>
              Gallery
            </Button>
          </View>
        )}
        <Text variant="bodySmall" style={styles.fileHint}>
          Photos only from this app — for PDF uploads, use the web dashboard.
        </Text>

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.submitButton}>
          Upload Document
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },
  sectionLabel: { marginTop: 8, marginBottom: 8, color: '#4338CA', fontWeight: '700' },
  segmented: { marginBottom: 12 },
  selectButton: { marginBottom: 4, borderColor: '#4338CA' },
  selectButtonContent: { justifyContent: 'flex-start', paddingVertical: 4 },
  input: { marginBottom: 12 },
  fileButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  fileButton: { flex: 1, borderColor: '#4338CA' },
  filePreviewWrap: { alignItems: 'flex-start', marginBottom: 8 },
  filePreview: { width: 140, height: 140, borderRadius: 8, marginBottom: 8, backgroundColor: '#E8EEF4' },
  fileHint: { color: '#6B7280', marginBottom: 8 },
  submitButton: { marginTop: 8, paddingVertical: 4 },
});
