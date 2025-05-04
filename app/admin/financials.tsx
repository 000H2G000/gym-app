import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StyleProp, TextStyle, ViewStyle, Alert } from 'react-native';
import { Divider } from '@rneui/themed';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import { LineChart } from '../../components/ui/ChartWrapper';
import { getAllPayments, Payment } from '../../services/paymentService';

type PaymentWithUser = Payment & {
  userName: string;
  plan: string;
};

type FinancialMetrics = {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  averageSubscriptionValue: number;
};

type RevenueByMonth = {
  month: string;
  amount: number;
};

const getFinancialData = async () => {
  try {
    const payments = await getAllPayments();
    
    const totalRevenue = payments.reduce((sum, payment) => 
      payment.status === 'completed' ? sum + payment.amount : sum, 0);
    
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const monthlyPayments = payments.filter(
      payment => payment.status === 'completed' && payment.date >= firstDayOfMonth
    );
    
    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const activeSubscriptions = 45;
    const averageSubscriptionValue = activeSubscriptions > 0 ? 
      Math.round(totalRevenue / activeSubscriptions * 100) / 100 : 0;
    
    const recentPayments = payments.slice(0, 10).map(payment => ({
      id: payment.id,
      userId: payment.userId,
      userName: 'User ' + payment.userId.substring(0, 5),
      amount: payment.amount,
      date: payment.date.toISOString(),
      status: payment.status,
      plan: payment.description || 'Standard Plan',
    }));
    
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      
      const monthPayments = payments.filter(payment => {
        const paymentMonth = payment.date.getMonth();
        const paymentYear = payment.date.getFullYear();
        return payment.status === 'completed' && 
               paymentMonth === monthDate.getMonth() &&
               paymentYear === monthDate.getFullYear();
      });
      
      const monthRevenue = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      revenueByMonth.push({
        month: monthName,
        amount: monthRevenue
      });
    }
    
    return {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions,
      averageSubscriptionValue,
      recentPayments,
      revenueByMonth
    };
  } catch (error) {
    console.error('Error fetching financial data:', error);
    throw error;
  }
};

const exportFinancialReport = async () => {
  Alert.alert(
    "Export Report",
    "This feature is not yet implemented. It would export financial data to CSV or PDF.",
    [{ text: "OK" }]
  );
  return true;
};

const generateMonthlyReport = async (month: number, year: number) => {
  Alert.alert(
    "Generate Monthly Report",
    "This feature is not yet implemented. It would generate a detailed monthly financial report.",
    [{ text: "OK" }]
  );
  return true;
};

export default function FinancialsScreen() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    averageSubscriptionValue: 0,
  });
  const [recentPayments, setRecentPayments] = useState<PaymentWithUser[]>([]);
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        color: () => Colors[colorScheme || 'light'].tint,
      },
    ],
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      const data = await getFinancialData();

      setMetrics({
        totalRevenue: data.totalRevenue,
        monthlyRevenue: data.monthlyRevenue,
        activeSubscriptions: data.activeSubscriptions,
        averageSubscriptionValue: data.averageSubscriptionValue,
      });

      setRecentPayments(data.recentPayments);

      setChartData({
        labels: data.revenueByMonth.map(item => item.month),
        datasets: [
          {
            data: data.revenueByMonth.map(item => item.amount),
            color: () => Colors[colorScheme || 'light'].tint,
          },
        ],
      });

    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme || 'light'].tint} />
        <Text style={{ color: Colors[colorScheme || 'light'].text, marginTop: 10 }}>Loading financial data...</Text>
      </View>
    );
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'failed':
        return '#F44336';
      default:
        return Colors[colorScheme || 'light'].text;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors[colorScheme || 'light'].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.headerTitle, { color: Colors[colorScheme || 'light'].text }]}>
        Financial Dashboard
      </Text>

      <View style={[styles.metricsContainer, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
            ${metrics.totalRevenue.toLocaleString()}
          </Text>
          <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
            Total Revenue
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
            ${metrics.monthlyRevenue.toLocaleString()}
          </Text>
          <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
            Monthly Revenue
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
            {metrics.activeSubscriptions}
          </Text>
          <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
            Active Subscriptions
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
            ${metrics.averageSubscriptionValue.toFixed(2)}
          </Text>
          <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
            Avg. Subscription
          </Text>
        </View>
      </View>

      <View style={[styles.chartContainer, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme || 'light'].text }]}>
          Revenue Trend
        </Text>
        <LineChart
          data={chartData}
          height={220}
          width={350}
          bezier
          style={styles.chart}
          yAxisSuffix="$"
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: Colors[colorScheme || 'light'].cardBackground,
            backgroundGradientFrom: Colors[colorScheme || 'light'].cardBackground,
            backgroundGradientTo: Colors[colorScheme || 'light'].cardBackground,
            decimalPlaces: 0,
            color: () => Colors[colorScheme || 'light'].tint,
            labelColor: () => Colors[colorScheme || 'light'].text,
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: Colors[colorScheme || 'light'].tint,
            },
          }}
        />
      </View>

      <View style={[styles.recentPaymentsContainer, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme || 'light'].text }]}>
          Recent Payments
        </Text>

        {recentPayments.length > 0 ? (
          recentPayments.map((payment, index) => (
            <View key={payment.id}>
              <View style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.userName, { color: Colors[colorScheme || 'light'].text }]}>
                    {payment.userName}
                  </Text>
                  <View style={styles.paymentDetailContainer}>
                    <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>
                      {new Date(payment.date).toLocaleDateString()}
                    </Text>
                    <View style={styles.planChipContainer}>
                      <Text style={styles.planChipText}>
                        {payment.plan}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.paymentRightSection}>
                  <Text style={{ color: Colors[colorScheme || 'light'].text, fontWeight: 'bold' }}>
                    ${payment.amount.toFixed(2)}
                  </Text>
                  <Text style={{ color: getStatusColor(payment.status) }}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Text>
                </View>
              </View>
              {index < recentPayments.length - 1 && <Divider />}
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>No recent payments</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          onPress={exportFinancialReport}
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
        >
          <Text style={{ color: Colors[colorScheme || 'light'].text }}>
            Export Report
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => generateMonthlyReport(new Date().getMonth() + 1, new Date().getFullYear())}
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
        >
          <Text style={{ color: Colors[colorScheme || 'light'].text }}>
            Generate Monthly Report
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  metricItem: {
    width: '50%',
    paddingVertical: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 14,
  },
  chartContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chart: {
    marginTop: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  recentPaymentsContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  planChipContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  planChipText: {
    fontSize: 12,
    color: '#007AFF',
  },
  paymentRightSection: {
    alignItems: 'flex-end',
  },
  noDataContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});