/**
 * StandLog Analytics - Dashboard Module
 * Real-time dashboard with filters, date ranges, and alerts
 */

class AnalyticsDashboard {
  constructor(containerId, config = {}) {
    this.container = document.getElementById(containerId);
    this.config = {
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      enableAlerts: true,
      defaultDateRange: "7d",
      enableRealTime: true,
      ...config,
    };

    this.data = {
      metrics: {},
      events: [],
      users: {},
      alerts: [],
    };

    this.filters = {
      dateRange: this.config.defaultDateRange,
      deviceTypes: [],
      browsers: [],
      personas: [],
      pages: [],
    };

    this.charts = {};
    this.widgets = {};

    this.init();
  }

  /**
   * Initialize dashboard
   */
  init() {
    this.createDashboardStructure();
    this.setupFilters();
    this.setupRealTimeUpdates();
    this.loadInitialData();

    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Create dashboard HTML structure
   */
  createDashboardStructure() {
    this.container.innerHTML = `
      <div class="standlog-dashboard">
        <div class="dashboard-header">
          <h1>StandLog Analytics Dashboard</h1>
          <div class="dashboard-controls">
            <div class="date-range-selector">
              <select id="dateRange">
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d" selected>Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              <input type="date" id="startDate" style="display: none;">
              <input type="date" id="endDate" style="display: none;">
            </div>
            <div class="refresh-controls">
              <button id="refreshBtn">Refresh</button>
              <label>
                <input type="checkbox" id="autoRefresh" ${
                  this.config.autoRefresh ? "checked" : ""
                }>
                Auto Refresh
              </label>
            </div>
          </div>
        </div>
        
        <div class="dashboard-filters">
          <div class="filter-group">
            <label>Device:</label>
            <select id="deviceFilter" multiple>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Browser:</label>
            <select id="browserFilter" multiple>
              <option value="chrome">Chrome</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
              <option value="edge">Edge</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Persona:</label>
            <select id="personaFilter" multiple>
              <option value="power_user">Power User</option>
              <option value="casual_user">Casual User</option>
              <option value="bouncer">Bouncer</option>
              <option value="mobile_user">Mobile User</option>
              <option value="converter">Converter</option>
            </select>
          </div>
        </div>

        <div class="dashboard-alerts" id="alertsContainer"></div>
        
        <div class="dashboard-metrics">
          <div class="metric-card" id="usersCard">
            <h3>Users</h3>
            <div class="metric-value" id="usersValue">-</div>
            <div class="metric-change" id="usersChange">-</div>
          </div>
          <div class="metric-card" id="pageViewsCard">
            <h3>Page Views</h3>
            <div class="metric-value" id="pageViewsValue">-</div>
            <div class="metric-change" id="pageViewsChange">-</div>
          </div>
          <div class="metric-card" id="sessionsCard">
            <h3>Sessions</h3>
            <div class="metric-value" id="sessionsValue">-</div>
            <div class="metric-change" id="sessionsChange">-</div>
          </div>
          <div class="metric-card" id="bounceRateCard">
            <h3>Bounce Rate</h3>
            <div class="metric-value" id="bounceRateValue">-</div>
            <div class="metric-change" id="bounceRateChange">-</div>
          </div>
        </div>
        
        <div class="dashboard-charts">
          <div class="chart-container">
            <h3>Traffic Over Time</h3>
            <canvas id="trafficChart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Device Distribution</h3>
            <canvas id="deviceChart"></canvas>
          </div>
          <div class="chart-container">
            <h3>Top Pages</h3>
            <div id="topPagesChart"></div>
          </div>
          <div class="chart-container">
            <h3>User Personas</h3>
            <canvas id="personasChart"></canvas>
          </div>
        </div>
        
        <div class="dashboard-tables">
          <div class="table-container">
            <h3>Real-Time Activity</h3>
            <div id="realTimeActivity"></div>
          </div>
          <div class="table-container">
            <h3>Recent Events</h3>
            <div id="recentEvents"></div>
          </div>
        </div>
      </div>
    `;

    this.addDashboardStyles();
  }

  /**
   * Add dashboard CSS styles
   */
  addDashboardStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
      .standlog-dashboard {
        font-family: Arial, sans-serif;
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }
      
      .dashboard-controls {
        display: flex;
        gap: 20px;
        align-items: center;
      }
      
      .dashboard-filters {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f5f5f5;
        border-radius: 8px;
      }
      
      .filter-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .dashboard-alerts {
        margin-bottom: 20px;
      }
      
      .alert {
        padding: 10px 15px;
        margin-bottom: 10px;
        border-radius: 5px;
        border-left: 4px solid;
      }
      
      .alert.warning {
        background: #fff3cd;
        border-color: #ffc107;
        color: #856404;
      }
      
      .alert.danger {
        background: #f8d7da;
        border-color: #dc3545;
        color: #721c24;
      }
      
      .alert.success {
        background: #d4edda;
        border-color: #28a745;
        color: #155724;
      }
      
      .dashboard-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .metric-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
      }
      
      .metric-card h3 {
        margin: 0 0 10px 0;
        color: #666;
        font-size: 14px;
        text-transform: uppercase;
      }
      
      .metric-value {
        font-size: 2.5em;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
      }
      
      .metric-change {
        font-size: 0.9em;
        padding: 3px 8px;
        border-radius: 4px;
      }
      
      .metric-change.positive {
        background: #d4edda;
        color: #155724;
      }
      
      .metric-change.negative {
        background: #f8d7da;
        color: #721c24;
      }
      
      .dashboard-charts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .chart-container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .chart-container h3 {
        margin: 0 0 15px 0;
        color: #333;
      }
      
      .dashboard-tables {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: 20px;
      }
      
      .table-container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .real-time-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #28a745;
        border-radius: 50%;
        margin-right: 5px;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      .event-item {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .event-time {
        font-size: 0.8em;
        color: #666;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup filter event listeners
   */
  setupFilters() {
    // Date range selector
    document.getElementById("dateRange").addEventListener("change", (e) => {
      this.filters.dateRange = e.target.value;

      if (e.target.value === "custom") {
        document.getElementById("startDate").style.display = "inline";
        document.getElementById("endDate").style.display = "inline";
      } else {
        document.getElementById("startDate").style.display = "none";
        document.getElementById("endDate").style.display = "none";
        this.refreshData();
      }
    });

    // Custom date inputs
    ["startDate", "endDate"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => {
        if (this.filters.dateRange === "custom") {
          this.refreshData();
        }
      });
    });

    // Filter selectors
    ["deviceFilter", "browserFilter", "personaFilter"].forEach((id) => {
      document.getElementById(id).addEventListener("change", (e) => {
        const filterName = id.replace("Filter", "") + "s";
        this.filters[filterName] = Array.from(e.target.selectedOptions).map(
          (o) => o.value
        );
        this.refreshData();
      });
    });

    // Refresh button
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.refreshData();
    });

    // Auto refresh toggle
    document.getElementById("autoRefresh").addEventListener("change", (e) => {
      this.config.autoRefresh = e.target.checked;
      if (this.config.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });
  }

  /**
   * Setup real-time updates
   */
  setupRealTimeUpdates() {
    if (!this.config.enableRealTime) return;

    // Listen for real-time events
    window.addEventListener("standlog_real_time_event", (e) => {
      this.handleRealTimeEvent(e.detail);
    });

    // Setup WebSocket connection if available
    this.setupWebSocketConnection();
  }

  /**
   * Setup WebSocket for real-time data
   */
  setupWebSocketConnection() {
    // This would connect to your real-time analytics endpoint
    // For demo purposes, we'll simulate real-time events
    setInterval(() => {
      this.simulateRealTimeEvent();
    }, 5000);
  }

  /**
   * Simulate real-time event for demo
   */
  simulateRealTimeEvent() {
    const eventTypes = ["pageview", "click", "form_submit", "custom"];
    const randomEvent = {
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      timestamp: Date.now(),
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      page: {
        url: window.location.href,
        title: document.title,
      },
    };

    this.handleRealTimeEvent(randomEvent);
  }

  /**
   * Handle real-time event
   */
  handleRealTimeEvent(event) {
    // Add to events list
    this.data.events.unshift(event);

    // Keep only last 100 events
    if (this.data.events.length > 100) {
      this.data.events = this.data.events.slice(0, 100);
    }

    // Update real-time activity display
    this.updateRealTimeActivity();

    // Update metrics
    this.updateMetricsFromEvent(event);

    // Check for alerts
    this.checkAlerts(event);
  }

  /**
   * Load initial dashboard data
   */
  async loadInitialData() {
    // This would typically fetch from your API
    await this.fetchMetrics();
    await this.fetchEvents();

    this.updateAllWidgets();
  }

  /**
   * Fetch metrics from API
   */
  async fetchMetrics() {
    // Simulate API call
    this.data.metrics = {
      users: { current: 1250, previous: 1180, change: 5.9 },
      pageViews: { current: 15420, previous: 14250, change: 8.2 },
      sessions: { current: 3240, previous: 3100, change: 4.5 },
      bounceRate: { current: 45.2, previous: 48.1, change: -6.0 },
    };
  }

  /**
   * Fetch events from API
   */
  async fetchEvents() {
    // Simulate API call - in real implementation, this would fetch filtered events
    this.data.events = [];
  }

  /**
   * Update all dashboard widgets
   */
  updateAllWidgets() {
    this.updateMetricCards();
    this.updateCharts();
    this.updateTables();
  }

  /**
   * Update metric cards
   */
  updateMetricCards() {
    Object.entries(this.data.metrics).forEach(([key, metric]) => {
      const valueEl = document.getElementById(`${key}Value`);
      const changeEl = document.getElementById(`${key}Change`);

      if (valueEl && changeEl) {
        valueEl.textContent = this.formatMetricValue(key, metric.current);

        const changeText = `${
          metric.change > 0 ? "+" : ""
        }${metric.change.toFixed(1)}%`;
        changeEl.textContent = changeText;
        changeEl.className = `metric-change ${
          metric.change >= 0 ? "positive" : "negative"
        }`;
      }
    });
  }

  /**
   * Format metric value for display
   */
  formatMetricValue(metric, value) {
    switch (metric) {
      case "users":
      case "pageViews":
      case "sessions":
        return this.formatNumber(value);
      case "bounceRate":
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  }

  /**
   * Format number with commas
   */
  formatNumber(num) {
    return num.toLocaleString();
  }

  /**
   * Update charts
   */
  updateCharts() {
    // Traffic over time chart
    this.updateTrafficChart();

    // Device distribution chart
    this.updateDeviceChart();

    // Top pages chart
    this.updateTopPagesChart();

    // Personas chart
    this.updatePersonasChart();
  }

  /**
   * Update traffic chart
   */
  updateTrafficChart() {
    const canvas = document.getElementById("trafficChart");
    const ctx = canvas.getContext("2d");

    // Simple line chart implementation
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sample traffic data
    ctx.strokeStyle = "#2196F3";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const dataPoints = [120, 150, 180, 220, 190, 250, 280, 320, 290, 340];
    const stepX = canvas.width / (dataPoints.length - 1);

    dataPoints.forEach((point, index) => {
      const x = index * stepX;
      const y = canvas.height - (point / 340) * canvas.height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  /**
   * Update device chart
   */
  updateDeviceChart() {
    const canvas = document.getElementById("deviceChart");
    const ctx = canvas.getContext("2d");

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple pie chart
    const data = [
      { label: "Desktop", value: 60, color: "#4CAF50" },
      { label: "Mobile", value: 35, color: "#2196F3" },
      { label: "Tablet", value: 5, color: "#FF9800" },
    ];

    let currentAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    data.forEach((segment) => {
      const sliceAngle = (segment.value / 100) * 2 * Math.PI;

      ctx.fillStyle = segment.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.closePath();
      ctx.fill();

      currentAngle += sliceAngle;
    });
  }

  /**
   * Update top pages chart
   */
  updateTopPagesChart() {
    const container = document.getElementById("topPagesChart");

    const pages = [
      { url: "/home", views: 1250 },
      { url: "/products", views: 890 },
      { url: "/about", views: 650 },
      { url: "/contact", views: 420 },
      { url: "/blog", views: 320 },
    ];

    const maxViews = Math.max(...pages.map((p) => p.views));

    container.innerHTML = pages
      .map(
        (page) => `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div style="width: 120px; font-size: 0.9em;">${page.url}</div>
        <div style="flex: 1; background: #f0f0f0; height: 20px; margin: 0 10px; border-radius: 10px;">
          <div style="background: #2196F3; height: 100%; width: ${
            (page.views / maxViews) * 100
          }%; border-radius: 10px;"></div>
        </div>
        <div style="width: 60px; text-align: right; font-size: 0.9em;">${this.formatNumber(
          page.views
        )}</div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Update personas chart
   */
  updatePersonasChart() {
    const canvas = document.getElementById("personasChart");
    const ctx = canvas.getContext("2d");

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bar chart for personas
    const personas = [
      { name: "Power User", count: 180, color: "#4CAF50" },
      { name: "Casual User", count: 520, color: "#2196F3" },
      { name: "Bouncer", count: 320, color: "#F44336" },
      { name: "Mobile User", count: 420, color: "#FF9800" },
      { name: "Converter", count: 150, color: "#9C27B0" },
    ];

    const maxCount = Math.max(...personas.map((p) => p.count));
    const barWidth = canvas.width / personas.length - 10;

    personas.forEach((persona, index) => {
      const x = index * (barWidth + 10) + 5;
      const height = (persona.count / maxCount) * (canvas.height - 30);
      const y = canvas.height - height - 20;

      ctx.fillStyle = persona.color;
      ctx.fillRect(x, y, barWidth, height);

      // Label
      ctx.fillStyle = "#333";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(persona.count.toString(), x + barWidth / 2, y - 5);
    });
  }

  /**
   * Update tables
   */
  updateTables() {
    this.updateRealTimeActivity();
    this.updateRecentEvents();
  }

  /**
   * Update real-time activity
   */
  updateRealTimeActivity() {
    const container = document.getElementById("realTimeActivity");

    const recentEvents = this.data.events.slice(0, 10);

    container.innerHTML = `
      <div style="margin-bottom: 15px;">
        <span class="real-time-indicator"></span>
        <strong>Live Activity</strong>
      </div>
      ${recentEvents
        .map(
          (event) => `
        <div class="event-item">
          <div>
            <strong>${event.type}</strong> 
            ${event.page ? `on ${event.page.title || event.page.url}` : ""}
          </div>
          <div class="event-time">${this.formatTime(event.timestamp)}</div>
        </div>
      `
        )
        .join("")}
    `;
  }

  /**
   * Update recent events table
   */
  updateRecentEvents() {
    const container = document.getElementById("recentEvents");

    const events = this.data.events.slice(0, 15);

    container.innerHTML = events
      .map(
        (event) => `
      <div class="event-item">
        <div>
          <strong>${event.userId}</strong> - ${event.type}
          ${event.page ? `<br><small>${event.page.url}</small>` : ""}
        </div>
        <div class="event-time">${this.formatTime(event.timestamp)}</div>
      </div>
    `
      )
      .join("");
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  /**
   * Update metrics from real-time event
   */
  updateMetricsFromEvent(event) {
    // Simple real-time metric updates
    if (event.type === "pageview") {
      this.data.metrics.pageViews.current++;
      document.getElementById("pageViewsValue").textContent = this.formatNumber(
        this.data.metrics.pageViews.current
      );
    }
  }

  /**
   * Check for alerts based on new event
   */
  checkAlerts(event) {
    if (!this.config.enableAlerts) return;

    // Example alert conditions
    const alerts = [];

    // High traffic spike
    if (
      this.data.events.filter((e) => Date.now() - e.timestamp < 60000).length >
      10
    ) {
      alerts.push({
        type: "warning",
        message: "Traffic spike detected in the last minute",
      });
    }

    // Error events
    if (event.type === "error") {
      alerts.push({
        type: "danger",
        message: "Error event detected",
      });
    }

    this.displayAlerts(alerts);
  }

  /**
   * Display alerts in dashboard
   */
  displayAlerts(alerts) {
    const container = document.getElementById("alertsContainer");

    container.innerHTML = alerts
      .map(
        (alert) => `
      <div class="alert ${alert.type}">
        ${alert.message}
        <button onclick="this.parentElement.style.display='none'" style="float: right; background: none; border: none; font-size: 18px;">&times;</button>
      </div>
    `
      )
      .join("");
  }

  /**
   * Refresh dashboard data
   */
  async refreshData() {
    await this.loadInitialData();
  }

  /**
   * Start auto refresh
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.refreshData();
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Export dashboard data
   */
  exportData(format = "json") {
    const exportData = {
      metrics: this.data.metrics,
      events: this.data.events,
      filters: this.filters,
      timestamp: Date.now(),
    };

    if (format === "csv") {
      return this.convertToCSV(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Convert data to CSV
   */
  convertToCSV(data) {
    // Simple CSV export for events
    const headers = ["timestamp", "type", "userId", "page"];
    const rows = [headers.join(",")];

    data.events.forEach((event) => {
      rows.push(
        [
          new Date(event.timestamp).toISOString(),
          event.type,
          event.userId,
          event.page?.url || "",
        ].join(",")
      );
    });

    return rows.join("\n");
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    this.stopAutoRefresh();
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = AnalyticsDashboard;
} else {
  window.AnalyticsDashboard = AnalyticsDashboard;
}
