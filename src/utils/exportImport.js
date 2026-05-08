import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';

export async function exportWorkouts(workouts, templates = [], plans = []) {
  const payload = { version: 2, workouts, templates, plans };
  const json = JSON.stringify(payload, null, 2);
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

// Returns { workouts, templates, plans } — always, regardless of file version.
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

  // v1: flat array of workouts
  if (Array.isArray(parsed)) {
    return { workouts: parsed, templates: [], plans: [] };
  }

  // v2: { version, workouts, templates, plans }
  if (parsed && parsed.version === 2 && Array.isArray(parsed.workouts)) {
    return {
      workouts: parsed.workouts,
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
    };
  }

  throw new Error('Invalid backup file format.');
}
