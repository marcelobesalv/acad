import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';

export async function exportWorkouts(workouts) {
  const json = JSON.stringify(workouts, null, 2);
  const filename = `gym_backup_${Date.now()}.json`;

  if (Platform.OS === 'android') {
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) return;
    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      filename,
      'application/json'
    );
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    Alert.alert('Saved', `Backup saved as ${filename}`);
  } else {
    const path = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(path, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Save Workout Backup',
    });
  }
}

export async function pickAndReadBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const uri = result.assets[0].uri;
  const json = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Invalid backup: expected an array.');
  return parsed;
}
