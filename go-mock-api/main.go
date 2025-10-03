package main

import (
	"context"
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

var (
	ctx         = context.Background()
	redisClient *redis.Client
	
	// Transaction generation configuration
	transactionRate = 10    // transactions per second
	fraudRate       = 0.15  // 15% fraud rate
)

// Transaction represents a financial transaction
type Transaction struct {
	TransactionID     string                 `json:"transaction_id"`
	UserID            string                 `json:"user_id"`
	Amount            float64                `json:"amount"`
	Currency          string                 `json:"currency"`
	TransactionType   string                 `json:"transaction_type"`
	MerchantID        *string                `json:"merchant_id,omitempty"`
	MerchantCategory  *string                `json:"merchant_category,omitempty"`
	Location          *string                `json:"location,omitempty"`
	IPAddress         *string                `json:"ip_address,omitempty"`
	DeviceID          *string                `json:"device_id,omitempty"`
	Timestamp         time.Time              `json:"timestamp"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
}

// TransactionGenerator generates realistic transactions
type TransactionGenerator struct {
	userIDs      []string
	merchantIDs  []string
	ipAddresses  []string
	deviceIDs    []string
	locations    []string
	categories   []string
	types        []string
}

func NewTransactionGenerator() *TransactionGenerator {
	return &TransactionGenerator{
		userIDs: []string{
			"user_001", "user_002", "user_003", "user_004", "user_005",
			"user_006", "user_007", "user_008", "user_009", "user_010",
			"user_011", "user_012", "user_013", "user_014", "user_015",
		},
		merchantIDs: []string{
			"merchant_amazon", "merchant_walmart", "merchant_target",
			"merchant_bestbuy", "merchant_apple", "merchant_gas_station",
			"merchant_restaurant", "merchant_grocery", "merchant_pharmacy",
			"merchant_online_shop",
		},
		ipAddresses: []string{
			"192.168.1.1", "192.168.1.2", "10.0.0.1", "10.0.0.2",
			"172.16.0.1", "172.16.0.2", "8.8.8.8", "1.1.1.1",
		},
		deviceIDs: []string{
			"device_mobile_001", "device_mobile_002", "device_web_001",
			"device_web_002", "device_tablet_001", "device_tablet_002",
		},
		locations: []string{
			"New York, NY", "Los Angeles, CA", "Chicago, IL",
			"Houston, TX", "Phoenix, AZ", "Philadelphia, PA",
			"San Antonio, TX", "San Diego, CA", "Dallas, TX",
		},
		categories: []string{
			"electronics", "groceries", "gas", "restaurant",
			"retail", "online", "entertainment", "healthcare",
		},
		types: []string{
			"payment", "transfer", "withdrawal", "deposit", "refund",
		},
	}
}

// GenerateNormalTransaction generates a normal transaction
func (tg *TransactionGenerator) GenerateNormalTransaction() Transaction {
	userID := tg.userIDs[rand.Intn(len(tg.userIDs))]
	merchantID := tg.merchantIDs[rand.Intn(len(tg.merchantIDs))]
	category := tg.categories[rand.Intn(len(tg.categories))]
	location := tg.locations[rand.Intn(len(tg.locations))]
	ipAddress := tg.ipAddresses[rand.Intn(len(tg.ipAddresses))]
	deviceID := tg.deviceIDs[rand.Intn(len(tg.deviceIDs))]
	txnType := tg.types[rand.Intn(len(tg.types))]
	
	// Normal amounts: $5 - $500
	amount := 5.0 + rand.Float64()*495.0
	
	return Transaction{
		TransactionID:    uuid.New().String(),
		UserID:           userID,
		Amount:           amount,
		Currency:         "USD",
		TransactionType:  txnType,
		MerchantID:       &merchantID,
		MerchantCategory: &category,
		Location:         &location,
		IPAddress:        &ipAddress,
		DeviceID:         &deviceID,
		Timestamp:        time.Now(),
		Metadata: map[string]interface{}{
			"is_fraud": false,
			"fraud_type": nil,
		},
	}
}

// GenerateFraudulentTransaction generates a fraudulent transaction
func (tg *TransactionGenerator) GenerateFraudulentTransaction() Transaction {
	fraudType := rand.Intn(5)
	
	switch fraudType {
	case 0: // High amount anomaly
		return tg.generateHighAmountFraud()
	case 1: // Velocity attack
		return tg.generateVelocityFraud()
	case 2: // Multiple IPs
		return tg.generateMultiIPFraud()
	case 3: // Unusual time
		return tg.generateUnusualTimeFraud()
	default: // Account takeover
		return tg.generateAccountTakeoverFraud()
	}
}

func (tg *TransactionGenerator) generateHighAmountFraud() Transaction {
	txn := tg.GenerateNormalTransaction()
	// Very high amount: $1000 - $5000
	txn.Amount = 1000.0 + rand.Float64()*4000.0
	txn.Metadata["is_fraud"] = true
	txn.Metadata["fraud_type"] = "high_amount"
	return txn
}

func (tg *TransactionGenerator) generateVelocityFraud() Transaction {
	txn := tg.GenerateNormalTransaction()
	// Will be sent in rapid succession
	txn.Metadata["is_fraud"] = true
	txn.Metadata["fraud_type"] = "velocity_attack"
	return txn
}

func (tg *TransactionGenerator) generateMultiIPFraud() Transaction {
	txn := tg.GenerateNormalTransaction()
	// Use unusual IP
	unusualIP := "203.0.113." + strconv.Itoa(rand.Intn(255))
	txn.IPAddress = &unusualIP
	txn.Metadata["is_fraud"] = true
	txn.Metadata["fraud_type"] = "multiple_ips"
	return txn
}

func (tg *TransactionGenerator) generateUnusualTimeFraud() Transaction {
	txn := tg.GenerateNormalTransaction()
	// Set to unusual hours (2-5 AM)
	now := time.Now()
	unusualTime := time.Date(now.Year(), now.Month(), now.Day(), 
		2+rand.Intn(3), rand.Intn(60), rand.Intn(60), 0, now.Location())
	txn.Timestamp = unusualTime
	txn.Metadata["is_fraud"] = true
	txn.Metadata["fraud_type"] = "unusual_time"
	return txn
}

func (tg *TransactionGenerator) generateAccountTakeoverFraud() Transaction {
	txn := tg.GenerateNormalTransaction()
	// Different device and location
	newDevice := "device_unknown_" + uuid.New().String()[:8]
	newLocation := "Unknown Location"
	txn.DeviceID = &newDevice
	txn.Location = &newLocation
	txn.Amount = 500.0 + rand.Float64()*1500.0
	txn.Metadata["is_fraud"] = true
	txn.Metadata["fraud_type"] = "account_takeover"
	return txn
}

// GenerateTransaction generates a random transaction (normal or fraud)
func (tg *TransactionGenerator) GenerateTransaction() Transaction {
	if rand.Float64() < fraudRate {
		return tg.GenerateFraudulentTransaction()
	}
	return tg.GenerateNormalTransaction()
}

// Initialize Redis connection
func initRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}
	
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatal("Failed to parse Redis URL:", err)
	}
	
	redisClient = redis.NewClient(opt)
	
	// Test connection
	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Redis not available: %v", err)
	} else {
		log.Println("✅ Connected to Redis")
	}
}

// Publish transaction to Redis
func publishTransaction(txn Transaction) error {
	if redisClient == nil {
		return nil
	}
	
	data, err := json.Marshal(txn)
	if err != nil {
		return err
	}
	
	return redisClient.Publish(ctx, "transactions", string(data)).Err()
}

func main() {
	// Load environment variables
	godotenv.Load("../.env")
	
	// Get configuration from environment
	if rate := os.Getenv("TRANSACTION_RATE"); rate != "" {
		if r, err := strconv.Atoi(rate); err == nil {
			transactionRate = r
		}
	}
	
	if rate := os.Getenv("FRAUD_RATE"); rate != "" {
		if r, err := strconv.ParseFloat(rate, 64); err == nil {
			fraudRate = r
		}
	}
	
	// Initialize Redis
	initRedis()
	defer func() {
		if redisClient != nil {
			redisClient.Close()
		}
	}()
	
	// Initialize transaction generator
	generator := NewTransactionGenerator()
	
	// Set up Gin router
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	
	// Enable CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"service": "Mock Transaction Generator",
		})
	})
	
	// Generate single transaction
	router.POST("/transaction", func(c *gin.Context) {
		txn := generator.GenerateTransaction()
		
		// Publish to Redis
		if err := publishTransaction(txn); err != nil {
			log.Printf("Failed to publish transaction: %v", err)
		}
		
		c.JSON(http.StatusOK, txn)
	})
	
	// Submit custom transaction for fraud detection
	router.POST("/transaction/custom", func(c *gin.Context) {
		var txn Transaction
		
		if err := c.BindJSON(&txn); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		// Set timestamp if not provided
		if txn.Timestamp.IsZero() {
			txn.Timestamp = time.Now()
		}
		
		// Generate transaction ID if not provided
		if txn.TransactionID == "" {
			txn.TransactionID = uuid.New().String()
		}
		
		// Publish to Redis for fraud detection
		if err := publishTransaction(txn); err != nil {
			log.Printf("Failed to publish transaction: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish transaction"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"status": "submitted",
			"transaction": txn,
		})
	})
	
	// Generate batch of transactions
	router.POST("/transactions/batch", func(c *gin.Context) {
		var req struct {
			Count int `json:"count"`
		}
		
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		if req.Count <= 0 || req.Count > 1000 {
			req.Count = 10
		}
		
		transactions := make([]Transaction, req.Count)
		for i := 0; i < req.Count; i++ {
			transactions[i] = generator.GenerateTransaction()
			publishTransaction(transactions[i])
		}
		
		c.JSON(http.StatusOK, gin.H{
			"count": req.Count,
			"transactions": transactions,
		})
	})
	
	// Start continuous transaction generation
	router.POST("/start-generation", func(c *gin.Context) {
		go func() {
			ticker := time.NewTicker(time.Second / time.Duration(transactionRate))
			defer ticker.Stop()
			
			log.Printf("🚀 Started continuous transaction generation (%d/sec)", transactionRate)
			
			for range ticker.C {
				txn := generator.GenerateTransaction()
				if err := publishTransaction(txn); err != nil {
					log.Printf("Failed to publish: %v", err)
				}
			}
		}()
		
		c.JSON(http.StatusOK, gin.H{
			"status": "started",
			"rate": transactionRate,
			"fraud_rate": fraudRate,
		})
	})
	
	// Get stats
	router.GET("/stats", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"transaction_rate": transactionRate,
			"fraud_rate": fraudRate,
			"total_users": len(generator.userIDs),
			"total_merchants": len(generator.merchantIDs),
		})
	})
	
	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("🚀 Mock API server starting on port %s", port)
	log.Printf("📊 Transaction rate: %d/sec, Fraud rate: %.1f%%", transactionRate, fraudRate*100)
	
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
