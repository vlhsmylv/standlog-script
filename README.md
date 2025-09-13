# StandLog Analytics - MVP Documentation

## 🚀 Website Analytics for Modern Apps

A focused, lightweight analytics platform that provides the core insights you need without the bloat.

## ✨ Core Features

### 1. 📍 Click & Scroll Heatmaps

- **Interactive map-like view** with zoom and pan controls
- **Real-time click tracking** with coordinate precision
- **Scroll depth analysis** to understand content engagement
- **Visual overlay** shows hotspots and cold zones

### 2. 🔀 Funnel & Drop-off Analysis

- **Track user flows** like signup, checkout, onboarding
- **Identify drop-off points** with conversion rates
- **Custom funnel definitions** for any user journey
- **Real-time funnel completion** tracking

### 3. 👥 Persona Categorization

- **Automatic user segmentation** based on behavior patterns
- **Custom persona rules** (Power User, Bouncer, Mobile User, etc.)
- **Persona-specific analytics views** for targeted insights
- **Real-time persona assignment** as users browse

### 4. 📊 Real-Time Dashboard

- **Live activity feed** showing user actions as they happen
- **Date range selectors** (hour, day, week, month)
- **Device and OS filters** for segmented analysis
- **Smart alerts** for traffic spikes and anomalies

### 5. 📤 Export & Integrations

- **Multiple export formats**: JSON, CSV, PDF
- **Slack integration** for team notifications
- **Jira integration** for issue tracking
- **Webhook support** for custom integrations

### 6. 🔧 Easy Installation

- **Single JavaScript snippet** to embed
- **Auto-detection** from script tag attributes
- **Zero configuration** for basic setup
- **Modular feature enablement**

### 7. 👻 Invisible Tracking

- **No user-facing UI** by default
- **Lightweight and performant**
- **Privacy-focused** data collection
- **GDPR-ready** implementation

## 🛠 Project Structure

```
├── js/
│   ├── script.js                    # Main analytics script (MVP)
│   └── modules/                     # Modular components
│       ├── tracking/
│       │   └── core.js             # Core tracking functionality
│       ├── heatmaps/
│       │   └── heatmap.js          # Interactive heatmap renderer
│       ├── funnels/
│       │   └── funnel.js           # Funnel analysis engine
│       ├── personas/
│       │   └── personas.js         # User segmentation logic
│       ├── dashboard/
│       │   └── dashboard.js        # Real-time dashboard
│       └── integrations/
│           └── integrations.js     # Export and API integrations
├── dist/                           # Minified production files
├── index.html                      # Demo page
└── package.json                    # Build configuration
```

## 🚦 Quick Start

### Basic Installation

Add this single line to your website:

```html
<script
  src="https://cdn.standlog.com/standlog.min.js"
  data-standlog-id="YOUR_API_KEY"
></script>
```

### Advanced Configuration

```html
<script
  src="https://cdn.standlog.com/standlog.min.js"
  data-standlog-id="YOUR_API_KEY"
  data-debug="false"
  data-enable-heatmaps="true"
  data-enable-funnels="true"
  data-enable-personas="true"
  data-enable-dashboard="true"
  data-enable-integrations="true"
></script>
```

### Programmatic Usage

```javascript
// Initialize manually
const analytics = StandLog.init("YOUR_API_KEY", {
  enableHeatmaps: true,
  enableFunnels: true,
  enablePersonas: true,
  debug: false,
});

// Track custom events
analytics.track("button_clicked", { button: "signup" });

// Create heatmap
analytics.createHeatmap("heatmap-container", "click");

// Define conversion funnel
analytics.defineFunnel("signup", [
  { id: "landing", name: "Landing Page", url: "/" },
  { id: "form", name: "Signup Form", url: "/signup" },
  { id: "verify", name: "Email Verification", event: "email_verified" },
  { id: "complete", name: "Profile Complete", event: "profile_completed" },
]);

// Create dashboard
analytics.createDashboard("dashboard-container");

// Export data
const data = analytics.exportData("json");
```

## 📋 Build Commands

### Development

- `npm install` - Install dependencies
- `npm run build` - Build and minify all files to `dist/`

### Production

- `npm run clean:dist` - Clean dist folder
- `npm run minify:jsFolder` - Minify JS files
- `npm run rename:dist` - Rename output folder

## 🎯 Usage Examples

### Create Interactive Heatmap

```javascript
// Create click heatmap with zoom/pan
const heatmap = standlog.createHeatmap("my-container", "click");

// Create scroll heatmap
const scrollMap = standlog.createHeatmap("scroll-container", "scroll");
```

### Define Conversion Funnels

```javascript
// E-commerce funnel
standlog.defineFunnel(
  "purchase",
  [
    { id: "product", name: "Product View", event: "product_viewed" },
    { id: "cart", name: "Add to Cart", event: "add_to_cart" },
    { id: "checkout", name: "Checkout", url: "/checkout" },
    { id: "payment", name: "Payment", event: "payment_completed" },
  ],
  { name: "Purchase Flow" }
);
```

### Export Analytics Data

```javascript
// Export as JSON
const jsonData = standlog.exportData("json");

// Export as CSV
const csvData = standlog.exportData("csv");

// Send to Slack
standlog.modules.integrations.sendToSlack(
  "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  { alert: "Traffic spike detected!" }
);
```

### Create Real-time Dashboard

```javascript
// Simple dashboard
standlog.createDashboard("dashboard");

// Get current analytics state
const analytics = standlog.getAnalytics();
console.log(`Current session has ${analytics.session.pageViews} page views`);
```

## 🔧 Configuration Options

| Option               | Default | Description                       |
| -------------------- | ------- | --------------------------------- |
| `enableHeatmaps`     | `true`  | Interactive click/scroll heatmaps |
| `enableFunnels`      | `true`  | Conversion funnel tracking        |
| `enablePersonas`     | `true`  | User segmentation and personas    |
| `enableDashboard`    | `true`  | Real-time dashboard               |
| `enableIntegrations` | `true`  | Export and API integrations       |
| `debug`              | `false` | Console logging for development   |

## 🚀 Deployment

1. **Build for production**: `npm run build`
2. **Deploy `dist/` folder** to your CDN
3. **Add script tag** to your website
4. **Configure API key** and desired features

## 📊 Demo & Testing

Open `index.html` in your browser to see the analytics in action:

- Click around to generate heatmap data
- Scroll to test scroll tracking
- Open browser console to see tracked events
- View real-time dashboard updates

## 🎯 MVP Focus

This version focuses on the **core 7 features** essential for website analytics:

✅ **Interactive Heatmaps** - See where users click and scroll  
✅ **Funnel Analysis** - Track conversion flows and drop-offs  
✅ **User Personas** - Segment users by behavior patterns  
✅ **Real-time Dashboard** - Monitor activity as it happens  
✅ **Export & Integrations** - Get data out in multiple formats  
✅ **Easy Installation** - Single script tag setup  
✅ **Invisible Tracking** - No user-facing UI, pure analytics

**Removed experimental features**: screen recording, cobrowsing, complex element selectors, extension UI

## 📝 Dependencies

- **Core**: Vanilla JavaScript (no external dependencies)
- **Build**: `uglifyjs-folder` for minification
- **Optional**: Chart.js for advanced visualizations (not included in MVP)

Ready for hackathon demos and production deployment! 🎉
