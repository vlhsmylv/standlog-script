/**
 * StandLog Analytics - Heatmaps Module
 * Interactive click & scroll heatmaps with zoom/pan functionality
 */

class HeatmapRenderer {
  constructor(container, data, options = {}) {
    this.container = container;
    this.data = data;
    this.options = {
      type: "click", // 'click' or 'scroll'
      maxIntensity: 100,
      radius: 25,
      blur: 15,
      gradient: {
        0.0: "blue",
        0.3: "cyan",
        0.5: "lime",
        0.7: "yellow",
        1.0: "red",
      },
      ...options,
    };

    this.canvas = null;
    this.ctx = null;
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.lastPanPoint = { x: 0, y: 0 };

    this.init();
  }

  /**
   * Initialize heatmap
   */
  init() {
    this.createCanvas();
    this.setupInteractions();
    this.render();
  }

  /**
   * Create canvas element
   */
  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.pointerEvents = "auto";
    this.canvas.style.zIndex = "1000";
    this.canvas.style.cursor = "grab";

    this.ctx = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  /**
   * Setup zoom and pan interactions
   */
  setupInteractions() {
    // Zoom with mouse wheel
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const zoom = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(zoom, x, y);
    });

    // Pan with mouse drag
    this.canvas.addEventListener("mousedown", (e) => {
      this.isPanning = true;
      this.canvas.style.cursor = "grabbing";
      this.lastPanPoint = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isPanning) return;

      const deltaX = e.clientX - this.lastPanPoint.x;
      const deltaY = e.clientY - this.lastPanPoint.y;

      this.panX += deltaX;
      this.panY += deltaY;

      this.lastPanPoint = { x: e.clientX, y: e.clientY };
      this.render();
    });

    document.addEventListener("mouseup", () => {
      this.isPanning = false;
      this.canvas.style.cursor = "grab";
    });

    // Touch support for mobile
    this.setupTouchEvents();
  }

  /**
   * Setup touch events for mobile
   */
  setupTouchEvents() {
    let lastTouchDistance = 0;

    this.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.lastPanPoint = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        const distance = this.getTouchDistance(e.touches[0], e.touches[1]);
        lastTouchDistance = distance;
      }
    });

    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();

      if (e.touches.length === 1 && this.isPanning) {
        const deltaX = e.touches[0].clientX - this.lastPanPoint.x;
        const deltaY = e.touches[0].clientY - this.lastPanPoint.y;

        this.panX += deltaX;
        this.panY += deltaY;

        this.lastPanPoint = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        this.render();
      } else if (e.touches.length === 2) {
        const distance = this.getTouchDistance(e.touches[0], e.touches[1]);
        const zoom = distance / lastTouchDistance;

        const rect = this.canvas.getBoundingClientRect();
        const centerX =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const centerY =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        this.zoom(zoom, centerX, centerY);
        lastTouchDistance = distance;
      }
    });

    this.canvas.addEventListener("touchend", () => {
      this.isPanning = false;
    });
  }

  /**
   * Get distance between two touch points
   */
  getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Zoom functionality
   */
  zoom(factor, centerX, centerY) {
    const newScale = Math.max(0.1, Math.min(5, this.scale * factor));

    // Adjust pan to zoom towards cursor
    const scaleDelta = newScale / this.scale;
    this.panX = centerX - (centerX - this.panX) * scaleDelta;
    this.panY = centerY - (centerY - this.panY) * scaleDelta;

    this.scale = newScale;
    this.render();
  }

  /**
   * Resize canvas to container
   */
  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.render();
  }

  /**
   * Render heatmap
   */
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    // Apply transformations
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.scale, this.scale);

    if (this.options.type === "click") {
      this.renderClickHeatmap();
    } else if (this.options.type === "scroll") {
      this.renderScrollHeatmap();
    }

    // Restore context state
    this.ctx.restore();

    this.renderControls();
  }

  /**
   * Render click heatmap
   */
  renderClickHeatmap() {
    const gradient = this.createRadialGradient();

    this.data.forEach((point) => {
      if (point.type === "click" && point.coordinates) {
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(
          1,
          point.intensity / this.options.maxIntensity
        );
        this.ctx.fillStyle = gradient;
        this.ctx.translate(point.coordinates.pageX, point.coordinates.pageY);
        this.ctx.fillRect(
          -this.options.radius,
          -this.options.radius,
          this.options.radius * 2,
          this.options.radius * 2
        );
        this.ctx.restore();
      }
    });
  }

  /**
   * Render scroll heatmap
   */
  renderScrollHeatmap() {
    // Group scroll data by Y position
    const scrollMap = {};

    this.data.forEach((point) => {
      if (point.type === "scroll" && point.scroll) {
        const y = Math.floor(point.scroll.y / 50) * 50; // Group by 50px segments
        scrollMap[y] = (scrollMap[y] || 0) + 1;
      }
    });

    // Find max intensity for normalization
    const maxScrollIntensity = Math.max(...Object.values(scrollMap));

    // Render scroll bars
    Object.entries(scrollMap).forEach(([y, intensity]) => {
      const normalizedIntensity = intensity / maxScrollIntensity;
      const alpha = Math.min(1, normalizedIntensity);

      this.ctx.fillStyle = this.getColorForIntensity(normalizedIntensity);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(0, parseInt(y), this.canvas.width / this.scale, 50);
    });
  }

  /**
   * Create radial gradient for click points
   */
  createRadialGradient() {
    const gradient = this.ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      this.options.radius
    );

    Object.entries(this.options.gradient).forEach(([stop, color]) => {
      gradient.addColorStop(parseFloat(stop), color);
    });

    return gradient;
  }

  /**
   * Get color for intensity level
   */
  getColorForIntensity(intensity) {
    const colors = Object.entries(this.options.gradient);

    for (let i = 0; i < colors.length - 1; i++) {
      const [stop1, color1] = colors[i];
      const [stop2, color2] = colors[i + 1];

      if (intensity >= parseFloat(stop1) && intensity <= parseFloat(stop2)) {
        return color2; // Simplified - could interpolate between colors
      }
    }

    return colors[colors.length - 1][1];
  }

  /**
   * Render zoom/pan controls
   */
  renderControls() {
    // Reset button
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(10, 10, 80, 30);
    this.ctx.fillStyle = "white";
    this.ctx.font = "12px Arial";
    this.ctx.fillText("Reset View", 15, 28);

    // Zoom level indicator
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(100, 10, 100, 30);
    this.ctx.fillStyle = "white";
    this.ctx.fillText(`Zoom: ${Math.round(this.scale * 100)}%`, 105, 28);

    // Add click handler for reset button
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 10 && x <= 90 && y >= 10 && y <= 40) {
        this.resetView();
      }
    });
  }

  /**
   * Reset view to default
   */
  resetView() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.render();
  }

  /**
   * Update heatmap data
   */
  updateData(newData) {
    this.data = newData;
    this.render();
  }

  /**
   * Change heatmap type
   */
  setType(type) {
    this.options.type = type;
    this.render();
  }

  /**
   * Destroy heatmap
   */
  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Heatmap Manager Class
class HeatmapManager {
  constructor() {
    this.heatmaps = new Map();
    this.data = [];
  }

  /**
   * Create heatmap for container
   */
  createHeatmap(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return null;
    }

    const heatmap = new HeatmapRenderer(container, data, options);
    this.heatmaps.set(containerId, heatmap);
    return heatmap;
  }

  /**
   * Remove heatmap
   */
  removeHeatmap(containerId) {
    const heatmap = this.heatmaps.get(containerId);
    if (heatmap) {
      heatmap.destroy();
      this.heatmaps.delete(containerId);
    }
  }

  /**
   * Update all heatmaps with new data
   */
  updateAllHeatmaps(data) {
    this.data = data;
    this.heatmaps.forEach((heatmap) => {
      heatmap.updateData(data);
    });
  }

  /**
   * Get heatmap instance
   */
  getHeatmap(containerId) {
    return this.heatmaps.get(containerId);
  }
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { HeatmapRenderer, HeatmapManager };
} else {
  window.HeatmapRenderer = HeatmapRenderer;
  window.HeatmapManager = HeatmapManager;
}
