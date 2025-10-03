package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// Chart styles
var (
	chartStyle = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("62")).
		Padding(1, 2)
	
	chartTitleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("86")).
		Align(lipgloss.Center)
)

// BarChart creates a horizontal bar chart
func BarChart(title string, data map[string]float64, width int, color string) string {
	if len(data) == 0 {
		return chartStyle.Render(chartTitleStyle.Render(title) + "\n\nNo data")
	}
	
	maxVal := 0.0
	for _, v := range data {
		if v > maxVal {
			maxVal = v
		}
	}
	
	if maxVal == 0 {
		maxVal = 1
	}
	
	barColor := lipgloss.Color(color)
	labelStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("250"))
	valueStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("214")).Bold(true)
	
	var lines []string
	lines = append(lines, chartTitleStyle.Render(title))
	lines = append(lines, "")
	
	maxBarWidth := width - 40
	
	// Sort labels (hours) chronologically
	var labels []string
	for label := range data {
		labels = append(labels, label)
	}
	// Simple sort - will work for HH:MM format
	for i := 0; i < len(labels); i++ {
		for j := i + 1; j < len(labels); j++ {
			if labels[i] > labels[j] {
				labels[i], labels[j] = labels[j], labels[i]
			}
		}
	}
	
	for _, label := range labels {
		value := data[label]
		barWidth := int((value / maxVal) * float64(maxBarWidth))
		if barWidth < 1 && value > 0 {
			barWidth = 1
		}
		
		bar := strings.Repeat("█", barWidth)
		barStyled := lipgloss.NewStyle().Foreground(barColor).Render(bar)
		
		line := fmt.Sprintf("%s %s %s",
			labelStyle.Render(fmt.Sprintf("%-20s", label)),
			barStyled,
			valueStyle.Render(fmt.Sprintf("%.0f", value)),
		)
		lines = append(lines, line)
	}
	
	return chartStyle.Render(strings.Join(lines, "\n"))
}

// LineChart creates a simple ASCII line chart
func LineChart(title string, data []float64, width int, height int, color string) string {
	if len(data) == 0 {
		return chartStyle.Render(chartTitleStyle.Render(title) + "\n\nNo data")
	}
	
	// Find min and max
	minVal, maxVal := data[0], data[0]
	for _, v := range data {
		if v < minVal {
			minVal = v
		}
		if v > maxVal {
			maxVal = v
		}
	}
	
	if maxVal == minVal {
		maxVal = minVal + 1
	}
	
	// Create chart grid
	chartWidth := width - 20
	chartHeight := height - 4
	
	grid := make([][]rune, chartHeight)
	for i := range grid {
		grid[i] = make([]rune, chartWidth)
		for j := range grid[i] {
			grid[i][j] = ' '
		}
	}
	
	// Plot data points
	pointsPerColumn := float64(len(data)) / float64(chartWidth)
	
	for x := 0; x < chartWidth && x < len(data); x++ {
		idx := int(float64(x) * pointsPerColumn)
		if idx >= len(data) {
			idx = len(data) - 1
		}
		
		val := data[idx]
		normalizedVal := (val - minVal) / (maxVal - minVal)
		y := chartHeight - 1 - int(normalizedVal*float64(chartHeight-1))
		
		if y >= 0 && y < chartHeight {
			grid[y][x] = '●'
		}
	}
	
	// Render grid
	pointColor := lipgloss.Color(color)
	var lines []string
	lines = append(lines, chartTitleStyle.Render(title))
	lines = append(lines, "")
	
	// Add max value label
	lines = append(lines, lipgloss.NewStyle().
		Foreground(lipgloss.Color("250")).
		Render(fmt.Sprintf("%.1f ┤", maxVal)))
	
	for i, row := range grid {
		line := ""
		for _, ch := range row {
			if ch == '●' {
				line += lipgloss.NewStyle().Foreground(pointColor).Render("●")
			} else {
				line += " "
			}
		}
		
		// Add y-axis
		if i == chartHeight/2 {
			midVal := (maxVal + minVal) / 2
			line = lipgloss.NewStyle().
				Foreground(lipgloss.Color("250")).
				Render(fmt.Sprintf("%.1f ┤", midVal)) + line
		} else {
			line = "      │" + line
		}
		
		lines = append(lines, line)
	}
	
	// Add min value label
	lines = append(lines, lipgloss.NewStyle().
		Foreground(lipgloss.Color("250")).
		Render(fmt.Sprintf("%.1f └", minVal)) + strings.Repeat("─", chartWidth))
	
	return chartStyle.Render(strings.Join(lines, "\n"))
}

// SparkLine creates a simple sparkline
func SparkLine(data []float64) string {
	if len(data) == 0 {
		return "─"
	}
	
	minVal, maxVal := data[0], data[0]
	for _, v := range data {
		if v < minVal {
			minVal = v
		}
		if v > maxVal {
			maxVal = v
		}
	}
	
	if maxVal == minVal {
		return strings.Repeat("▄", len(data))
	}
	
	chars := []rune{'▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'}
	var result strings.Builder
	
	for _, v := range data {
		normalized := (v - minVal) / (maxVal - minVal)
		idx := int(normalized * float64(len(chars)-1))
		if idx < 0 {
			idx = 0
		}
		if idx >= len(chars) {
			idx = len(chars) - 1
		}
		result.WriteRune(chars[idx])
	}
	
	return result.String()
}

// GaugeChart creates a gauge/progress bar
func GaugeChart(title string, value float64, max float64, width int) string {
	if max == 0 {
		max = 100
	}
	
	percentage := (value / max) * 100
	if percentage > 100 {
		percentage = 100
	}
	
	// Color based on percentage
	var gaugeColor lipgloss.Color
	if percentage < 30 {
		gaugeColor = lipgloss.Color("82") // Green
	} else if percentage < 60 {
		gaugeColor = lipgloss.Color("226") // Yellow
	} else if percentage < 85 {
		gaugeColor = lipgloss.Color("208") // Orange
	} else {
		gaugeColor = lipgloss.Color("196") // Red
	}
	
	barWidth := width - 30
	filledWidth := int((percentage / 100) * float64(barWidth))
	
	filled := strings.Repeat("█", filledWidth)
	empty := strings.Repeat("░", barWidth-filledWidth)
	
	bar := lipgloss.NewStyle().Foreground(gaugeColor).Render(filled) + 
		lipgloss.NewStyle().Foreground(lipgloss.Color("240")).Render(empty)
	
	label := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("250")).
		Render(title)
	
	valueText := lipgloss.NewStyle().
		Bold(true).
		Foreground(gaugeColor).
		Render(fmt.Sprintf("%.1f%%", percentage))
	
	return fmt.Sprintf("%s\n%s %s", label, bar, valueText)
}

// RiskLevelGauge creates a risk level indicator
func RiskLevelGauge(riskScore float64) string {
	levels := []string{"LOW", "MEDIUM", "HIGH", "CRITICAL"}
	colors := []lipgloss.Color{
		lipgloss.Color("82"),  // Green
		lipgloss.Color("226"), // Yellow
		lipgloss.Color("208"), // Orange
		lipgloss.Color("196"), // Red
	}
	
	var result strings.Builder
	result.WriteString("Risk Level: ")
	
	for i, level := range levels {
		threshold := float64(i+1) * 0.25
		style := lipgloss.NewStyle()
		
		if riskScore >= threshold-0.25 {
			style = style.Foreground(colors[i]).Bold(true)
		} else {
			style = style.Foreground(lipgloss.Color("240"))
		}
		
		result.WriteString(style.Render(fmt.Sprintf("[%s]", level)))
		if i < len(levels)-1 {
			result.WriteString(" ")
		}
	}
	
	return result.String()
}

// StatsBox creates a styled stats box
func StatsBox(title string, value string, trend string, color string) string {
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("250")).
		MarginBottom(1)
	
	valueStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color(color))
	
	trendStyle := lipgloss.NewStyle().
		Foreground(lipgloss.Color("245")).
		Italic(true)
	
	content := titleStyle.Render(title) + "\n" +
		valueStyle.Render(value) + "\n" +
		trendStyle.Render(trend)
	
	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color(color)).
		Padding(1, 2).
		Width(25).
		Render(content)
}
