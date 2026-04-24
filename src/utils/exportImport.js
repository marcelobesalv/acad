import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export async function exportWorkouts(workouts) {
  const json = JSON.stringify(workouts, null, 2);
  const ts = Date.now();
  const path = FileSystem.cacheDirectory + `gym_backup_${ts}.json`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: 'Export Workout Data',
  });
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
