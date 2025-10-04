# Fraud Detection Next.js Dashboard

A modern, real-time fraud detection dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

✨ **Real-time Updates** - Auto-refreshes every 3 seconds  
📊 **Live Statistics** - Total transactions, fraud rate, average risk score  
📋 **Transaction Table** - View recent transactions with risk levels  
🎨 **Dark Mode** - Automatic dark mode support  
⚡ **Fast & Responsive** - Built with Next.js 14 and Tailwind CSS  

## Prerequisites

- Node.js 18+ and npm
- Python FastAPI backend running on `http://localhost:8000`

## Quick Start

1. **Install dependencies:**
   ```bash
   cd nextjs-frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
nextjs-frontend/
├── src/
│   ├── app/              # Next.js 14 App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Dashboard page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── StatsOverview.tsx
│   │   └── TransactionsTable.tsx
│   ├── lib/             # Utilities
│   │   └── api.ts       # API client
│   └── types/           # TypeScript types
│       └── index.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## API Integration

The dashboard connects to these FastAPI endpoints:

- `GET /health` - System health check
- `GET /stats` - Get system statistics
- `GET /recent?limit=25` - Get recent transactions

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Components

### StatsOverview
Displays four key metrics:
- Total Transactions
- Fraud Detected
- Average Risk Score
- System Uptime

### TransactionsTable
Shows recent transactions with:
- Transaction ID
- Timestamp
- User ID
- Amount
- Risk percentage
- Fraud status

## Styling

- **Framework**: Tailwind CSS
- **Theme**: Auto dark mode support
- **Colors**: Custom fraud risk colors (low/medium/high/critical)

## Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Date Formatting**: date-fns
- **Charts**: Chart.js + react-chartjs-2 (interactive visualizations)

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [x] Interactive charts with Chart.js (4 chart types: Line, Doughnut, 2x Bar)
- [ ] Transaction filtering and search
- [ ] Export functionality
- [ ] AI explanation display
- [ ] Alert notifications
