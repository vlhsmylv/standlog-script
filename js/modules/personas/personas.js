/**
 * StandLog Analytics - Personas Module
 * Categorize users and provide segmented analytics views
 */

class PersonaAnalyzer {
  constructor(config = {}) {
    this.config = {
      personas: [],
      autoSegment: true,
      updateInterval: 300000, // 5 minutes
      ...config,
    };

    this.users = new Map();
    this.segments = new Map();
    this.rules = new Map();

    this.initializeDefaultPersonas();

    if (this.config.autoSegment) {
      this.startAutoSegmentation();
    }
  }

  /**
   * Initialize default persona definitions
   */
  initializeDefaultPersonas() {
    // Power User
    this.definePersona("power_user", {
      name: "Power User",
      description: "Highly engaged users with frequent interactions",
      rules: [
        { metric: "pageViews", operator: ">", value: 10, timeframe: "session" },
        {
          metric: "sessionDuration",
          operator: ">",
          value: 300000,
          timeframe: "session",
        },
        {
          metric: "clickCount",
          operator: ">",
          value: 50,
          timeframe: "session",
        },
      ],
      color: "#4CAF50",
    });

    // Casual User
    this.definePersona("casual_user", {
      name: "Casual User",
      description: "Regular users with moderate engagement",
      rules: [
        {
          metric: "pageViews",
          operator: "between",
          value: [3, 10],
          timeframe: "session",
        },
        {
          metric: "sessionDuration",
          operator: "between",
          value: [60000, 300000],
          timeframe: "session",
        },
      ],
      color: "#2196F3",
    });

    // Bouncer
    this.definePersona("bouncer", {
      name: "Bouncer",
      description: "Users who leave quickly with minimal interaction",
      rules: [
        { metric: "pageViews", operator: "<=", value: 1, timeframe: "session" },
        {
          metric: "sessionDuration",
          operator: "<",
          value: 30000,
          timeframe: "session",
        },
      ],
      color: "#F44336",
    });

    // Mobile User
    this.definePersona("mobile_user", {
      name: "Mobile User",
      description: "Users primarily accessing via mobile devices",
      rules: [
        {
          metric: "deviceType",
          operator: "=",
          value: "mobile",
          timeframe: "session",
        },
        {
          metric: "mobileSessionRatio",
          operator: ">",
          value: 0.8,
          timeframe: "week",
        },
      ],
      color: "#FF9800",
    });

    // Converter
    this.definePersona("converter", {
      name: "Converter",
      description: "Users who complete conversion actions",
      rules: [
        {
          metric: "conversionEvents",
          operator: ">",
          value: 0,
          timeframe: "session",
        },
        {
          metric: "funnelCompletion",
          operator: "=",
          value: true,
          timeframe: "session",
        },
      ],
      color: "#9C27B0",
    });
  }

  /**
   * Define a new persona
   */
  definePersona(id, config) {
    const persona = {
      id,
      name: config.name,
      description: config.description,
      rules: config.rules || [],
      color: config.color || "#757575",
      icon: config.icon,
      created: Date.now(),
      ...config,
    };

    this.config.personas.push(persona);
    this.segments.set(id, {
      persona,
      users: new Set(),
      metrics: this.initializePersonaMetrics(),
    });

    return persona;
  }

  /**
   * Initialize metrics for a persona
   */
  initializePersonaMetrics() {
    return {
      totalUsers: 0,
      activeUsers: 0,
      avgSessionDuration: 0,
      avgPageViews: 0,
      conversionRate: 0,
      retentionRate: 0,
      topPages: [],
      commonDevices: [],
      timeDistribution: {},
      geographicDistribution: {},
    };
  }

  /**
   * Add user event for persona analysis
   */
  addUserEvent(userId, event) {
    // Get or create user profile
    if (!this.users.has(userId)) {
      this.users.set(userId, this.createUserProfile(userId));
    }

    const user = this.users.get(userId);
    this.updateUserProfile(user, event);

    // Analyze and update persona assignments
    this.analyzeUserPersona(user);
  }

  /**
   * Create new user profile
   */
  createUserProfile(userId) {
    return {
      id: userId,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      sessions: [],
      currentSession: null,
      personas: [],
      metrics: {
        totalSessions: 0,
        totalPageViews: 0,
        totalDuration: 0,
        totalClicks: 0,
        conversionEvents: 0,
        deviceTypes: {},
        browsers: {},
        locations: {},
        referrers: {},
        pages: {},
      },
      attributes: {},
    };
  }

  /**
   * Update user profile with new event
   */
  updateUserProfile(user, event) {
    user.lastSeen = event.timestamp;

    // Handle session management
    if (!user.currentSession || this.isNewSession(user.currentSession, event)) {
      this.startNewSession(user, event);
    }

    const session = user.currentSession;
    session.events.push(event);
    session.lastActivity = event.timestamp;

    // Update metrics based on event type
    switch (event.type) {
      case "pageview":
        user.metrics.totalPageViews++;
        session.pageViews++;
        this.updatePageMetrics(user, event);
        break;

      case "click":
        user.metrics.totalClicks++;
        session.clicks++;
        break;

      case "custom":
        if (event.name && event.name.includes("conversion")) {
          user.metrics.conversionEvents++;
          session.conversions++;
        }
        break;

      case "form_submit":
        session.formSubmissions++;
        break;
    }

    // Update device/browser info
    if (event.device) {
      this.updateDeviceMetrics(user, event.device);
    }

    // Calculate session duration
    session.duration = session.lastActivity - session.startTime;
    user.metrics.totalDuration = user.sessions.reduce(
      (total, s) => total + s.duration,
      0
    );
  }

  /**
   * Check if event represents a new session
   */
  isNewSession(currentSession, event) {
    const SESSION_TIMEOUT = 1800000; // 30 minutes
    return event.timestamp - currentSession.lastActivity > SESSION_TIMEOUT;
  }

  /**
   * Start new session for user
   */
  startNewSession(user, event) {
    // End current session if exists
    if (user.currentSession) {
      user.sessions.push(user.currentSession);
    }

    // Start new session
    user.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: event.timestamp,
      lastActivity: event.timestamp,
      duration: 0,
      pageViews: 0,
      clicks: 0,
      conversions: 0,
      formSubmissions: 0,
      events: [],
      entryPage: event.page?.url || event.url,
      device: event.device,
      referrer: event.page?.referrer,
    };

    user.metrics.totalSessions++;
  }

  /**
   * Update page-related metrics
   */
  updatePageMetrics(user, event) {
    const url = event.page?.url || event.url;
    if (url) {
      user.metrics.pages[url] = (user.metrics.pages[url] || 0) + 1;
    }

    const referrer = event.page?.referrer;
    if (referrer) {
      user.metrics.referrers[referrer] =
        (user.metrics.referrers[referrer] || 0) + 1;
    }
  }

  /**
   * Update device-related metrics
   */
  updateDeviceMetrics(user, device) {
    const deviceType = this.getDeviceType(device.userAgent);
    user.metrics.deviceTypes[deviceType] =
      (user.metrics.deviceTypes[deviceType] || 0) + 1;

    const browser = this.getBrowser(device.userAgent);
    user.metrics.browsers[browser] = (user.metrics.browsers[browser] || 0) + 1;
  }

  /**
   * Analyze user persona based on current metrics
   */
  analyzeUserPersona(user) {
    const currentPersonas = new Set(user.personas.map((p) => p.id));
    const newPersonas = new Set();

    this.config.personas.forEach((persona) => {
      if (this.userMatchesPersona(user, persona)) {
        newPersonas.add(persona.id);

        // Add to persona if not already assigned
        if (!currentPersonas.has(persona.id)) {
          user.personas.push({
            id: persona.id,
            assignedAt: Date.now(),
            confidence: this.calculatePersonaConfidence(user, persona),
          });

          this.segments.get(persona.id).users.add(user.id);
        }
      }
    });

    // Remove personas that no longer match
    user.personas = user.personas.filter((p) => {
      if (!newPersonas.has(p.id)) {
        this.segments.get(p.id).users.delete(user.id);
        return false;
      }
      return true;
    });

    this.updatePersonaMetrics();
  }

  /**
   * Check if user matches persona criteria
   */
  userMatchesPersona(user, persona) {
    return persona.rules.every((rule) => this.evaluateRule(user, rule));
  }

  /**
   * Evaluate a single persona rule
   */
  evaluateRule(user, rule) {
    const value = this.getUserMetric(user, rule.metric, rule.timeframe);

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
      case "!=":
        return value !== rule.value;
      case "between":
        return value >= rule.value[0] && value <= rule.value[1];
      case "in":
        return rule.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Get user metric value
   */
  getUserMetric(user, metric, timeframe = "all") {
    const session = user.currentSession;

    switch (metric) {
      case "pageViews":
        return timeframe === "session"
          ? session?.pageViews || 0
          : user.metrics.totalPageViews;

      case "sessionDuration":
        return timeframe === "session"
          ? session?.duration || 0
          : user.metrics.totalDuration / user.metrics.totalSessions;

      case "clickCount":
        return timeframe === "session"
          ? session?.clicks || 0
          : user.metrics.totalClicks;

      case "conversionEvents":
        return timeframe === "session"
          ? session?.conversions || 0
          : user.metrics.conversionEvents;

      case "deviceType":
        return this.getMostFrequentDevice(user);

      case "mobileSessionRatio":
        return this.getMobileSessionRatio(user, timeframe);

      case "funnelCompletion":
        return session?.conversions > 0;

      default:
        return 0;
    }
  }

  /**
   * Calculate persona confidence score
   */
  calculatePersonaConfidence(user, persona) {
    let score = 0;
    let totalRules = persona.rules.length;

    persona.rules.forEach((rule) => {
      const userValue = this.getUserMetric(user, rule.metric, rule.timeframe);
      const ruleValue = rule.value;

      // Calculate how well the user fits this rule (0-1 scale)
      let ruleScore = 0;

      if (rule.operator === ">" && userValue > ruleValue) {
        ruleScore = Math.min(1, userValue / (ruleValue * 2));
      } else if (rule.operator === "=" && userValue === ruleValue) {
        ruleScore = 1;
      }
      // Add more sophisticated confidence calculations as needed

      score += ruleScore;
    });

    return Math.round((score / totalRules) * 100);
  }

  /**
   * Get most frequent device type for user
   */
  getMostFrequentDevice(user) {
    const devices = user.metrics.deviceTypes;
    let maxCount = 0;
    let mostFrequent = "desktop";

    Object.entries(devices).forEach(([device, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = device;
      }
    });

    return mostFrequent;
  }

  /**
   * Get mobile session ratio for timeframe
   */
  getMobileSessionRatio(user, timeframe) {
    const mobileCount = user.metrics.deviceTypes.mobile || 0;
    const totalSessions = user.metrics.totalSessions;

    return totalSessions > 0 ? mobileCount / totalSessions : 0;
  }

  /**
   * Get device type from user agent
   */
  getDeviceType(userAgent) {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return "mobile";
    } else if (/Tablet/.test(userAgent)) {
      return "tablet";
    }
    return "desktop";
  }

  /**
   * Get browser from user agent
   */
  getBrowser(userAgent) {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  }

  /**
   * Update persona metrics
   */
  updatePersonaMetrics() {
    this.segments.forEach((segment, personaId) => {
      const users = Array.from(segment.users)
        .map((id) => this.users.get(id))
        .filter(Boolean);
      const metrics = segment.metrics;

      metrics.totalUsers = users.length;
      metrics.activeUsers = users.filter(
        (u) => Date.now() - u.lastSeen < 86400000 // Active in last 24 hours
      ).length;

      if (users.length > 0) {
        metrics.avgSessionDuration =
          users.reduce(
            (sum, u) => sum + u.metrics.totalDuration / u.metrics.totalSessions,
            0
          ) / users.length;

        metrics.avgPageViews =
          users.reduce(
            (sum, u) =>
              sum + u.metrics.totalPageViews / u.metrics.totalSessions,
            0
          ) / users.length;

        metrics.conversionRate =
          users.filter((u) => u.metrics.conversionEvents > 0).length /
          users.length;
      }
    });
  }

  /**
   * Get persona analysis for a specific persona
   */
  getPersonaAnalysis(personaId) {
    const segment = this.segments.get(personaId);
    if (!segment) return null;

    const users = Array.from(segment.users)
      .map((id) => this.users.get(id))
      .filter(Boolean);

    return {
      persona: segment.persona,
      metrics: segment.metrics,
      users: users.map((u) => ({
        id: u.id,
        firstSeen: u.firstSeen,
        lastSeen: u.lastSeen,
        totalSessions: u.metrics.totalSessions,
        confidence: u.personas.find((p) => p.id === personaId)?.confidence || 0,
      })),
      insights: this.generatePersonaInsights(segment, users),
    };
  }

  /**
   * Generate insights for persona
   */
  generatePersonaInsights(segment, users) {
    const insights = [];
    const metrics = segment.metrics;

    if (metrics.conversionRate > 0.1) {
      insights.push(
        `High conversion rate: ${(metrics.conversionRate * 100).toFixed(1)}%`
      );
    }

    if (metrics.avgSessionDuration > 300000) {
      insights.push("Users in this segment have long session durations");
    }

    if (metrics.totalUsers > 0) {
      const activeRatio = metrics.activeUsers / metrics.totalUsers;
      if (activeRatio > 0.5) {
        insights.push("High user engagement and activity");
      }
    }

    return insights;
  }

  /**
   * Get all personas summary
   */
  getAllPersonasAnalysis() {
    const analysis = {};

    this.segments.forEach((segment, personaId) => {
      analysis[personaId] = this.getPersonaAnalysis(personaId);
    });

    return analysis;
  }

  /**
   * Start automatic segmentation
   */
  startAutoSegmentation() {
    setInterval(() => {
      this.updatePersonaMetrics();
    }, this.config.updateInterval);
  }

  /**
   * Export persona data
   */
  exportPersonaData(format = "json") {
    const data = this.getAllPersonasAnalysis();

    if (format === "csv") {
      return this.convertPersonaToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert persona data to CSV
   */
  convertPersonaToCSV(data) {
    const headers = [
      "Persona",
      "Total Users",
      "Active Users",
      "Avg Session Duration",
      "Conversion Rate",
    ];
    const rows = [headers.join(",")];

    Object.values(data).forEach((persona) => {
      if (persona) {
        rows.push(
          [
            persona.persona.name,
            persona.metrics.totalUsers,
            persona.metrics.activeUsers,
            Math.round(persona.metrics.avgSessionDuration / 1000),
            `${(persona.metrics.conversionRate * 100).toFixed(1)}%`,
          ].join(",")
        );
      }
    });

    return rows.join("\n");
  }
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = PersonaAnalyzer;
} else {
  window.PersonaAnalyzer = PersonaAnalyzer;
}
