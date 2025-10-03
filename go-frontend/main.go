package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
)

var (
	ctx = context.Background()

	// Styles
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("86")).
			Background(lipgloss.Color("235")).
			Padding(0, 1).
			MarginBottom(1)

	statusStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("241")).
			Italic(true)

	errorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("196")).
			Bold(true)

	successStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("82")).
			Bold(true)
)

// Transaction represents a transaction
type Transaction struct {
	TransactionID string                 `json:"transaction_id"`
	UserID        string                 `json:"user_id"`
	Amount        float64                `json:"amount"`
	Timestamp     time.Time              `json:"timestamp"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// FraudResult represents fraud detection result with transaction data
type FraudResult struct {
	TransactionID    string             `json:"transaction_id"`
	UserID           string             `json:"user_id"`
	Amount           float64            `json:"amount"`
	TransactionType  string             `json:"transaction_type"`
	MerchantID       string             `json:"merchant_id"`
	FraudProbability float64            `json:"fraud_probability"`
	RiskLevel        string             `json:"risk_level"`
	IsFraud          bool               `json:"is_fraud"`
	Features         map[string]float64 `json:"features"`
	ModelUsed        string             `json:"model_used"`
	Timestamp        time.Time          `json:"timestamp"`
}

// Stats represents system statistics
type Stats struct {
	TotalTransactions int     `json:"total_transactions"`
	FraudDetected     int     `json:"fraud_detected"`
	FraudRate         float64 `json:"fraud_rate"`
	AvgRiskScore      float64 `json:"avg_risk_score"`
	ModelType         string  `json:"model_type"`
	UptimeSeconds     float64 `json:"uptime_seconds"`
}

// Model represents the application state
type model struct {
	// State
	width  int
	height int
	ready  bool

	// Data
	transactions      []Transaction
	fraudResults      []FraudResult
	stats             Stats
	recentRiskScores  []float64
	transactionCounts map[string]float64
	fraudCounts       map[string]float64

	// Components
	spinner      spinner.Model
	searchInput  string
	searchActive bool

	// Connections
	redisClient *redis.Client
	pythonAPI   string
	mockAPI     string

	// Status
	lastUpdate    time.Time
	errorMessage  string
	totalReceived int
}

// Message types
type tickMsg time.Time
type transactionMsg Transaction
type fraudResultMsg FraudResult
type statsMsg Stats
type errorMsg string

func initialModel() model {
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("205"))

	return model{
		spinner:           s,
		transactions:      []Transaction{},
		fraudResults:      []FraudResult{},
		recentRiskScores:  []float64{},
		transactionCounts: make(map[string]float64),
		fraudCounts:       make(map[string]float64),
		pythonAPI:         os.Getenv("PYTHON_API_URL"),
		mockAPI:           os.Getenv("MOCK_API_URL"),
		lastUpdate:        time.Now(),
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		m.spinner.Tick,
		tick(),
		listenRedis(m.redisClient),
		fetchStats(m.pythonAPI),
	)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		if m.searchActive {
			// Handle search input
			switch msg.String() {
			case "enter", "esc":
				m.searchActive = false
			case "backspace":
				if len(m.searchInput) > 0 {
					m.searchInput = m.searchInput[:len(m.searchInput)-1]
				}
			default:
				if len(msg.String()) == 1 {
					m.searchInput += msg.String()
				}
			}
			return m, nil
		}
		
		// Normal key handling
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
		case "r":
			return m, fetchStats(m.pythonAPI)
		case "/":
			m.searchActive = true
			m.searchInput = ""
			return m, nil
		case "c":
			m.searchInput = ""
			return m, nil
		}

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.ready = true

	case tickMsg:
		// Refresh stats every second
		return m, tea.Batch(tick(), fetchStats(m.pythonAPI))

	case transactionMsg:
		m.transactions = append(m.transactions, Transaction(msg))
		if len(m.transactions) > 100 {
			m.transactions = m.transactions[1:]
		}
		m.totalReceived++

		// Update transaction counts by hour
		hour := msg.Timestamp.Format("15:00")
		m.transactionCounts[hour]++

		// Continue listening for more messages
		return m, listenRedis(m.redisClient)

	case fraudResultMsg:
		m.fraudResults = append(m.fraudResults, FraudResult(msg))
		if len(m.fraudResults) > 100 {
			m.fraudResults = m.fraudResults[1:]
		}

		m.recentRiskScores = append(m.recentRiskScores, msg.FraudProbability)
		if len(m.recentRiskScores) > 50 {
			m.recentRiskScores = m.recentRiskScores[1:]
		}

		if msg.IsFraud {
			hour := msg.Timestamp.Format("15:00")
			m.fraudCounts[hour]++
		}

		m.lastUpdate = time.Now()

		// Continue listening for more messages
		return m, listenRedis(m.redisClient)

	case statsMsg:
		m.stats = Stats(msg)

	case errorMsg:
		m.errorMessage = string(msg)

	case spinner.TickMsg:
		var cmd tea.Cmd
		m.spinner, cmd = m.spinner.Update(msg)
		return m, cmd
	}

	return m, nil
}

func (m model) View() string {
	if !m.ready {
		return "\n  Initializing..."
	}

	// ASCII Art Header
	asciiArt := lipgloss.NewStyle().
		Foreground(lipgloss.Color("86")).
		Bold(true).
		Render(`
  ███████╗██████╗ ███████╗██████╗ 
  ██╔════╝██╔══██╗██╔════╝██╔══██╗
  █████╗  ██████╔╝█████╗  ██║  ██║
  ██╔══╝  ██╔══██╗██╔══╝  ██║  ██║
  ██║     ██║  ██║███████╗██████╔╝
  ╚═╝     ╚═╝  ╚═╝╚══════╝╚═════╝ 
  Fraud Recognition & Enforcement Dashboard
`)
	
	status := statusStyle.Render(fmt.Sprintf(
		"Last Update: %s | Total: %d | Model: %s | Press '/' to search, 'c' to clear, 'q' to quit",
		m.lastUpdate.Format("15:04:05"),
		m.totalReceived,
		m.stats.ModelType,
	))

	// Stats boxes
	statsBoxes := lipgloss.JoinHorizontal(
		lipgloss.Top,
		StatsBox(
			"Total Transactions",
			fmt.Sprintf("%d", m.stats.TotalTransactions),
			fmt.Sprintf("%d received", m.totalReceived),
			"86",
		),
		" ",
		StatsBox(
			"Fraud Detected",
			fmt.Sprintf("%d", m.stats.FraudDetected),
			fmt.Sprintf("%.1f%% fraud rate", m.stats.FraudRate),
			"208",
		),
		" ",
		StatsBox(
			"Avg Risk Score",
			fmt.Sprintf("%.1f%%", m.stats.AvgRiskScore*100),
			RiskLevelGauge(m.stats.AvgRiskScore),
			"214",
		),
		" ",
		StatsBox(
			"Uptime",
			fmt.Sprintf("%.0fs", m.stats.UptimeSeconds),
			m.spinner.View()+" Processing",
			"245",
		),
	)

	// Charts
	chartWidth := m.width / 2

	// Risk score trend
	riskChart := ""
	if len(m.recentRiskScores) > 0 {
		riskChart = LineChart(
			"Risk Score Trend (Last 50 Transactions)",
			m.recentRiskScores,
			chartWidth,
			12,
			"214",
		)
	}

	// Transaction volume
	txnChart := ""
	if len(m.transactionCounts) > 0 {
		txnChart = BarChart(
			"Transaction Volume by Hour",
			m.transactionCounts,
			chartWidth,
			"86",
		)
	}

	chartsRow1 := lipgloss.JoinHorizontal(lipgloss.Top, riskChart, " ", txnChart)

	// Fraud distribution
	fraudChart := ""
	if len(m.fraudCounts) > 0 {
		fraudChart = BarChart(
			"Fraud Detections by Hour",
			m.fraudCounts,
			chartWidth,
			"196",
		)
	}

	// Recent transactions table
	recentTxns := m.renderRecentTransactions()

	// AI Insights for critical transactions
	aiInsights := m.renderAIInsights()

	// Transaction search and table
	searchBox := m.renderSearchBox()
	transactionTable := m.renderTransactionTable()

	chartsRow2 := lipgloss.JoinHorizontal(lipgloss.Top, fraudChart, " ", recentTxns)
	
	// Add AI insights row if there are critical transactions
	aiRow := ""
	if aiInsights != "" {
		aiRow = "\n" + aiInsights + "\n"
	}

	// Error message
	errorMsg := ""
	if m.errorMessage != "" {
		errorMsg = "\n" + errorStyle.Render("⚠ "+m.errorMessage)
	}

	// Help
	help := statusStyle.Render("Press '/' to search | 'c' to clear search | 'r' to refresh | 'q' to quit")

	// Combine all sections
	content := lipgloss.JoinVertical(
		lipgloss.Left,
		asciiArt,
		status,
		"",
		statsBoxes,
		"",
		chartsRow1,
		"",
		chartsRow2,
		"",
		searchBox,
		transactionTable,
		aiRow,
		errorMsg,
		"",
		help,
	)

	return content
}

func (m model) renderRecentTransactions() string {
	// Show ALL recent transactions, not just high-risk
	if len(m.fraudResults) == 0 {
		return chartStyle.Render("Recent Transactions\n\nNo fraud results yet. Waiting for transactions...")
	}

	var lines []string
	lines = append(lines, chartTitleStyle.Render("📋 Recent Transactions (Last 15)"))
	lines = append(lines, "")

	headerStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("245"))
	lines = append(lines, headerStyle.Render(
		fmt.Sprintf("%-10s %-18s %-12s %-10s %-15s",
			"Time", "Transaction ID", "Amount", "Risk", "Status"),
	))
	lines = append(lines, strings.Repeat("─", 75))

	// Show last 15 transactions (ALL, not just high-risk)
	start := 0
	if len(m.fraudResults) > 15 {
		start = len(m.fraudResults) - 15
	}

	for i := len(m.fraudResults) - 1; i >= start; i-- {
		result := m.fraudResults[i]

		timeStr := result.Timestamp.Format("15:04:05")
		txnID := result.TransactionID
		if len(txnID) > 16 {
			txnID = txnID[:16] + ".."
		}

		// Use direct Amount field
		amountStr := fmt.Sprintf("$%.0f", result.Amount)

		riskStr := fmt.Sprintf("%.1f%%", result.FraudProbability*100)

		var statusStyle lipgloss.Style
		statusStr := result.RiskLevel

		switch result.RiskLevel {
		case "critical":
			statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
			statusStr = "🚨 CRITICAL"
		case "high":
			statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("208")).Bold(true)
			statusStr = "⚠️  HIGH"
		case "medium":
			statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("226"))
			statusStr = "⚡ MEDIUM"
		default:
			statusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("82"))
			statusStr = "✓  LOW"
		}

		line := fmt.Sprintf("%-10s %-18s %-12s %-10s %s",
			timeStr,
			txnID,
			amountStr,
			riskStr,
			statusStyle.Render(statusStr),
		)

		lines = append(lines, line)
	}

	// Add summary at bottom
	highRiskCount := 0
	for _, r := range m.fraudResults {
		if r.FraudProbability >= 0.7 {
			highRiskCount++
		}
	}
	
	if highRiskCount > 0 {
		lines = append(lines, "")
		alertStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
		lines = append(lines, alertStyle.Render(fmt.Sprintf("⚠️  %d high-risk transactions detected!", highRiskCount)))
	}

	return chartStyle.Render(strings.Join(lines, "\n"))
}

func (m model) renderAIInsights() string {
	// Find the most critical transaction
	var criticalResult *FraudResult
	maxScore := 0.0
	
	for i := range m.fraudResults {
		if m.fraudResults[i].FraudProbability > maxScore && m.fraudResults[i].FraudProbability >= 0.7 {
			maxScore = m.fraudResults[i].FraudProbability
			criticalResult = &m.fraudResults[i]
		}
	}
	
	if criticalResult == nil {
		return ""
	}
	
	var lines []string
	lines = append(lines, chartTitleStyle.Render("🤖 AI Fraud Analysis - Most Critical Transaction"))
	lines = append(lines, "")
	
	// Transaction details
	detailStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("245"))
	lines = append(lines, detailStyle.Render(fmt.Sprintf("Transaction ID: %s", criticalResult.TransactionID[:16]+"...")))
	lines = append(lines, detailStyle.Render(fmt.Sprintf("Risk Score: %.1f%% (%s)", criticalResult.FraudProbability*100, strings.ToUpper(criticalResult.RiskLevel))))
	lines = append(lines, detailStyle.Render(fmt.Sprintf("Amount: $%.2f", criticalResult.Features["amount"])))
	lines = append(lines, "")
	
	// Top risk factors
	boldStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("208"))
	lines = append(lines, boldStyle.Render("🔍 Key Risk Indicators:"))
	
	// Get top 5 features
	type featurePair struct {
		name  string
		value float64
	}
	var features []featurePair
	for k, v := range criticalResult.Features {
		features = append(features, featurePair{k, v})
	}
	
	// Simple display of key features
	if len(features) > 0 {
		lines = append(lines, fmt.Sprintf("  • Amount: $%.2f", criticalResult.Features["amount"]))
		if val, ok := criticalResult.Features["hour_of_day"]; ok {
			lines = append(lines, fmt.Sprintf("  • Hour of day: %.0f:00", val))
		}
		if val, ok := criticalResult.Features["txns_last_hour"]; ok {
			lines = append(lines, fmt.Sprintf("  • Transactions last hour: %.0f", val))
		}
		if val, ok := criticalResult.Features["amount_vs_avg"]; ok {
			lines = append(lines, fmt.Sprintf("  • Amount vs average: %.2fx", val))
		}
	}
	
	lines = append(lines, "")
	
	// AI Reasoning (rule-based since we don't have HF key)
	lines = append(lines, boldStyle.Render("💡 Analysis:"))
	explanation := m.generateExplanation(criticalResult)
	lines = append(lines, "  "+explanation)
	
	return chartStyle.Render(strings.Join(lines, "\n"))
}

func (m model) generateExplanation(result *FraudResult) string {
	switch result.RiskLevel {
	case "critical":
		return "CRITICAL FRAUD ALERT: This transaction shows multiple high-risk patterns.\n  Immediate investigation and account review recommended."
	case "high":
		return "HIGH RISK: Transaction exhibits suspicious characteristics.\n  Manual review suggested before approval."
	case "medium":
		return "MEDIUM RISK: Some unusual patterns detected.\n  Monitor for additional suspicious activity."
	default:
		return "LOW RISK: Transaction appears normal.\n  No immediate action required."
	}
}

// Commands
func tick() tea.Cmd {
	return tea.Tick(time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func listenRedis(client *redis.Client) tea.Cmd {
	return func() tea.Msg {
		if client == nil {
			return errorMsg("Redis client not initialized")
		}

		// Subscribe to channels
		pubsub := client.Subscribe(ctx, "transactions", "fraud_results")
		defer pubsub.Close()

		// Wait for subscription confirmation
		_, err := pubsub.Receive(ctx)
		if err != nil {
			return errorMsg("Failed to subscribe to Redis: " + err.Error())
		}

		ch := pubsub.Channel()

		// Listen for ONE message and return, the Update will call listenRedis again
		select {
		case msg := <-ch:
			if msg == nil {
				return errorMsg("Redis channel closed")
			}
			switch msg.Channel {
			case "transactions":
				var txn Transaction
				if err := json.Unmarshal([]byte(msg.Payload), &txn); err == nil {
					return transactionMsg(txn)
				}
			case "fraud_results":
				var result FraudResult
				if err := json.Unmarshal([]byte(msg.Payload), &result); err == nil {
					return fraudResultMsg(result)
				}
			}
		case <-ctx.Done():
			return nil
		}

		return nil
	}
}

func fetchStats(apiURL string) tea.Cmd {
	return func() tea.Msg {
		if apiURL == "" {
			apiURL = "http://localhost:8000"
		}

		resp, err := http.Get(apiURL + "/stats")
		if err != nil {
			return errorMsg("Failed to fetch stats: " + err.Error())
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return errorMsg("Failed to read stats: " + err.Error())
		}

		var stats Stats
		if err := json.Unmarshal(body, &stats); err != nil {
			return errorMsg("Failed to parse stats: " + err.Error())
		}

		return statsMsg(stats)
	}
}

func sendToFraudDetection(apiURL string, txn Transaction) tea.Cmd {
	return func() tea.Msg {
		if apiURL == "" {
			apiURL = "http://localhost:8000"
		}

		// Send transaction to fraud detection API
		data, _ := json.Marshal(txn)
		resp, err := http.Post(
			apiURL+"/predict",
			"application/json",
			strings.NewReader(string(data)),
		)
		if err != nil {
			return errorMsg("Failed to send transaction: " + err.Error())
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return errorMsg("Failed to read response: " + err.Error())
		}

		var result FraudResult
		if err := json.Unmarshal(body, &result); err != nil {
			return errorMsg("Failed to parse result: " + err.Error())
		}

		return fraudResultMsg(result)
	}
}

func (m model) renderSearchBox() string {
	if m.searchActive {
		searchStyle := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("86")).
			Padding(0, 1)
		
		return searchStyle.Render(fmt.Sprintf("🔍 Search Transaction ID: %s_", m.searchInput))
	}
	
	if m.searchInput != "" {
		searchStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("214"))
		return searchStyle.Render(fmt.Sprintf("🔍 Filtering by: %s (Press 'c' to clear)", m.searchInput))
	}
	
	return ""
}

func (m model) renderTransactionTable() string {
	// Combine transactions and fraud results
	totalItems := len(m.transactions) + len(m.fraudResults)
	if totalItems == 0 {
		return chartStyle.Render("📊 All Transactions\n\nNo transactions yet. Waiting for data...")
	}

	var lines []string
	title := "📊 All Transactions"
	if m.searchInput != "" {
		title = fmt.Sprintf("📊 Search Results for: %s", m.searchInput)
	}
	lines = append(lines, chartTitleStyle.Render(title))
	lines = append(lines, "")

	headerStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("245"))
	lines = append(lines, headerStyle.Render(
		fmt.Sprintf("%-20s %-10s %-12s %-10s %-15s %-12s",
			"Transaction ID", "Time", "Amount", "Risk %", "Fraud Status", "Risk Level"),
	))
	lines = append(lines, strings.Repeat("─", 95))

	// Create combined list with all data
	type TableRow struct {
		TransactionID    string
		Timestamp        time.Time
		Amount           float64
		FraudProbability float64
		RiskLevel        string
		IsFraud          bool
		HasResult        bool
	}

	var rows []TableRow
	
	// Add fraud results (these have complete data)
	for _, result := range m.fraudResults {
		rows = append(rows, TableRow{
			TransactionID:    result.TransactionID,
			Timestamp:        result.Timestamp,
			Amount:           result.Amount, // Use direct Amount field
			FraudProbability: result.FraudProbability,
			RiskLevel:        result.RiskLevel,
			IsFraud:          result.IsFraud,
			HasResult:        true,
		})
	}

	// Sort by timestamp (most recent first)
	sort.Slice(rows, func(i, j int) bool {
		return rows[i].Timestamp.After(rows[j].Timestamp)
	})

	// Filter by search if active
	filteredRows := rows
	if m.searchInput != "" {
		filteredRows = []TableRow{}
		for _, row := range rows {
			if strings.Contains(strings.ToLower(row.TransactionID), strings.ToLower(m.searchInput)) {
				filteredRows = append(filteredRows, row)
			}
		}
	}

	// Show transactions (most recent first)
	displayCount := 25
	if len(filteredRows) > displayCount {
		filteredRows = filteredRows[:displayCount]
	}

	for _, row := range filteredRows {
		timeStr := row.Timestamp.Format("15:04:05")
		txnID := row.TransactionID
		if len(txnID) > 18 {
			txnID = txnID[:18] + ".."
		}

		amountStr := fmt.Sprintf("$%.0f", row.Amount)
		riskStr := fmt.Sprintf("%.1f%%", row.FraudProbability*100)

		// Fraud Status Column
		var fraudStatusStyle lipgloss.Style
		fraudStatus := ""
		if row.IsFraud {
			fraudStatusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
			fraudStatus = "🚨 FRAUD"
		} else if row.FraudProbability >= 0.6 {
			fraudStatusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("208"))
			fraudStatus = "⚠️  SUSPICIOUS"
		} else if row.FraudProbability >= 0.3 {
			fraudStatusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("226"))
			fraudStatus = "⚡ CAUTION"
		} else {
			fraudStatusStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("82"))
			fraudStatus = "✓  LEGITIMATE"
		}

		// Risk Level Column
		var riskLevelStyle lipgloss.Style
		riskLevelStr := ""
		switch row.RiskLevel {
		case "critical":
			riskLevelStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
			riskLevelStr = "CRITICAL"
		case "high":
			riskLevelStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("208"))
			riskLevelStr = "HIGH"
		case "medium":
			riskLevelStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("226"))
			riskLevelStr = "MEDIUM"
		default:
			riskLevelStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("82"))
			riskLevelStr = "LOW"
		}

		line := fmt.Sprintf("%-20s %-10s %-12s %-10s %-15s %s",
			txnID,
			timeStr,
			amountStr,
			riskStr,
			fraudStatusStyle.Render(fraudStatus),
			riskLevelStyle.Render(riskLevelStr),
		)

		lines = append(lines, line)
	}

	if len(filteredRows) == 0 && m.searchInput != "" {
		lines = append(lines, "")
		lines = append(lines, lipgloss.NewStyle().Foreground(lipgloss.Color("208")).Render("  No transactions found matching: "+m.searchInput))
	}

	lines = append(lines, "")
	
	// Count fraud statistics
	totalShown := len(filteredRows)
	fraudCount := 0
	suspiciousCount := 0
	for _, row := range filteredRows {
		if row.IsFraud {
			fraudCount++
		} else if row.FraudProbability >= 0.6 {
			suspiciousCount++
		}
	}
	
	statsLine := fmt.Sprintf("  Showing %d transactions | 🚨 %d Fraud | ⚠️  %d Suspicious | Total Processed: %d",
		totalShown, fraudCount, suspiciousCount, len(m.fraudResults))
	lines = append(lines, lipgloss.NewStyle().Foreground(lipgloss.Color("245")).Render(statsLine))

	return chartStyle.Render(strings.Join(lines, "\n"))
}

func main() {
	// Load environment variables
	godotenv.Load("../.env")

	// Initialize Redis client
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}

	redisClient := redis.NewClient(opt)
	defer redisClient.Close()

	// Test connection
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("Warning: Redis not available: %v", err)
	}

	// Initialize model
	m := initialModel()
	m.redisClient = redisClient

	// Start program
	p := tea.NewProgram(m, tea.WithAltScreen())

	if _, err := p.Run(); err != nil {
		log.Fatal(err)
	}
}
