/**
 * StandLog Analytics - Funnels Module
 * Track user flows and analyze drop-off points
 */

class FunnelAnalyzer {
  constructor(config = {}) {
    this.config = {
      funnels: [],
      autoTrack: true,
      ...config,
    };
    this.events = [];
    this.funnelData = new Map();

    if (this.config.autoTrack) {
      this.setupAutoTracking();
    }
  }

  /**
   * Define a funnel with steps
   */
  defineFunnel(funnelId, steps, options = {}) {
    const funnel = {
      id: funnelId,
      name: options.name || funnelId,
      steps: steps.map((step, index) => ({
        id: step.id || `step_${index}`,
        name: step.name,
        url: step.url,
        event: step.event,
        selector: step.selector,
        order: index,
      })),
      options: {
        timeWindow: options.timeWindow || 3600000, // 1 hour default
        allowBacktrack: options.allowBacktrack || false,
        ...options,
      },
    };

    this.config.funnels.push(funnel);
    this.funnelData.set(funnelId, {
      funnel,
      sessions: new Map(),
      stats: this.initializeFunnelStats(funnel.steps.length),
    });

    return funnel;
  }

  /**
   * Initialize funnel statistics
   */
  initializeFunnelStats(stepCount) {
    const stats = {
      totalSessions: 0,
      completedSessions: 0,
      conversionRate: 0,
      steps: [],
    };

    for (let i = 0; i < stepCount; i++) {
      stats.steps.push({
        stepIndex: i,
        reached: 0,
        dropped: 0,
        conversionFromPrevious: 0,
        averageTimeToNext: 0,
        commonDropoffReasons: [],
      });
    }

    return stats;
  }

  /**
   * Setup automatic tracking
   */
  setupAutoTracking() {
    // Track page views for URL-based steps
    this.trackPageView = (url, title) => {
      this.addEvent({
        type: "pageview",
        url: url || window.location.href,
        title: title || document.title,
        timestamp: Date.now(),
      });
    };

    // Track clicks for selector-based steps
    document.addEventListener("click", (e) => {
      this.addEvent({
        type: "click",
        element: this.getElementInfo(e.target),
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Track form submissions
    document.addEventListener("submit", (e) => {
      this.addEvent({
        type: "form_submit",
        form: this.getFormInfo(e.target),
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Track custom events
    window.addEventListener("standlog_custom_event", (e) => {
      this.addEvent({
        type: "custom",
        name: e.detail.name,
        properties: e.detail.properties,
        timestamp: Date.now(),
        url: window.location.href,
      });
    });
  }

  /**
   * Add event to analysis queue
   */
  addEvent(event) {
    event.sessionId = this.getSessionId();
    event.userId = this.getUserId();

    this.events.push(event);
    this.analyzeEvent(event);
  }

  /**
   * Analyze event against all funnels
   */
  analyzeEvent(event) {
    this.config.funnels.forEach((funnel) => {
      this.checkFunnelStep(funnel, event);
    });
  }

  /**
   * Check if event matches any funnel step
   */
  checkFunnelStep(funnel, event) {
    const funnelData = this.funnelData.get(funnel.id);
    const sessionId = event.sessionId;

    // Get or create session data
    if (!funnelData.sessions.has(sessionId)) {
      funnelData.sessions.set(sessionId, {
        sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        currentStep: -1,
        completedSteps: [],
        events: [],
        status: "active",
      });
    }

    const session = funnelData.sessions.get(sessionId);
    session.events.push(event);

    // Check each step
    funnel.steps.forEach((step, stepIndex) => {
      if (this.eventMatchesStep(event, step)) {
        this.processStepCompletion(funnel, session, stepIndex, event);
      }
    });
  }

  /**
   * Check if event matches funnel step
   */
  eventMatchesStep(event, step) {
    // URL-based matching
    if (step.url) {
      if (event.type === "pageview" && event.url) {
        return this.urlMatches(event.url, step.url);
      }
    }

    // Event-based matching
    if (step.event) {
      if (event.type === "custom" && event.name === step.event) {
        return true;
      }
      if (event.type === step.event) {
        return true;
      }
    }

    // Selector-based matching
    if (step.selector && event.type === "click") {
      return this.elementMatchesSelector(event.element, step.selector);
    }

    return false;
  }

  /**
   * Process step completion
   */
  processStepCompletion(funnel, session, stepIndex, event) {
    const expectedStep = session.currentStep + 1;

    // Check if this is the next expected step
    if (stepIndex === expectedStep) {
      session.currentStep = stepIndex;
      session.completedSteps.push({
        stepIndex,
        timestamp: event.timestamp,
        event,
      });

      // Update statistics
      this.updateFunnelStats(funnel.id, session, stepIndex);

      // Check if funnel is complete
      if (stepIndex === funnel.steps.length - 1) {
        session.status = "completed";
        this.onFunnelComplete(funnel, session);
      }
    }
    // Handle backtracking if allowed
    else if (funnel.options.allowBacktrack && stepIndex < expectedStep) {
      // User went back in the funnel
      session.currentStep = stepIndex;
      this.onStepBacktrack(funnel, session, stepIndex);
    }
  }

  /**
   * Update funnel statistics
   */
  updateFunnelStats(funnelId, session, stepIndex) {
    const funnelData = this.funnelData.get(funnelId);
    const stats = funnelData.stats;

    // Update step reached count
    stats.steps[stepIndex].reached++;

    // Calculate conversion rates
    if (stepIndex > 0) {
      const previousStep = stats.steps[stepIndex - 1];
      stats.steps[stepIndex].conversionFromPrevious =
        (stats.steps[stepIndex].reached / previousStep.reached) * 100;
    }

    // Update overall stats
    if (stepIndex === 0) {
      stats.totalSessions++;
    }

    if (stepIndex === funnelData.funnel.steps.length - 1) {
      stats.completedSessions++;
      stats.conversionRate =
        (stats.completedSessions / stats.totalSessions) * 100;
    }
  }

  /**
   * Handle funnel completion
   */
  onFunnelComplete(funnel, session) {
    console.log(
      `Funnel ${funnel.name} completed by session ${session.sessionId}`
    );

    // Calculate completion time
    const completionTime =
      session.events[session.events.length - 1].timestamp - session.startTime;

    // Trigger custom event
    const completionEvent = new CustomEvent("standlog_funnel_complete", {
      detail: {
        funnelId: funnel.id,
        sessionId: session.sessionId,
        completionTime,
        steps: session.completedSteps,
      },
    });
    window.dispatchEvent(completionEvent);
  }

  /**
   * Handle step backtrack
   */
  onStepBacktrack(funnel, session, stepIndex) {
    console.log(`Step backtrack in funnel ${funnel.name}: step ${stepIndex}`);
  }

  /**
   * Get funnel analysis results
   */
  getFunnelAnalysis(funnelId) {
    const funnelData = this.funnelData.get(funnelId);
    if (!funnelData) {
      return null;
    }

    const analysis = {
      funnel: funnelData.funnel,
      stats: funnelData.stats,
      sessions: Array.from(funnelData.sessions.values()),
      dropoffAnalysis: this.analyzeDropoffs(funnelData),
      timeAnalysis: this.analyzeTimings(funnelData),
    };

    return analysis;
  }

  /**
   * Analyze dropoff points
   */
  analyzeDropoffs(funnelData) {
    const dropoffs = [];
    const stats = funnelData.stats;

    for (let i = 0; i < stats.steps.length - 1; i++) {
      const current = stats.steps[i];
      const next = stats.steps[i + 1];

      const dropoffCount = current.reached - next.reached;
      const dropoffRate = (dropoffCount / current.reached) * 100;

      dropoffs.push({
        fromStep: i,
        toStep: i + 1,
        dropoffCount,
        dropoffRate,
        insights: this.generateDropoffInsights(funnelData, i),
      });
    }

    return dropoffs;
  }

  /**
   * Analyze timing between steps
   */
  analyzeTimings(funnelData) {
    const timings = [];
    const sessions = Array.from(funnelData.sessions.values());

    sessions.forEach((session) => {
      for (let i = 0; i < session.completedSteps.length - 1; i++) {
        const currentStep = session.completedSteps[i];
        const nextStep = session.completedSteps[i + 1];

        const duration = nextStep.timestamp - currentStep.timestamp;

        timings.push({
          sessionId: session.sessionId,
          fromStep: i,
          toStep: i + 1,
          duration,
        });
      }
    });

    return this.aggregateTimings(timings);
  }

  /**
   * Aggregate timing data
   */
  aggregateTimings(timings) {
    const aggregated = {};

    timings.forEach((timing) => {
      const key = `${timing.fromStep}_${timing.toStep}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          fromStep: timing.fromStep,
          toStep: timing.toStep,
          durations: [],
        };
      }

      aggregated[key].durations.push(timing.duration);
    });

    // Calculate statistics for each step transition
    Object.values(aggregated).forEach((data) => {
      data.durations.sort((a, b) => a - b);
      data.average =
        data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
      data.median = data.durations[Math.floor(data.durations.length / 2)];
      data.min = data.durations[0];
      data.max = data.durations[data.durations.length - 1];
    });

    return Object.values(aggregated);
  }

  /**
   * Generate insights for dropoff points
   */
  generateDropoffInsights(funnelData, stepIndex) {
    // This would analyze common patterns in dropoff sessions
    return [
      "High dropoff rate detected",
      "Consider simplifying this step",
      "Average time spent: 2.3 minutes",
    ];
  }

  /**
   * Utility methods
   */
  urlMatches(eventUrl, stepUrl) {
    if (stepUrl.includes("*")) {
      const pattern = stepUrl.replace(/\*/g, ".*");
      return new RegExp(pattern).test(eventUrl);
    }
    return eventUrl.includes(stepUrl);
  }

  elementMatchesSelector(element, selector) {
    try {
      return (
        element.id === selector.replace("#", "") ||
        element.className.includes(selector.replace(".", "")) ||
        element.tagName.toLowerCase() === selector.toLowerCase()
      );
    } catch (e) {
      return false;
    }
  }

  getElementInfo(element) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.trim().substring(0, 50),
    };
  }

  getFormInfo(form) {
    return {
      id: form.id,
      action: form.action,
      method: form.method,
      fieldCount: form.elements.length,
    };
  }

  getSessionId() {
    return localStorage.getItem("standlog_session") || "anonymous";
  }

  getUserId() {
    return localStorage.getItem("standlog_user") || "anonymous";
  }

  /**
   * Export funnel data
   */
  exportFunnelData(funnelId, format = "json") {
    const analysis = this.getFunnelAnalysis(funnelId);

    if (format === "csv") {
      return this.convertToCSV(analysis);
    }

    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Convert to CSV format
   */
  convertToCSV(analysis) {
    const headers = ["Step", "Reached", "Conversion Rate", "Avg Time"];
    const rows = [headers.join(",")];

    analysis.stats.steps.forEach((step, index) => {
      rows.push(
        [
          `Step ${index + 1}`,
          step.reached,
          `${step.conversionFromPrevious}%`,
          `${step.averageTimeToNext}ms`,
        ].join(",")
      );
    });

    return rows.join("\n");
  }
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = FunnelAnalyzer;
} else {
  window.FunnelAnalyzer = FunnelAnalyzer;
}
