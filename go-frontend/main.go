package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
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

// FraudResult represents fraud detection result
type FraudResult struct {
	TransactionID    string             `json:"transaction_id"`
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
	spinner spinner.Model

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
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
		case "r":
			return m, fetchStats(m.pythonAPI)
		}

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.ready = true

	case tickMsg:
		return m, tick()

	case transactionMsg:
		m.transactions = append(m.transactions, Transaction(msg))
		if len(m.transactions) > 100 {
			m.transactions = m.transactions[1:]
		}
		m.totalReceived++

		// Update transaction counts by hour
		hour := msg.Timestamp.Format("15:00")
		m.transactionCounts[hour]++

		return m, sendToFraudDetection(m.pythonAPI, Transaction(msg))

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

	// Header
	header := titleStyle.Render("🛡️  AI-Powered Fraud Detection Dashboard")
	status := statusStyle.Render(fmt.Sprintf(
		"Last Update: %s | Total Received: %d | Model: %s",
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

	chartsRow2 := lipgloss.JoinHorizontal(lipgloss.Top, fraudChart, " ", recentTxns)

	// Error message
	errorMsg := ""
	if m.errorMessage != "" {
		errorMsg = "\n" + errorStyle.Render("⚠ "+m.errorMessage)
	}

	// Help
	help := statusStyle.Render("Press 'r' to refresh | 'q' to quit")

	// Combine all sections
	content := lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		status,
		"",
		statsBoxes,
		"",
		chartsRow1,
		"",
		chartsRow2,
		errorMsg,
		"",
		help,
	)

	return content
}

func (m model) renderRecentTransactions() string {
	if len(m.fraudResults) == 0 {
		return chartStyle.Render("Recent Transactions\n\nNo transactions yet")
	}

	var lines []string
	lines = append(lines, chartTitleStyle.Render("Recent High-Risk Transactions"))
	lines = append(lines, "")

	headerStyle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("245"))
	lines = append(lines, headerStyle.Render(
		fmt.Sprintf("%-12s %-20s %-10s %-12s",
			"Time", "Transaction ID", "Risk", "Status"),
	))
	lines = append(lines, strings.Repeat("─", 60))

	// Show last 10 high-risk transactions
	count := 0
	for i := len(m.fraudResults) - 1; i >= 0 && count < 10; i-- {
		result := m.fraudResults[i]

		if result.FraudProbability < 0.5 {
			continue
		}

		timeStr := result.Timestamp.Format("15:04:05")
		txnID := result.TransactionID
		if len(txnID) > 18 {
			txnID = txnID[:18] + "..."
		}

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

		line := fmt.Sprintf("%-12s %-20s %-10s %s",
			timeStr,
			txnID,
			riskStr,
			statusStyle.Render(statusStr),
		)

		lines = append(lines, line)
		count++
	}

	if count == 0 {
		lines = append(lines, statusStyle.Render("No high-risk transactions"))
	}

	return chartStyle.Render(strings.Join(lines, "\n"))
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

		ch := pubsub.Channel()

		for msg := range ch {
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
