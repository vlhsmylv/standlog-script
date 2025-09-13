/**
 * StandLog Analytics - Main Script (MVP)
 * Website Analytics focused on core features
 *
 * @author Valeh Ismayilov
 *
 * Core Features:
 * 1. Click & Scroll Heatmaps (interactive, map-like view with zoom/pan)
 * 2. Funnel & Drop-off Analysis (track flows like signup/checkout)
 * 3. Persona Categorization & Views (general view + segmented by persona)
 * 4. Real-Time Dashboard (date range selector, device/OS filters, alerts)
 * 5. Export & Integrations (CSV/JSON/PDF, Slack/Jira integration hooks)
 * 6. Easy Installation (single JS snippet to embed)
 * 7. Invisible Tracking (no user-facing UI)
 */

// Import analytics if available (backward compatibility)
const analytics = window._analytics
  ? _analytics.init({ app: "standlog" })
  : null;

const ANALYTICS_API_URL = "https://hackathon-api.opencnt.com/api";

class StandLogAnalytics {
  key;

  /**
   * Initialize StandLog Analytics with API Key
   * @param {string} key - Client API Key
   * @param {object} config - Configuration options
   */
  constructor(key, config = {}) {
    this.key = key;
    this.config = {
      enableHeatmaps: true,
      enableFunnels: true,
      enablePersonas: true,
      enableDashboard: true,
      enableIntegrations: true,
      debug: false,
      ...config,
    };

    this.sessionData = null;
    this.events = [];
    this.modules = {};
    this.sessionCreated = false; // Track if session has been created on server

    this.init();
  }

  async init() {
    this.sessionData = {
      sessionId: this.generateSessionId(),
      userId: this.getUserId(),
      anonymousId: this.getAnonymousId(),
      startTime: Date.now(),
      pageViews: 0,
      clicks: 0,
      scrolls: 0,
    };

    this.setupTracking();
    this.initializeModules();
  }

  setupTracking() {
    // Page view tracking
    this.trackPageView();

    // Click tracking for heatmaps
    document.addEventListener("click", (e) => this.trackClick(e), true);

    // Scroll tracking for heatmaps
    let scrollTimeout;
    window.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => this.trackScroll(), 100);
      },
      { passive: true }
    );

    // Form submissions for funnel tracking
    document.addEventListener("submit", (e) => this.trackFormSubmit(e), true);

    // Send data before page unload
    window.addEventListener("beforeunload", () => this.sendEvents(true));
  }

  initializeModules() {
    // Initialize feature modules based on config
    if (this.config.enableHeatmaps) this.initHeatmaps();
    if (this.config.enableFunnels) this.initFunnels();
    if (this.config.enablePersonas) this.initPersonas();
    if (this.config.enableDashboard) this.initDashboard();
    if (this.config.enableIntegrations) this.initIntegrations();
  }

  // ===================
  // TRACKING MODULE
  // ===================

  trackClick(event) {
    const clickData = {
      type: "click",
      timestamp: Date.now(),
      coordinates: {
        x: event.clientX,
        y: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
      },
      element: this.getElementInfo(event.target),
      url: window.location.href,
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
    };

    if (this.config.debug) {
      console.log("🖱️ Click tracked:", clickData);
    }

    this.addEvent(clickData);
    this.sessionData.clicks++;
  }

  trackScroll() {
    const scrollData = {
      type: "scroll",
      timestamp: Date.now(),
      scroll: {
        x: window.scrollX,
        y: window.scrollY,
        percentage:
          (window.scrollY /
            (document.documentElement.scrollHeight - window.innerHeight)) *
          100,
      },
      url: window.location.href,
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
    };

    this.addEvent(scrollData);
    this.sessionData.scrolls++;
  }

  trackPageView() {
    const pageData = {
      type: "pageview",
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      device: this.getDeviceInfo(),
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
    };

    this.addEvent(pageData);
    this.sessionData.pageViews++;
  }

  trackFormSubmit(event) {
    const formData = {
      type: "form_submit",
      timestamp: Date.now(),
      form: {
        id: event.target.id,
        action: event.target.action,
        method: event.target.method,
      },
      url: window.location.href,
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
    };

    this.addEvent(formData);
  }

  // ===================
  // HEATMAPS MODULE
  // ===================

  initHeatmaps() {
    this.modules.heatmaps = {
      clickData: [],
      scrollData: [],

      createHeatmap: (containerId, type = "click") => {
        return this.createHeatmap(containerId, type);
      },
    };
  }

  createHeatmap(containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const data = this.events.filter((e) => e.type === type);
    return this.renderHeatmap(container, data, type);
  }

  renderHeatmap(container, data, type) {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "1000";
    canvas.style.pointerEvents = "auto";

    const ctx = canvas.getContext("2d");
    container.appendChild(canvas);

    let scale = 1,
      panX = 0,
      panY = 0;

    const render = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);

      // Render data points
      data.forEach((point) => {
        if (type === "click" && point.coordinates) {
          ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
          ctx.beginPath();
          ctx.arc(
            point.coordinates.pageX,
            point.coordinates.pageY,
            10,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      ctx.restore();
    };

    // Zoom and pan controls
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoom = e.deltaY > 0 ? 0.9 : 1.1;
      scale = Math.max(0.1, Math.min(5, scale * zoom));
      render();
    });

    render();

    return { canvas, render, destroy: () => container.removeChild(canvas) };
  }

  // ===================
  // FUNNELS MODULE
  // ===================

  initFunnels() {
    this.modules.funnels = {
      funnels: new Map(),

      defineFunnel: (id, steps, options = {}) => {
        return this.defineFunnel(id, steps, options);
      },

      trackStep: (funnelId, stepId) => {
        return this.trackFunnelStep(funnelId, stepId);
      },
    };
  }

  defineFunnel(id, steps, options) {
    const funnel = {
      id,
      name: options.name || id,
      steps: steps.map((step, index) => ({
        id: step.id || `step_${index}`,
        name: step.name,
        url: step.url,
        event: step.event,
        order: index,
      })),
      analytics: {
        totalUsers: 0,
        completions: 0,
        dropoffs: steps.map(() => ({ reached: 0, dropped: 0 })),
      },
    };

    this.modules.funnels.funnels.set(id, funnel);
    return funnel;
  }

  trackFunnelStep(funnelId, stepId) {
    const funnel = this.modules.funnels?.funnels.get(funnelId);
    if (!funnel) return;

    const step = funnel.steps.find((s) => s.id === stepId);
    if (step) {
      funnel.analytics.dropoffs[step.order].reached++;

      if (step.order === funnel.steps.length - 1) {
        funnel.analytics.completions++;
      }
    }
  }

  // ===================
  // PERSONAS MODULE
  // ===================

  initPersonas() {
    this.modules.personas = {
      personas: new Map(),
      userProfiles: new Map(),

      definePersona: (id, config) => {
        return this.definePersona(id, config);
      },

      analyzeUser: (userId) => {
        return this.analyzeUserPersona(userId);
      },
    };

    // Setup default personas
    this.definePersona("power_user", {
      name: "Power User",
      rules: [{ metric: "pageViews", operator: ">", value: 10 }],
    });

    this.definePersona("bouncer", {
      name: "Bouncer",
      rules: [{ metric: "sessionDuration", operator: "<", value: 30000 }],
    });
  }

  definePersona(id, config) {
    this.modules.personas.personas.set(id, {
      id,
      name: config.name,
      rules: config.rules,
      users: new Set(),
    });
  }

  analyzeUserPersona(userId) {
    const user = this.getUserProfile(userId);
    const personas = [];

    this.modules.personas.personas.forEach((persona, id) => {
      if (this.userMatchesPersona(user, persona)) {
        personas.push(id);
        persona.users.add(userId);
      }
    });

    return personas;
  }

  userMatchesPersona(user, persona) {
    return persona.rules.every((rule) => {
      const value = this.getUserMetricValue(user, rule.metric);

      switch (rule.operator) {
        case ">":
          return value > rule.value;
        case "<":
          return value < rule.value;
        case ">=":
          return value >= rule.value;
        case "<=":
          return value <= rule.value;
        case "=":
          return value === rule.value;
        default:
          return false;
      }
    });
  }

  getUserProfile(userId) {
    return {
      userId,
      pageViews: this.sessionData.pageViews,
      sessionDuration: Date.now() - this.sessionData.startTime,
      clicks: this.sessionData.clicks,
    };
  }

  getUserMetricValue(user, metric) {
    switch (metric) {
      case "pageViews":
        return user.pageViews;
      case "sessionDuration":
        return user.sessionDuration;
      case "clicks":
        return user.clicks;
      default:
        return 0;
    }
  }

  // ===================
  // DASHBOARD MODULE
  // ===================

  initDashboard() {
    this.modules.dashboard = {
      create: (containerId) => this.createDashboard(containerId),
    };
  }

  createDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = `
      <div class="standlog-dashboard">
        <h2>StandLog Analytics Dashboard</h2>
        <div class="metrics">
          <div class="metric">
            <h3>Page Views</h3>
            <span id="pageViews">${this.sessionData.pageViews}</span>
          </div>
          <div class="metric">
            <h3>Clicks</h3>
            <span id="clicks">${this.sessionData.clicks}</span>
          </div>
          <div class="metric">
            <h3>Session Duration</h3>
            <span id="duration">${Math.round(
              (Date.now() - this.sessionData.startTime) / 1000
            )}s</span>
          </div>
        </div>
        <div class="events">
          <h3>Recent Events</h3>
          <div id="eventsList"></div>
        </div>
      </div>
    `;

    this.updateDashboard(container);
    return container;
  }

  updateDashboard(container) {
    const eventsEl = container.querySelector("#eventsList");
    if (eventsEl) {
      eventsEl.innerHTML = this.events
        .slice(-10)
        .map(
          (event) =>
            `<div>${event.type} - ${new Date(
              event.timestamp
            ).toLocaleTimeString()}</div>`
        )
        .join("");
    }
  }

  // ===================
  // INTEGRATIONS MODULE
  // ===================

  initIntegrations() {
    this.modules.integrations = {
      exportData: (format) => this.exportData(format),
      sendToSlack: (webhookUrl, data) => this.sendToSlack(webhookUrl, data),
      sendToJira: (config, data) => this.sendToJira(config, data),
    };
  }

  exportData(format = "json") {
    const data = {
      session: this.sessionData,
      events: this.events,
      timestamp: Date.now(),
    };

    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);
      case "csv":
        return this.convertToCSV(data.events);
      default:
        throw new Error(`Format ${format} not supported`);
    }
  }

  convertToCSV(events) {
    const headers = ["timestamp", "type", "url"];
    const rows = [headers.join(",")];

    events.forEach((event) => {
      rows.push([event.timestamp, event.type, event.url || ""].join(","));
    });

    return rows.join("\n");
  }

  async sendToSlack(webhookUrl, data) {
    const message = {
      text: `StandLog Analytics Update`,
      attachments: [
        {
          title: "Session Data",
          fields: [
            {
              title: "Page Views",
              value: this.sessionData.pageViews,
              short: true,
            },
            { title: "Clicks", value: this.sessionData.clicks, short: true },
          ],
        },
      ],
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("Slack send failed:", error);
    }
  }

  // ===================
  // UTILITY METHODS
  // ===================

  addEvent(eventData) {
    this.events.push(eventData);

    if (this.config.debug) {
      console.log(`📊 Event added (${this.events.length}/5):`, eventData.type);
    }

    // Queue for sending (send every 5 events or on page unload)
    if (this.events.length >= 5) {
      if (this.config.debug) {
        console.log("🚀 Sending batch of 5 events...");
      }
      this.sendEvents();
    }
  }

  async sendEvents(isBeforeUnload = false) {
    if (this.events.length === 0) return;

    try {
      // First, ensure session exists
      await this.ensureSession();

      // Then send events
      const payload = {
        sessionId: this.sessionData.sessionId,
        events: this.events.map((event) => this.formatEventForAPI(event)),
      };

      if (this.config.debug) {
        console.log("📤 Sending payload to API:", payload);
        console.log("🌐 API URL:", `${ANALYTICS_API_URL}/event`);
      }

      await fetch(`${ANALYTICS_API_URL}/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: isBeforeUnload,
      });

      this.events = []; // Clear sent events
      if (this.config.debug) console.log("Events sent successfully");
    } catch (error) {
      if (this.config.debug) console.error("Failed to send events:", error);
    }
  }

  /**
   * Ensure session exists on server, create if needed
   */
  async ensureSession() {
    // Check if we've already created this session
    if (this.sessionCreated) return;

    const sessionData = {
      anonymousId: this.sessionData.anonymousId, // Using session-based anonymousId
      metadata: {
        device: this.getDeviceInfo(),
        browser: this.getBrowser(navigator.userAgent),
        os: this.getOS(navigator.userAgent),
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: screen.width,
          height: screen.height,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        initialUrl: window.location.href,
        initialTitle: document.title,
      },
    };

    try {
      const response = await fetch(`${ANALYTICS_API_URL}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const result = await response.json();
        // Update session ID if server returns a different one
        if (result.id) {
          this.sessionData.sessionId = result.id;
          localStorage.setItem("standlog_session", result.id);
        }
        this.sessionCreated = true;
        if (this.config.debug) console.log("Session created:", result);
      }
    } catch (error) {
      if (this.config.debug) console.error("Failed to create session:", error);
    }
  }

  /**
   * Format event data according to Prisma schema
   */
  formatEventForAPI(event) {
    return {
      type: event.type,
      metadata: {
        url: event.url || window.location.href,
        title: event.title || document.title,
        timestamp: event.timestamp,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        page: event.page || {
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
        },
      },
      data: this.extractEventData(event),
    };
  }

  /**
   * Extract relevant data from event based on type
   */
  extractEventData(event) {
    const baseData = {
      sessionId: event.sessionId,
      userId: event.userId,
      timestamp: event.timestamp,
    };

    switch (event.type) {
      case "click":
        return {
          ...baseData,
          coordinates: event.coordinates,
          element: event.element,
          viewport: event.viewport,
        };

      case "scroll":
        return {
          ...baseData,
          scroll: event.scroll,
          viewport: event.viewport,
        };

      case "pageview":
        return {
          ...baseData,
          page: event.page,
          device: event.device,
          viewport: event.viewport,
        };

      case "form_submit":
        return {
          ...baseData,
          form: event.form,
          page: event.page,
        };

      case "custom":
        return {
          ...baseData,
          name: event.name,
          properties: event.properties,
          page: event.page,
        };

      case "visibility_change":
        return {
          ...baseData,
          visible: event.visible,
          page: event.page,
        };

      default:
        return baseData;
    }
  }

  /**
   * Get OS from user agent
   */
  getOS(userAgent) {
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  }

  getElementInfo(element) {
    return {
      tagName: element.tagName?.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.trim().substring(0, 100),
    };
  }

  getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      type: /Mobile|Android|iPhone|iPad/.test(ua) ? "mobile" : "desktop",
      browser: this.getBrowser(ua),
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  getBrowser(userAgent) {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate or retrieve anonymous ID (session-based)
   */
  getAnonymousId() {
    let anonymousId = sessionStorage.getItem("standlog_anonymous");
    if (!anonymousId) {
      anonymousId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      sessionStorage.setItem("standlog_anonymous", anonymousId);
    }
    return anonymousId;
  }

  getUserId() {
    let userId = localStorage.getItem("standlog_user");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("standlog_user", userId);
    }
    return userId;
  }

  // ===================
  // PUBLIC API
  // ===================

  /**
   * Track custom event
   */
  track(eventName, properties = {}) {
    const customEvent = {
      type: "custom",
      name: eventName,
      properties,
      timestamp: Date.now(),
      url: window.location.href,
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
    };

    this.addEvent(customEvent);
  }

  /**
   * Create heatmap
   */
  createHeatmap(containerId, type = "click") {
    return this.modules.heatmaps?.createHeatmap(containerId, type);
  }

  /**
   * Define conversion funnel
   */
  defineFunnel(id, steps, options = {}) {
    return this.modules.funnels?.defineFunnel(id, steps, options);
  }

  /**
   * Create dashboard
   */
  createDashboard(containerId) {
    return this.modules.dashboard?.create(containerId);
  }

  /**
   * Export analytics data
   */
  exportData(format = "json") {
    return this.modules.integrations?.exportData(format);
  }

  /**
   * Get current analytics state
   */
  getAnalytics() {
    return {
      session: this.sessionData,
      events: this.events,
      modules: Object.keys(this.modules),
    };
  }
}

// ===================
// EASY INSTALLATION
// ===================

/**
 * Global StandLog API for easy integration
 */
window.StandLog = {
  /**
   * Initialize StandLog Analytics
   * @param {string} key - API key
   * @param {object} config - Configuration options
   */
  init: (key, config = {}) => {
    // Auto-detect API key from script tag if not provided
    if (!key) {
      const script = document.querySelector("[data-standlog-id]");
      if (script) {
        key = script.getAttribute("data-standlog-id");
      }
    }

    if (!key) {
      console.error("StandLog: API key required");
      return null;
    }

    // Initialize analytics instance
    const analytics = new StandLogAnalytics(key, config);

    // Expose global instance
    window.standlog = analytics;
    return analytics;
  },
};

// Auto-initialize if script tag with data-standlog-id is found
document.addEventListener("DOMContentLoaded", () => {
  const script = document.querySelector("[data-standlog-id]");
  if (script) {
    const key = script.getAttribute("data-standlog-id");
    const config = {};

    // Parse configuration from data attributes
    if (script.hasAttribute("data-debug")) {
      config.debug = script.getAttribute("data-debug") === "true";
    }

    if (script.hasAttribute("data-enable-heatmaps")) {
      config.enableHeatmaps =
        script.getAttribute("data-enable-heatmaps") === "true";
    }

    if (script.hasAttribute("data-enable-funnels")) {
      config.enableFunnels =
        script.getAttribute("data-enable-funnels") === "true";
    }

    if (script.hasAttribute("data-enable-personas")) {
      config.enablePersonas =
        script.getAttribute("data-enable-personas") === "true";
    }

    if (script.hasAttribute("data-enable-dashboard")) {
      config.enableDashboard =
        script.getAttribute("data-enable-dashboard") === "true";
    }

    if (script.hasAttribute("data-enable-integrations")) {
      config.enableIntegrations =
        script.getAttribute("data-enable-integrations") === "true";
    }

    // Initialize with detected settings
    window.StandLog.init(key, config);
  }
});

// Add basic CSS for dashboard components
const style = document.createElement("style");
style.innerHTML = `
  .standlog-dashboard {
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
  }
  
  .standlog-dashboard h2 {
    color: #333;
    margin-bottom: 20px;
  }
  
  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .metric {
    background: white;
    padding: 20px;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .metric h3 {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
    text-transform: uppercase;
  }
  
  .metric span {
    font-size: 2em;
    font-weight: bold;
    color: #2196F3;
  }
  
  .events {
    background: white;
    padding: 20px;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .events h3 {
    margin: 0 0 15px 0;
    color: #333;
  }
  
  #eventsList div {
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    font-size: 14px;
    color: #666;
  }
`;
document.head.appendChild(style);
