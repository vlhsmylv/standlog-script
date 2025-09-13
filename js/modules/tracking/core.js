/**
 * StandLog Analytics - Core Tracking Module
 * @author Valeh Ismayilov
 */

class StandLogTracker {
  constructor(key, config = {}) {
    this.key = key;
    this.config = {
      apiUrl: config.apiUrl || "",
      enableHeatmaps: config.enableHeatmaps !== false,
      enableFunnels: config.enableFunnels !== false,
      enablePersonas: config.enablePersonas !== false,
      enableRealTime: config.enableRealTime !== false,
      ...config,
    };
    this.sessionId = null;
    this.userId = null;
    this.events = [];
    this.init();
  }

  /**
   * Initialize tracking
   */
  async init() {
    await this.identifyUser();
    this.setupEventListeners();
    this.startTracking();
  }

  /**
   * Generate or retrieve user session
   */
  async identifyUser() {
    try {
      this.sessionId = this.generateSessionId();
      this.userId = this.getUserId();

      // Store in localStorage for persistence
      localStorage.setItem("standlog_session", this.sessionId);
      localStorage.setItem("standlog_user", this.userId);

      return { sessionId: this.sessionId, userId: this.userId };
    } catch (e) {
      console.error("StandLog: Failed to identify user", e);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or generate user ID
   */
  getUserId() {
    let userId = localStorage.getItem("standlog_user");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return userId;
  }

  /**
   * Setup core event listeners
   */
  setupEventListeners() {
    // Click tracking for heatmaps
    if (this.config.enableHeatmaps) {
      document.addEventListener("click", (e) => this.trackClick(e));
    }

    // Scroll tracking for heatmaps
    if (this.config.enableHeatmaps) {
      let scrollTimeout;
      window.addEventListener("scroll", () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => this.trackScroll(), 100);
      });
    }

    // Page view tracking
    this.trackPageView();

    // Form submissions for funnel tracking
    if (this.config.enableFunnels) {
      document.addEventListener("submit", (e) => this.trackFormSubmit(e));
    }

    // Visibility changes
    document.addEventListener("visibilitychange", () =>
      this.trackVisibilityChange()
    );
  }

  /**
   * Track click events
   */
  trackClick(event) {
    const element = event.target;
    const clickData = {
      type: "click",
      timestamp: Date.now(),
      element: this.getElementInfo(element),
      coordinates: {
        x: event.clientX,
        y: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      page: {
        url: window.location.href,
        title: document.title,
      },
    };

    this.addEvent(clickData);
  }

  /**
   * Track scroll events
   */
  trackScroll() {
    const scrollData = {
      type: "scroll",
      timestamp: Date.now(),
      scroll: {
        x: window.scrollX,
        y: window.scrollY,
        maxX: document.documentElement.scrollWidth - window.innerWidth,
        maxY: document.documentElement.scrollHeight - window.innerHeight,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      page: {
        url: window.location.href,
        title: document.title,
      },
    };

    this.addEvent(scrollData);
  }

  /**
   * Track page views
   */
  trackPageView() {
    const pageData = {
      type: "pageview",
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      device: this.getDeviceInfo(),
    };

    this.addEvent(pageData);
  }

  /**
   * Track form submissions
   */
  trackFormSubmit(event) {
    const form = event.target;
    const formData = {
      type: "form_submit",
      timestamp: Date.now(),
      form: {
        id: form.id,
        action: form.action,
        method: form.method,
        fields: this.getFormFields(form),
      },
      page: {
        url: window.location.href,
        title: document.title,
      },
    };

    this.addEvent(formData);
  }

  /**
   * Track visibility changes
   */
  trackVisibilityChange() {
    const visibilityData = {
      type: "visibility_change",
      timestamp: Date.now(),
      visible: !document.hidden,
      page: {
        url: window.location.href,
        title: document.title,
      },
    };

    this.addEvent(visibilityData);
  }

  /**
   * Get element information
   */
  getElementInfo(element) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.trim().substring(0, 100),
      attributes: this.getElementAttributes(element),
      selector: this.generateSelector(element),
    };
  }

  /**
   * Get element attributes
   */
  getElementAttributes(element) {
    const attrs = {};
    for (const attr of element.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  /**
   * Generate CSS selector for element
   */
  generateSelector(element) {
    if (element.id) return `#${element.id}`;

    let selector = element.tagName.toLowerCase();
    if (element.className) {
      selector += `.${element.className.split(" ").join(".")}`;
    }

    return selector;
  }

  /**
   * Get form field data
   */
  getFormFields(form) {
    const fields = [];
    const inputs = form.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      fields.push({
        name: input.name,
        type: input.type,
        value:
          input.type === "password"
            ? "[HIDDEN]"
            : input.value?.substring(0, 100),
      });
    });

    return fields;
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }

  /**
   * Add event to queue
   */
  addEvent(eventData) {
    eventData.sessionId = this.sessionId;
    eventData.userId = this.userId;
    eventData.projectId = this.key;

    this.events.push(eventData);

    // Send events if queue is full or after timeout
    if (this.events.length >= 10) {
      this.sendEvents();
    }
  }

  /**
   * Start periodic tracking
   */
  startTracking() {
    // Send events every 5 seconds
    setInterval(() => {
      if (this.events.length > 0) {
        this.sendEvents();
      }
    }, 5000);

    // Send events before page unload
    window.addEventListener("beforeunload", () => {
      this.sendEvents(true);
    });
  }

  /**
   * Send events to server
   */
  async sendEvents(isBeforeUnload = false) {
    if (this.events.length === 0) return;

    const payload = {
      events: [...this.events],
      meta: {
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/${this.key}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify(payload),
        keepalive: isBeforeUnload,
      });

      if (response.ok) {
        this.events = []; // Clear sent events
      }
    } catch (error) {
      console.error("StandLog: Failed to send events", error);
    }
  }

  /**
   * Track custom event
   */
  track(eventName, properties = {}) {
    const customEvent = {
      type: "custom",
      name: eventName,
      timestamp: Date.now(),
      properties,
      page: {
        url: window.location.href,
        title: document.title,
      },
    };

    this.addEvent(customEvent);
  }

  /**
   * Get current tracking state
   */
  getState() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventsQueued: this.events.length,
      config: this.config,
    };
  }
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = StandLogTracker;
} else {
  window.StandLogTracker = StandLogTracker;
}
