import { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import { Text, Card, Menu, IconButton, Button, Dialog, Portal, Chip } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { documentApi } from '../../api/documentApi';
import { formatDate, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

function bytesToReadable(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailsScreen({ route, navigation }) {
  const initialDocument = route.params.document;
  const { isAdmin } = useAuth();
  const [document, setDocument] = useState(initialDocument);
  const [menuVisible, setMenuVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // A loan document is always also stamped with its borrower — presence of
  // `loan` is what tells us which owner-scoped endpoint family to use.
  const ownerField = document.loan ? 'loans' : 'borrowers';
  const ownerId = document.loan ? document.loan._id : document.borrower?._id;

  const handleArchive = async () => {
    setMenuVisible(false);
    setBusy(true);
    setError('');
    try {
      await documentApi.archive(ownerField, ownerId, document._id);
      setDocument((prev) => ({ ...prev, status: 'archived' }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not archive document.'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnarchive = async () => {
    setMenuVisible(false);
    setBusy(true);
    setError('');
    try {
      await documentApi.unarchive(ownerField, ownerId, document._id);
      setDocument((prev) => ({ ...prev, status: 'active' }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not restore document.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (permanent) => {
    setBusy(true);
    try {
      await documentApi.remove(ownerField, ownerId, document._id, permanent);
      navigation.goBack();
    } catch (err) {
      setDeleteDialogVisible(false);
      setError(getErrorMessage(err, 'Could not delete document.'));
    } finally {
      setBusy(false);
    }
  };

  const isImage = document.resourceType === 'image';

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard} mode="elevated">
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text variant="titleLarge" style={styles.name}>
                  {document.documentName}
                </Text>
                <View style={styles.chipRow}>
                  <Chip compact style={styles.categoryChip}>
                    {document.category}
                  </Chip>
                  <Chip compact style={document.status === 'archived' ? styles.archivedChip : styles.activeChip}>
                    {document.status === 'archived' ? 'Archived' : 'Active'}
                  </Chip>
                </View>
              </View>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} disabled={busy} />}
              >
                {document.status === 'active' ? (
                  <Menu.Item leadingIcon="archive-outline" title="Archive" onPress={handleArchive} />
                ) : (
                  <Menu.Item leadingIcon="archive-arrow-up-outline" title="Restore" onPress={handleUnarchive} />
                )}
                {isAdmin && (
                  <Menu.Item
                    leadingIcon="delete-outline"
                    title="Delete Permanently"
                    titleStyle={styles.deleteText}
                    onPress={() => {
                      setMenuVisible(false);
                      setDeleteDialogVisible(true);
                    }}
                  />
                )}
              </Menu>
            </View>
            {document.borrower?.name ? (
              <Text variant="bodyMedium" style={styles.ownerLine}>
                {document.borrower.name}
                {document.loan ? ` · Loan ${document.loan._id?.slice(-6)}` : ''}
              </Text>
            ) : null}
          </Card.Content>
        </Card>

        {isImage && document.secureUrl ? (
          <Image source={{ uri: document.secureUrl }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <Card style={styles.previewPlaceholder} mode="outlined">
            <Card.Content style={styles.previewPlaceholderContent}>
              <Text variant="bodyMedium" style={styles.previewPlaceholderText}>
                Preview isn't available for this file type in the app.
              </Text>
            </Card.Content>
          </Card>
        )}

        {document.secureUrl ? (
          <Button mode="outlined" icon="open-in-new" onPress={() => Linking.openURL(document.secureUrl)} style={styles.openButton}>
            Open / Download
          </Button>
        ) : null}

        <Card style={styles.section} mode="outlined">
          <Card.Content>
            <Row label="File Type" value={(document.extension || '').toUpperCase()} />
            <Row label="File Size" value={bytesToReadable(document.fileSize)} />
            <Row label="Uploaded" value={formatDate(document.createdAt)} />
            {document.uploadedBy?.name ? <Row label="Uploaded By" value={document.uploadedBy.name} /> : null}
            <Row label="Downloads" value={formatNumber(document.downloadCount || 0)} />
            {document.description ? <Row label="Description" value={document.description} /> : null}
            {document.tags?.length ? <Row label="Tags" value={document.tags.join(', ')} /> : null}
          </Card.Content>
        </Card>

        {!!error && (
          <Text variant="bodySmall" style={styles.errorText}>
            {error}
          </Text>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Permanently</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This removes the file and its record forever. This cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={() => handleDelete(true)} loading={busy} disabled={busy} textColor="#DC2626">
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
  content: { padding: 16, paddingBottom: 110 },
  headerCard: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1 },
  name: { fontWeight: '700', color: '#4338CA' },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  categoryChip: { backgroundColor: '#E8EEF4' },
  activeChip: { backgroundColor: '#0D94881A' },
  archivedChip: { backgroundColor: '#6B72801A' },
  ownerLine: { marginTop: 8, color: '#3A4453' },
  previewImage: { width: '100%', height: 280, borderRadius: 8, backgroundColor: '#E8EEF4', marginBottom: 12 },
  previewPlaceholder: { marginBottom: 12 },
  previewPlaceholderContent: { alignItems: 'center', paddingVertical: 24 },
  previewPlaceholderText: { color: '#6B7280' },
  openButton: { marginBottom: 16, borderColor: '#4338CA' },
  section: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8EEF4' },
  rowLabel: { color: '#6B7280', flex: 1 },
  rowValue: { flex: 1, textAlign: 'right', fontWeight: '600' },
  deleteText: { color: '#DC2626' },
  errorText: { color: '#DC2626', textAlign: 'center', marginTop: 8 },
});
