import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Title, 
  Paragraph, 
  Chip, 
  Menu, 
  Divider,
  SegmentedButtons
} from 'react-native-paper';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { 
  getMonthlyReports, 
  getPaymentsByPeriod, 
  calculateRevenue, 
  Payment, 
  FinancialPeriod 
} from '@/services/userService';

const screenWidth = Dimensions.get('window').width;

type ChartTimeframe = 'monthly' | 'quarterly' | 'yearly';
type ChartMetric = 'revenue' | 'subscriptions' | 'retention';
type DateRange = 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'this-year' | 'custom';

export default function FinancialsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>('monthly');
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('revenue');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('this-month');
  const [rangeMenuVisible, setRangeMenuVisible] = useState(false);
  const [revenueData, setRevenueData] = useState<FinancialPeriod[]>([]);
  const [currentPeriodData, setCurrentPeriodData] = useState<FinancialPeriod | null>(null);
  const [comparisonPeriodData, setComparisonPeriodData] = useState<FinancialPeriod | null>(null);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState<{
    basic: number;
    premium: number;
    pro: number;
  }>({ basic: 0, premium: 0, pro: 0 });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  
  const colorScheme = useColorScheme();

  // Get date ranges based on selected timeframe
  const getDateRanges = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let startDate: Date;
    let endDate: Date;
    let comparisonStartDate: Date;
    let comparisonEndDate: Date;
    
    switch (selectedDateRange) {
      case 'this-month':
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        comparisonStartDate = new Date(currentYear, currentMonth - 1, 1);
        comparisonEndDate = new Date(currentYear, currentMonth, 0);
        break;
        
      case 'last-month':
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth, 0);
        comparisonStartDate = new Date(currentYear, currentMonth - 2, 1);
        comparisonEndDate = new Date(currentYear, currentMonth - 1, 0);
        break;
        
      case 'this-quarter':
        const currentQuarter = Math.floor(currentMonth / 3);
        startDate = new Date(currentYear, currentQuarter * 3, 1);
        endDate = new Date(currentYear, (currentQuarter + 1) * 3, 0);
        comparisonStartDate = new Date(currentYear, (currentQuarter - 1) * 3, 1);
        comparisonEndDate = new Date(currentYear, currentQuarter * 3, 0);
        break;
        
      case 'last-quarter':
        const lastQuarter = Math.floor(currentMonth / 3) - 1;
        const lastQuarterYear = lastQuarter < 0 ? currentYear - 1 : currentYear;
        const normalizedLastQuarter = lastQuarter < 0 ? 3 + lastQuarter : lastQuarter;
        startDate = new Date(lastQuarterYear, normalizedLastQuarter * 3, 1);
        endDate = new Date(lastQuarterYear, (normalizedLastQuarter + 1) * 3, 0);
        comparisonStartDate = new Date(lastQuarterYear, (normalizedLastQuarter - 1) * 3, 1);
        comparisonEndDate = new Date(lastQuarterYear, normalizedLastQuarter * 3, 0);
        break;
        
      case 'this-year':
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
        comparisonStartDate = new Date(currentYear - 1, 0, 1);
        comparisonEndDate = new Date(currentYear - 1, 11, 31);
        break;
        
      default:
        // Default to this month
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        comparisonStartDate = new Date(currentYear, currentMonth - 1, 1);
        comparisonEndDate = new Date(currentYear, currentMonth, 0);
    }
    
    return {
      startDate,
      endDate,
      comparisonStartDate,
      comparisonEndDate
    };
  }, [selectedDateRange]);

  // Load financial data based on selected timeframe
  const loadFinancialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { startDate, endDate, comparisonStartDate, comparisonEndDate } = getDateRanges();
      
      // Get data for selected period
      const currentData = await calculateRevenue(startDate, endDate);
      setCurrentPeriodData(currentData);
      
      // Get data for comparison period
      const comparisonData = await calculateRevenue(comparisonStartDate, comparisonEndDate);
      setComparisonPeriodData(comparisonData);
      
      // Load monthly data for charts
      if (selectedTimeframe === 'monthly') {
        const today = new Date();
        const currentYear = today.getFullYear();
        const reports = await getMonthlyReports(currentYear);
        setRevenueData(reports);
      }
      
      // Get recent payments for the period
      const paymentsData = await getPaymentsByPeriod(startDate, endDate);
      setRecentPayments(paymentsData.slice(0, 5)); // Show only the first 5
      
      // Calculate subscription breakdown
      const basicCount = paymentsData.filter(p => 
        p.plan === 'basic' && p.status === 'completed').length;
        
      const premiumCount = paymentsData.filter(p => 
        p.plan === 'premium' && p.status === 'completed').length;
        
      const proCount = paymentsData.filter(p => 
        p.plan === 'pro' && p.status === 'completed').length;
        
      setSubscriptionBreakdown({
        basic: basicCount,
        premium: premiumCount,
        pro: proCount
      });
      
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedTimeframe, getDateRanges]);
  
  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData, selectedDateRange]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFinancialData();
  };
  
  // Function to format date ranges for display
  const formatDateRange = (startDate: Date, endDate: Date): string => {
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };
  
  // Calculate percentage change between periods
  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return 'N/A';
    
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };
  
  // Prepare data for the charts
  const chartData = React.useMemo(() => {
    if (selectedTimeframe === 'monthly' && revenueData.length > 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Revenue chart data
      const revenueChartData = {
        labels: months.slice(0, revenueData.length),
        datasets: [
          {
            data: revenueData.map(month => month.totalRevenue),
            color: () => Colors[colorScheme || 'light'].tint,
            strokeWidth: 2
          }
        ],
        legend: ['Revenue']
      };
      
      // Subscriptions chart data
      const subscriptionsChartData = {
        labels: months.slice(0, revenueData.length),
        datasets: [
          {
            data: revenueData.map(month => month.newSubscriptions),
            color: () => '#4CAF50',
            strokeWidth: 2
          }
        ],
        legend: ['New Subscriptions']
      };
      
      // Retention chart data (based on renewals vs cancellations)
      const retentionChartData = {
        labels: months.slice(0, revenueData.length),
        datasets: [
          {
            data: revenueData.map(month => {
              // Calculate retention rate: renewals / (renewals + cancellations)
              const total = month.renewals + month.cancellations;
              return total > 0 ? (month.renewals / total) * 100 : 0;
            }),
            color: () => '#FF9800',
            strokeWidth: 2
          }
        ],
        legend: ['Retention Rate %']
      };
      
      return {
        revenue: revenueChartData,
        subscriptions: subscriptionsChartData,
        retention: retentionChartData
      };
    }
    
    return null;
  }, [revenueData, selectedTimeframe, colorScheme]);
  
  // Subscription distribution data for pie chart
  const subscriptionPieData = React.useMemo(() => {
    const totalSubs = subscriptionBreakdown.basic + 
      subscriptionBreakdown.premium + 
      subscriptionBreakdown.pro;
      
    if (totalSubs === 0) {
      return [
        { name: 'No Data', population: 1, color: '#ccc', legendFontColor: '#7F7F7F', legendFontSize: 12 }
      ];
    }
    
    return [
      {
        name: 'Basic',
        population: subscriptionBreakdown.basic,
        color: '#FF9800',
        legendFontColor: Colors[colorScheme || 'light'].text,
        legendFontSize: 12
      },
      {
        name: 'Premium',
        population: subscriptionBreakdown.premium,
        color: '#2196F3',
        legendFontColor: Colors[colorScheme || 'light'].text,
        legendFontSize: 12
      },
      {
        name: 'Pro',
        population: subscriptionBreakdown.pro,
        color: '#4CAF50',
        legendFontColor: Colors[colorScheme || 'light'].text,
        legendFontSize: 12
      }
    ];
  }, [subscriptionBreakdown, colorScheme]);

  if (isLoading && !currentPeriodData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme || 'light'].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme || 'light'].tint} />
        <Text style={{ marginTop: 16, color: Colors[colorScheme || 'light'].text }}>
          Loading financial data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme || 'light'].background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Stack.Screen 
        options={{ 
          title: 'Financial Reports',
          headerRight: () => (
            <Menu
              visible={rangeMenuVisible}
              onDismiss={() => setRangeMenuVisible(false)}
              anchor={
                <Button 
                  onPress={() => setRangeMenuVisible(true)}
                  mode="text"
                  icon="calendar"
                >
                  {selectedDateRange === 'this-month' ? 'This Month' :
                   selectedDateRange === 'last-month' ? 'Last Month' :
                   selectedDateRange === 'this-quarter' ? 'This Quarter' :
                   selectedDateRange === 'last-quarter' ? 'Last Quarter' :
                   'This Year'}
                </Button>
              }
            >
              <Menu.Item 
                onPress={() => {
                  setSelectedDateRange('this-month');
                  setRangeMenuVisible(false);
                }} 
                title="This Month" 
              />
              <Menu.Item 
                onPress={() => {
                  setSelectedDateRange('last-month');
                  setRangeMenuVisible(false);
                }} 
                title="Last Month" 
              />
              <Menu.Item 
                onPress={() => {
                  setSelectedDateRange('this-quarter');
                  setRangeMenuVisible(false);
                }} 
                title="This Quarter" 
              />
              <Menu.Item 
                onPress={() => {
                  setSelectedDateRange('last-quarter');
                  setRangeMenuVisible(false);
                }} 
                title="Last Quarter" 
              />
              <Menu.Item 
                onPress={() => {
                  setSelectedDateRange('this-year');
                  setRangeMenuVisible(false);
                }} 
                title="This Year" 
              />
            </Menu>
          )
        }}
      />
      
      {/* Revenue Summary Card */}
      <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]}>Revenue Summary</Title>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
                Period
              </Text>
              <Text style={[styles.summaryValue, { color: Colors[colorScheme || 'light'].text }]}>
                {currentPeriodData && 
                  formatDateRange(currentPeriodData.startDate, currentPeriodData.endDate)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
                Total Revenue
              </Text>
              <Text style={[styles.summaryValue, styles.highlightValue]}>
                ${currentPeriodData?.totalRevenue.toFixed(2)}
              </Text>
              
              {comparisonPeriodData && (
                <View style={styles.changeIndicator}>
                  <Ionicons 
                    name={currentPeriodData!.totalRevenue >= comparisonPeriodData.totalRevenue ? 
                      "arrow-up-outline" : "arrow-down-outline"} 
                    size={14}
                    color={currentPeriodData!.totalRevenue >= comparisonPeriodData.totalRevenue ? 
                      "#4CAF50" : "#F44336"}
                  />
                  <Text style={{ 
                    color: currentPeriodData!.totalRevenue >= comparisonPeriodData.totalRevenue ? 
                      "#4CAF50" : "#F44336",
                    fontSize: 12,
                    marginLeft: 4,
                  }}>
                    {calculateChange(
                      currentPeriodData!.totalRevenue, 
                      comparisonPeriodData.totalRevenue
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
                New Subscriptions
              </Text>
              <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
                {currentPeriodData?.newSubscriptions || 0}
              </Text>
              {comparisonPeriodData && (
                <Text style={[styles.metricChange, { 
                  color: (currentPeriodData!.newSubscriptions >= comparisonPeriodData.newSubscriptions) ? 
                    "#4CAF50" : "#F44336" 
                }]}>
                  {calculateChange(
                    currentPeriodData!.newSubscriptions, 
                    comparisonPeriodData.newSubscriptions
                  )}
                </Text>
              )}
            </View>
            
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
                Renewals
              </Text>
              <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
                {currentPeriodData?.renewals || 0}
              </Text>
              {comparisonPeriodData && (
                <Text style={[styles.metricChange, { 
                  color: (currentPeriodData!.renewals >= comparisonPeriodData.renewals) ? 
                    "#4CAF50" : "#F44336" 
                }]}>
                  {calculateChange(
                    currentPeriodData!.renewals, 
                    comparisonPeriodData.renewals
                  )}
                </Text>
              )}
            </View>
            
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
                Cancellations
              </Text>
              <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
                {currentPeriodData?.cancellations || 0}
              </Text>
              {comparisonPeriodData && (
                <Text style={[styles.metricChange, { 
                  color: (currentPeriodData!.cancellations <= comparisonPeriodData.cancellations) ? 
                    "#4CAF50" : "#F44336" 
                }]}>
                  {calculateChange(
                    currentPeriodData!.cancellations, 
                    comparisonPeriodData.cancellations
                  )}
                </Text>
              )}
            </View>
            
            <View style={styles.metricCard}>
              <Text style={[styles.metricLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
                Net Growth
              </Text>
              <Text style={[styles.metricValue, { color: Colors[colorScheme || 'light'].text }]}>
                {currentPeriodData?.netGrowth || 0}
              </Text>
              {comparisonPeriodData && (
                <Text style={[styles.metricChange, { 
                  color: (currentPeriodData!.netGrowth >= comparisonPeriodData.netGrowth) ? 
                    "#4CAF50" : "#F44336" 
                }]}>
                  {calculateChange(
                    currentPeriodData!.netGrowth, 
                    comparisonPeriodData.netGrowth
                  )}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Chart Section */}
      <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Title style={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]}>
              {selectedMetric === 'revenue' ? 'Revenue Trends' : 
               selectedMetric === 'subscriptions' ? 'Subscription Trends' : 
               'Retention Rate Trends'}
            </Title>
            
            <SegmentedButtons
              value={selectedMetric}
              onValueChange={value => setSelectedMetric(value as ChartMetric)}
              buttons={[
                { value: 'revenue', label: 'Revenue' },
                { value: 'subscriptions', label: 'Subs' },
                { value: 'retention', label: 'Retention' }
              ]}
              style={styles.segmentButtons}
            />
          </View>
          
          {chartData && (
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData[selectedMetric]}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: Colors[colorScheme || 'light'].cardBackground,
                  backgroundGradientFrom: Colors[colorScheme || 'light'].cardBackground,
                  backgroundGradientTo: Colors[colorScheme || 'light'].cardBackground,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  labelColor: (opacity = 1) => 
                    `rgba(${colorScheme === 'dark' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: Colors[colorScheme || 'light'].tint
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}
          
          {!chartData && (
            <View style={styles.noDataContainer}>
              <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>
                No data available for the selected period.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
      
      {/* Subscription Breakdown */}
      <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Content>
          <Title style={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]}>
            Subscription Distribution
          </Title>
          
          <View style={styles.pieChartContainer}>
            <PieChart
              data={subscriptionPieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{
                backgroundColor: Colors[colorScheme || 'light'].cardBackground,
                backgroundGradientFrom: Colors[colorScheme || 'light'].cardBackground,
                backgroundGradientTo: Colors[colorScheme || 'light'].cardBackground,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => 
                  `rgba(${colorScheme === 'dark' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              center={[0, 0]}
              absolute
            />
          </View>
          
          <View style={styles.subscriptionStats}>
            <View style={styles.subscriptionStatItem}>
              <View style={[styles.statDot, { backgroundColor: '#FF9800' }]} />
              <Text style={[styles.statLabel, { color: Colors[colorScheme || 'light'].text }]}>Basic</Text>
              <Text style={[styles.statValue, { color: Colors[colorScheme || 'light'].text }]}>
                {subscriptionBreakdown.basic}
              </Text>
            </View>
            <View style={styles.subscriptionStatItem}>
              <View style={[styles.statDot, { backgroundColor: '#2196F3' }]} />
              <Text style={[styles.statLabel, { color: Colors[colorScheme || 'light'].text }]}>Premium</Text>
              <Text style={[styles.statValue, { color: Colors[colorScheme || 'light'].text }]}>
                {subscriptionBreakdown.premium}
              </Text>
            </View>
            <View style={styles.subscriptionStatItem}>
              <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.statLabel, { color: Colors[colorScheme || 'light'].text }]}>Pro</Text>
              <Text style={[styles.statValue, { color: Colors[colorScheme || 'light'].text }]}>
                {subscriptionBreakdown.pro}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Recent Payments */}
      <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Content>
          <View style={styles.recentPaymentsHeader}>
            <Title style={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]}>
              Recent Payments
            </Title>
            <Button 
              mode="text" 
              onPress={() => console.log('View all payments')}
              compact
            >
              View All
            </Button>
          </View>
          
          {recentPayments.length > 0 ? (
            <View style={styles.paymentsList}>
              {recentPayments.map((payment, index) => (
                <React.Fragment key={payment.id}>
                  <View style={styles.paymentItem}>
                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentUser, { color: Colors[colorScheme || 'light'].text }]}>
                        {payment.userId}
                      </Text>
                      <Text style={[styles.paymentDate, { color: Colors[colorScheme || 'light'].mutedText }]}>
                        {payment.createdAt instanceof Date 
                          ? payment.createdAt.toLocaleDateString() 
                          : new Date(payment.createdAt.seconds * 1000).toLocaleDateString()}
                      </Text>
                      {payment.plan && (
                        <Chip 
                          style={styles.planChip}
                          textStyle={{ fontSize: 10 }}
                          compact
                        >
                          {payment.plan}
                        </Chip>
                      )}
                    </View>
                    
                    <View>
                      <Text style={[styles.paymentAmount, {
                        color: payment.status === 'completed' ? '#4CAF50' : (
                          payment.status === 'failed' ? '#F44336' : Colors[colorScheme || 'light'].text
                        )
                      }]}>
                        ${payment.amount.toFixed(2)}
                      </Text>
                      <Text style={[styles.paymentStatus, {
                        color: payment.status === 'completed' ? '#4CAF50' : (
                          payment.status === 'failed' ? '#F44336' : '#FF9800'
                        )
                      }]}>
                        {payment.status}
                      </Text>
                    </View>
                  </View>
                  
                  {index < recentPayments.length - 1 && <Divider style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>
                No recent payments for this period.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
        >
          <Ionicons name="download-outline" size={24} color={Colors[colorScheme || 'light'].tint} />
          <Text style={[styles.actionButtonText, { color: Colors[colorScheme || 'light'].text }]}>
            Export Report
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
        >
          <Ionicons name="mail-outline" size={24} color={Colors[colorScheme || 'light'].tint} />
          <Text style={[styles.actionButtonText, { color: Colors[colorScheme || 'light'].text }]}>
            Email Report
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
        >
          <Ionicons name="settings-outline" size={24} color={Colors[colorScheme || 'light'].tint} />
          <Text style={[styles.actionButtonText, { color: Colors[colorScheme || 'light'].text }]}>
            Preferences
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  highlightValue: {
    color: '#2196F3',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
  },
  metricCard: {
    width: '48%', // Just under half to account for margins
    backgroundColor: 'rgba(0,0,0,0.03)', // Very slight background to distinguish
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: '1%',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricChange: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentButtons: {
    scale: 0.8,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  subscriptionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  subscriptionStatItem: {
    alignItems: 'center',
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentPaymentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentsList: {
    marginTop: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentUser: {
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  planChip: {
    marginTop: 4,
    height: 22,
    alignSelf: 'flex-start',
  },
  paymentAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'right',
  },
  paymentStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
    textAlign: 'right',
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  actionButton: {
    width: '31%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});