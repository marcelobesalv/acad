import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { getAllExerciseNames, getExerciseHistory } from '../storage/storage';
import { COLORS } from '../constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const [names, setNames] = useState([]);
  const [selected, setSelected] = useState('');
  const [chartData, setChartData] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllExerciseNames().then(n => {
        if (!active) return;
        setNames(n);
        if (n.length > 0 && !selected) setSelected(n[0]);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!selected) return;
    let active = true;
    getExerciseHistory(selected).then(history => {
      if (!active) return;
      setChartData(
        history.map(p => ({
          value: p.maxWeight,
          label: p.date.slice(5),
          dataPointText: String(p.maxWeight),
        }))
      );
    });
    return () => {
      active = false;
    };
  }, [selected]);

  const chartWidth = Math.max(chartData.length * 70, screenWidth - 48);

  return (
    <SafeAreaView style={s.root}>
      {names.length === 0 ? (
        <Text style={s.empty}>No exercises logged yet.</Text>
      ) : (
        <>
          <Text style={s.label}>Exercise</Text>
          <TouchableOpacity
            style={s.selectorBtn}
            onPress={() => setPickerVisible(true)}
          >
            <Text style={s.selectorText}>{selected || 'Select exercise'}</Text>
            <Text style={s.chevron}>▼</Text>
          </TouchableOpacity>

          {chartData.length >= 2 ? (
            <View style={s.chartCard}>
              <Text style={s.chartLabel}>Max weight per session (kg)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={220}
                  color={COLORS.accent}
                  thickness={2}
                  dataPointsColor={COLORS.accent}
                  dataPointsRadius={5}
                  backgroundColor={COLORS.surface}
                  xAxisColor={COLORS.border}
                  yAxisColor={COLORS.border}
                  xAxisLabelTextStyle={{
                    color: COLORS.textSecondary,
                    fontSize: 10,
                    width: 40,
                  }}
                  yAxisTextStyle={{
                    color: COLORS.textSecondary,
                    fontSize: 10,
                  }}
                  hideRules={false}
                  rulesColor={COLORS.border}
                  curved
                  isAnimated
                  noOfSections={5}
                  initialSpacing={16}
                  spacing={60}
                  textShiftY={-10}
                  textShiftX={-6}
                  textFontSize={10}
                  dataPointTextColor={COLORS.textSecondary}
                />
              </ScrollView>
            </View>
          ) : chartData.length === 1 ? (
            <View style={s.singleCard}>
              <Text style={s.singleLabel}>Only 1 session logged.</Text>
              <Text style={s.singleVal}>{chartData[0].value} kg</Text>
              <Text style={s.singleHint}>
                Log more sessions to see a chart.
              </Text>
            </View>
          ) : (
            <Text style={s.empty}>No sets logged for this exercise.</Text>
          )}
        </>
      )}

      {/* Exercise picker modal */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.pickerCard}>
            <Text style={s.pickerTitle}>Select Exercise</Text>
            <FlatList
              data={names}
              keyExtractor={item => item}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    s.pickerItem,
                    item === selected && s.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelected(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      s.pickerItemText,
                      item === selected && s.pickerItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={s.pickerClose}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={s.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectorBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectorText: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  chevron: { color: COLORS.textSecondary, fontSize: 12 },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 16,
  },
  chartLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  singleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  singleLabel: { color: COLORS.textSecondary, fontSize: 14 },
  singleVal: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 28,
    marginVertical: 8,
  },
  singleHint: { color: COLORS.textSecondary, fontSize: 13 },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
  },
  pickerTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 12,
  },
  pickerItem: { padding: 14, borderRadius: 8 },
  pickerItemActive: { backgroundColor: COLORS.surfaceAlt },
  pickerItemText: { color: COLORS.text, fontSize: 16 },
  pickerItemTextActive: { color: COLORS.accent, fontWeight: '700' },
  pickerClose: {
    marginTop: 12,
    padding: 13,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
  },
  pickerCloseText: { color: COLORS.textSecondary, fontWeight: '600' },
});
