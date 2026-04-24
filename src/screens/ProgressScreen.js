import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, Dimensions, ScrollView, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { getAllExerciseNames, getExerciseHistory } from '../storage/storage';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { theme: C } = useTheme();
  const [names, setNames]               = useState([]);
  const [selected, setSelected]         = useState('');
  const [chartData, setChartData]       = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllExerciseNames().then(n => {
        if (!active) return;
        setNames(n);
        if (n.length > 0 && !selected) setSelected(n[0]);
      });
      return () => { active = false; };
    }, [])
  );

  useEffect(() => {
    if (!selected) return;
    let active = true;
    getExerciseHistory(selected).then(history => {
      if (!active) return;
      setChartData(history.map(p => ({
        value: p.maxWeight,
        label: p.date.slice(5),
        dataPointText: String(p.maxWeight),
      })));
    });
    return () => { active = false; };
  }, [selected]);

  const chartWidth = Math.max(chartData.length * 70, screenWidth - 48);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
      {names.length === 0 ? (
        <Text style={[s.empty, { color: C.textSecondary }]}>No exercises logged yet.</Text>
      ) : (
        <>
          <Text style={[s.label, { color: C.textSecondary }]}>Exercise</Text>
          <TouchableOpacity style={[s.selectorBtn, { backgroundColor: C.surface }]} onPress={() => setPickerVisible(true)}>
            <Text style={[s.selectorText, { color: C.text }]}>{selected || 'Select exercise'}</Text>
            <Text style={[s.chevron, { color: C.textSecondary }]}>▼</Text>
          </TouchableOpacity>

          {chartData.length >= 2 ? (
            <View style={[s.chartCard, { backgroundColor: C.surface }]}>
              <Text style={[s.chartLabel, { color: C.textSecondary }]}>Max weight per session (kg)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={220}
                  color={C.accent}
                  thickness={2}
                  dataPointsColor={C.accent}
                  dataPointsRadius={5}
                  backgroundColor={C.surface}
                  xAxisColor={C.border}
                  yAxisColor={C.border}
                  xAxisLabelTextStyle={{ color: C.textSecondary, fontSize: 10, width: 40 }}
                  yAxisTextStyle={{ color: C.textSecondary, fontSize: 10 }}
                  hideRules={false}
                  rulesColor={C.border}
                  curved isAnimated
                  noOfSections={5}
                  initialSpacing={16}
                  spacing={60}
                  textShiftY={-10}
                  textShiftX={-6}
                  textFontSize={10}
                  dataPointTextColor={C.textSecondary}
                />
              </ScrollView>
            </View>
          ) : chartData.length === 1 ? (
            <View style={[s.singleCard, { backgroundColor: C.surface }]}>
              <Text style={[s.singleLabel, { color: C.textSecondary }]}>Only 1 session logged.</Text>
              <Text style={[s.singleVal, { color: C.accent }]}>{chartData[0].value} kg</Text>
              <Text style={[s.singleHint, { color: C.textSecondary }]}>Log more sessions to see a chart.</Text>
            </View>
          ) : (
            <Text style={[s.empty, { color: C.textSecondary }]}>No sets logged for this exercise.</Text>
          )}
        </>
      )}

      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={[s.pickerCard, { backgroundColor: C.surface }]}>
            <Text style={[s.pickerTitle, { color: C.text }]}>Select Exercise</Text>
            <FlatList
              data={names}
              keyExtractor={item => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, item === selected && { backgroundColor: C.surfaceAlt }]}
                  onPress={() => { setSelected(item); setPickerVisible(false); }}
                >
                  <Text style={[s.pickerItemText, { color: C.text }, item === selected && { color: C.accent, fontWeight: '700' }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[s.pickerClose, { backgroundColor: C.surfaceAlt }]} onPress={() => setPickerVisible(false)}>
              <Text style={[s.pickerCloseText, { color: C.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, padding: 16 },
  label:        { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  selectorBtn:  { borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  selectorText: { fontWeight: '700', fontSize: 16 },
  chevron:      { fontSize: 12 },
  chartCard:    { borderRadius: 10, padding: 16 },
  chartLabel:   { fontSize: 12, marginBottom: 12 },
  singleCard:   { borderRadius: 10, padding: 20, alignItems: 'center' },
  singleLabel:  { fontSize: 14 },
  singleVal:    { fontWeight: '700', fontSize: 28, marginVertical: 8 },
  singleHint:   { fontSize: 13 },
  empty:        { textAlign: 'center', marginTop: 60, fontSize: 15 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  pickerCard:   { borderRadius: 16, padding: 16 },
  pickerTitle:  { fontWeight: '700', fontSize: 18, marginBottom: 12 },
  pickerItem:   { padding: 14, borderRadius: 8 },
  pickerItemText: { fontSize: 16 },
  pickerClose:  { marginTop: 12, padding: 13, borderRadius: 8, alignItems: 'center' },
  pickerCloseText: { fontWeight: '600' },
});
