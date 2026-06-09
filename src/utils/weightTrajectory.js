import { parseISO, format, differenceInCalendarDays, addDays } from 'date-fns';

export function buildTargetTrajectory(profile, weightLogs, pointCount = 7) {
  const startWeight = weightLogs.length
    ? weightLogs[0].weight
    : Number(profile.weight) || null;
  const targetWeight = Number(profile.targetWeight) || null;
  const targetDate = profile.targetDate ? parseISO(profile.targetDate) : null;
  const startDate = weightLogs.length ? parseISO(weightLogs[0].date) : new Date();

  if (!startWeight || !targetWeight || !targetDate) return [];

  const totalDays = Math.max(differenceInCalendarDays(targetDate, startDate), 1);
  const slope = (targetWeight - startWeight) / totalDays;
  const count = Math.max(pointCount, 2);
  const points = [];

  for (let i = 0; i < count; i++) {
    const day = addDays(startDate, i);
    const elapsed = differenceInCalendarDays(day, startDate);
    const value = Math.round((startWeight + slope * elapsed) * 10) / 10;
    points.push({
      value,
      label: i % Math.ceil(count / 5) === 0 ? format(day, 'M/d') : '',
      hideDataPoint: true,
    });
  }
  return points;
}

export function buildWeightChartData(weightLogs, maxPoints = 14) {
  const slice = weightLogs.slice(-maxPoints);
  return slice.map((log, i) => ({
    value: log.weight,
    label: i % Math.max(Math.ceil(slice.length / 5), 1) === 0
      ? format(parseISO(log.date), 'M/d')
      : '',
    dataPointText: String(log.weight),
  }));
}

export function alignTrajectoryToWeight(weightData, trajectoryData) {
  if (!weightData.length || !trajectoryData.length) return trajectoryData;
  const len = weightData.length;
  if (trajectoryData.length >= len) return trajectoryData.slice(trajectoryData.length - len);
  const padded = [...trajectoryData];
  while (padded.length < len) padded.unshift({ ...padded[0], label: '', hideDataPoint: true });
  return padded.slice(-len);
}
