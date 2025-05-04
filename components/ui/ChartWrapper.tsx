import React from 'react';
import { 
  LineChart as RNLineChart, 
  BarChart as RNBarChart, 
  PieChart as RNPieChart,
  ContributionGraph,
  ProgressChart
} from 'react-native-chart-kit';
import { filterWebResponderProps } from '../../utils/svgUtils';

/**
 * Wraps the LineChart component to prevent responder prop warnings on web
 */
export const LineChart = (props: React.ComponentProps<typeof RNLineChart>) => {
  const safeProps = filterWebResponderProps(props);
  return <RNLineChart {...safeProps} />;
};

/**
 * Wraps the BarChart component to prevent responder prop warnings on web
 */
export const BarChart = (props: React.ComponentProps<typeof RNBarChart>) => {
  const safeProps = filterWebResponderProps(props);
  return <RNBarChart {...safeProps} />;
};

/**
 * Wraps the PieChart component to prevent responder prop warnings on web
 */
export const PieChart = (props: React.ComponentProps<typeof RNPieChart>) => {
  const safeProps = filterWebResponderProps(props);
  return <RNPieChart {...safeProps} />;
};

/**
 * Wraps the ContributionGraph component to prevent responder prop warnings on web
 */
export const ContributionGraphWrapper = (props: React.ComponentProps<typeof ContributionGraph>) => {
  const safeProps = filterWebResponderProps(props);
  return <ContributionGraph {...safeProps} />;
};

/**
 * Wraps the ProgressChart component to prevent responder prop warnings on web
 */
export const ProgressChartWrapper = (props: React.ComponentProps<typeof ProgressChart>) => {
  const safeProps = filterWebResponderProps(props);
  return <ProgressChart {...safeProps} />;
};

export default {
  LineChart,
  BarChart,
  PieChart,
  ContributionGraphWrapper,
  ProgressChartWrapper
};