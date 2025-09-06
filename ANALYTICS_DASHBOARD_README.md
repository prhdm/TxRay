# Blockchain Analytics Dashboard

A comprehensive Grafana-style dashboard for Taiko Hekla blockchain analytics with real-time data visualization.

## 🚀 Features

- **Grafana-style Interface**: Professional dashboard with KPI cards, charts, and data tables
- **Real-time Analytics**: Live data from Supabase Edge Functions
- **Wallet Filtering**: Query analytics for single or multiple wallet addresses
- **Time Series Charts**: Transaction volume over time with success/failure breakdown
- **Pie Charts**: Transaction type distribution and method analysis
- **KPI Cards**: Key metrics including total transactions, gas usage, success rates
- **Data Tables**: Paginated transaction list with explorer links
- **Responsive Design**: Mobile-friendly dashboard layout

## 📊 Dashboard Components

### KPI Cards
- **Total Transactions**: All-time transaction count
- **Active Addresses**: Unique addresses on the network
- **Total Value**: ETH transferred across all transactions
- **Gas Fees**: Total gas fees paid
- **Success Rate**: Transaction success percentage
- **Avg Gas Used**: Average gas per transaction
- **Contract Deployments**: Number of deployed contracts
- **Latest Block**: Current block height

### Charts & Visualizations

#### Transaction Volume Chart
- Time series showing daily transaction counts
- Stacked area chart with success (green) and failed (red) transactions
- Hover tooltips with detailed statistics
- Responsive design with proper date formatting

#### Transaction Types Pie Chart
- Distribution of transaction methods
- Top 8 methods displayed with percentages
- Color-coded segments with legend
- Method signature analysis from transaction input

### Wallet Filtering
- Add multiple wallet addresses for filtered analytics
- Enable/disable filtering with toggle
- Visual wallet address badges with remove functionality
- Real-time filter application

### Transaction Table
- Paginated transaction list (100 per page)
- Keyset pagination for efficient large dataset handling
- Block number, addresses, value, method, status
- Explorer links for each transaction
- Real-time timestamp formatting
- Load more functionality

## 🔧 Technical Implementation

### Architecture
```
Frontend (Next.js + TypeScript)
├── AnalyticsContext - State management
├── AnalyticsDashboard - Main dashboard component
├── KPICard - KPI metric cards
├── TransactionChart - Time series visualization
├── TransactionPieChart - Distribution charts
├── WalletFilter - Address filtering UI
└── TransactionTable - Data table with pagination
```

### Data Flow
1. **AnalyticsContext** fetches data from Supabase Edge Functions
2. **Real-time Updates** via context state management
3. **Component Rendering** with proper loading/error states
4. **User Interactions** trigger data refetch and filtering

### API Integration
- **Analytics Summary**: `/functions/v1/analytics/summary`
- **Daily Statistics**: `/functions/v1/analytics/daily`
- **Transaction List**: `/functions/v1/analytics/txs`

## 🎨 UI/UX Features

### Professional Design
- Clean, modern interface inspired by Grafana
- Consistent color scheme and typography
- Proper spacing and visual hierarchy
- Loading states and error handling
- Responsive grid layouts

### Interactive Elements
- Hover effects on charts and cards
- Clickable transaction links to explorer
- Expandable data tables
- Real-time refresh functionality
- Wallet address input with validation

### Data Visualization
- Recharts library for professional charts
- Custom tooltips and legends
- Color-coded status indicators
- Formatted numbers and dates
- Progressive data loading

## 🔍 Analytics Capabilities

### Wallet-Specific Analysis
- Filter by single wallet address
- Multi-wallet analysis support
- Address validation and formatting
- Real-time filter application

### Time-Based Insights
- Daily transaction trends
- Success/failure rate analysis
- Gas usage patterns
- Contract interaction metrics

### Network Health Metrics
- Transaction throughput
- Network utilization
- Success rates
- Active address tracking

## 📱 Mobile Responsiveness

- Responsive grid layouts
- Collapsible sidebars (when needed)
- Touch-friendly interactions
- Optimized chart rendering
- Readable typography on small screens

## 🔄 Real-time Updates

- Manual refresh button
- Automatic error recovery
- Loading state indicators
- Progressive data loading
- Background refresh capabilities

## 🎯 Key Metrics Tracked

### Transaction Metrics
- Total transaction count
- Success/failure rates
- Average gas usage
- Transaction value distribution

### Network Metrics
- Active addresses (24h, 7d)
- Block production rate
- Gas fee trends
- Contract deployment frequency

### Performance Metrics
- API response times
- Data freshness indicators
- Cache hit rates
- Error rates

## 🚀 Getting Started

1. **Deploy Analytics Pipeline**:
   ```bash
   ./scripts/deploy-analytics.sh
   ```

2. **Set Environment Variables**:
   ```bash
   HEKLA_RPC=https://rpc.hekla.taiko.xyz
   CONTRACTS=["0x..."]
   EVENT_SIGS=["0xddf252ad..."]
   ```

3. **Access Dashboard**:
   ```
   Navigate to /analytics in your app
   ```

4. **Configure Scheduler**:
   ```
   Supabase Dashboard → Edge Functions → Cron
   Function: indexer-run
   Schedule: */2 * * * *
   ```

## 📈 Advanced Features

### Custom Date Ranges
- Date picker for custom time periods
- Historical data analysis
- Trend analysis and forecasting

### Export Capabilities
- CSV export of transaction data
- Chart image downloads
- PDF report generation

### Alert System
- Threshold-based notifications
- Anomaly detection
- Performance monitoring alerts

This analytics dashboard provides comprehensive blockchain insights with a professional, Grafana-style interface that scales from single wallet analysis to network-wide monitoring! 📊🎯


