/**
 * StandLog Analytics - Integrations Module
 * Export data and integrate with external services
 */

class IntegrationsManager {
  constructor(config = {}) {
    this.config = {
      enabledIntegrations: [],
      exportFormats: ["json", "csv", "pdf"],
      ...config,
    };

    this.integrations = new Map();
    this.exporters = new Map();

    this.initializeIntegrations();
    this.initializeExporters();
  }

  /**
   * Initialize available integrations
   */
  initializeIntegrations() {
    // Slack Integration
    this.registerIntegration("slack", new SlackIntegration());

    // Jira Integration
    this.registerIntegration("jira", new JiraIntegration());

    // Email Integration
    this.registerIntegration("email", new EmailIntegration());

    // Webhook Integration
    this.registerIntegration("webhook", new WebhookIntegration());
  }

  /**
   * Initialize data exporters
   */
  initializeExporters() {
    this.exporters.set("json", new JSONExporter());
    this.exporters.set("csv", new CSVExporter());
    this.exporters.set("pdf", new PDFExporter());
    this.exporters.set("excel", new ExcelExporter());
  }

  /**
   * Register a new integration
   */
  registerIntegration(name, integration) {
    this.integrations.set(name, integration);
  }

  /**
   * Configure integration
   */
  configureIntegration(name, config) {
    const integration = this.integrations.get(name);
    if (integration) {
      integration.configure(config);
      return true;
    }
    return false;
  }

  /**
   * Send data to integration
   */
  async sendToIntegration(integrationName, data, options = {}) {
    const integration = this.integrations.get(integrationName);
    if (!integration) {
      throw new Error(`Integration ${integrationName} not found`);
    }

    try {
      return await integration.send(data, options);
    } catch (error) {
      console.error(`Failed to send to ${integrationName}:`, error);
      throw error;
    }
  }

  /**
   * Export data in specified format
   */
  async exportData(format, data, options = {}) {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`Export format ${format} not supported`);
    }

    try {
      return await exporter.export(data, options);
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
      throw error;
    }
  }

  /**
   * Get available integrations
   */
  getAvailableIntegrations() {
    return Array.from(this.integrations.keys());
  }

  /**
   * Get available export formats
   */
  getAvailableExportFormats() {
    return Array.from(this.exporters.keys());
  }
}

/**
 * Slack Integration
 */
class SlackIntegration {
  constructor() {
    this.webhookUrl = null;
    this.channel = null;
    this.username = "StandLog Analytics";
  }

  configure(config) {
    this.webhookUrl = config.webhookUrl;
    this.channel = config.channel;
    this.username = config.username || this.username;
  }

  async send(data, options = {}) {
    if (!this.webhookUrl) {
      throw new Error("Slack webhook URL not configured");
    }

    const message = this.formatSlackMessage(data, options);

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true, platform: "slack" };
  }

  formatSlackMessage(data, options) {
    const message = {
      username: this.username,
      channel: this.channel,
    };

    if (options.type === "alert") {
      message.attachments = [
        {
          color: this.getAlertColor(data.level),
          title: `🚨 Analytics Alert: ${data.title}`,
          text: data.message,
          fields: [
            {
              title: "Metric",
              value: data.metric,
              short: true,
            },
            {
              title: "Value",
              value: data.value,
              short: true,
            },
            {
              title: "Time",
              value: new Date(data.timestamp).toLocaleString(),
              short: true,
            },
          ],
          footer: "StandLog Analytics",
          ts: Math.floor(data.timestamp / 1000),
        },
      ];
    } else if (options.type === "report") {
      message.attachments = [
        {
          color: "#2196F3",
          title: `📊 Analytics Report: ${data.title}`,
          text: data.summary,
          fields: this.formatReportFields(data.metrics),
          footer: "StandLog Analytics",
          ts: Math.floor(Date.now() / 1000),
        },
      ];
    } else {
      message.text = `StandLog Analytics Data: ${JSON.stringify(
        data,
        null,
        2
      )}`;
    }

    return message;
  }

  getAlertColor(level) {
    switch (level) {
      case "critical":
        return "#F44336";
      case "warning":
        return "#FF9800";
      case "info":
        return "#2196F3";
      default:
        return "#757575";
    }
  }

  formatReportFields(metrics) {
    return Object.entries(metrics).map(([key, value]) => ({
      title: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof value === "number" ? value.toLocaleString() : value,
      short: true,
    }));
  }
}

/**
 * Jira Integration
 */
class JiraIntegration {
  constructor() {
    this.baseUrl = null;
    this.username = null;
    this.apiToken = null;
    this.projectKey = null;
  }

  configure(config) {
    this.baseUrl = config.baseUrl;
    this.username = config.username;
    this.apiToken = config.apiToken;
    this.projectKey = config.projectKey;
  }

  async send(data, options = {}) {
    if (!this.baseUrl || !this.username || !this.apiToken) {
      throw new Error("Jira credentials not configured");
    }

    const issue = this.formatJiraIssue(data, options);

    const auth = btoa(`${this.username}:${this.apiToken}`);

    const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(issue),
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, platform: "jira", issueKey: result.key };
  }

  formatJiraIssue(data, options) {
    const issue = {
      fields: {
        project: { key: this.projectKey },
        issuetype: { name: "Task" },
        summary: `Analytics Alert: ${data.title || "Data Issue"}`,
        description: this.formatJiraDescription(data, options),
      },
    };

    if (options.type === "alert" && data.level === "critical") {
      issue.fields.priority = { name: "High" };
    }

    return issue;
  }

  formatJiraDescription(data, options) {
    let description = "";

    if (options.type === "alert") {
      description = `
h3. Alert Details
* *Metric:* ${data.metric}
* *Value:* ${data.value}
* *Threshold:* ${data.threshold}
* *Time:* ${new Date(data.timestamp).toLocaleString()}

h3. Message
${data.message}

h3. Raw Data
{code:json}
${JSON.stringify(data, null, 2)}
{code}
      `;
    } else {
      description = `
h3. Analytics Data Export

{code:json}
${JSON.stringify(data, null, 2)}
{code}
      `;
    }

    return description.trim();
  }
}

/**
 * Email Integration
 */
class EmailIntegration {
  constructor() {
    this.apiKey = null;
    this.fromEmail = null;
    this.service = "sendgrid"; // Default service
  }

  configure(config) {
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.service = config.service || this.service;
  }

  async send(data, options = {}) {
    if (!this.apiKey || !this.fromEmail) {
      throw new Error("Email service not configured");
    }

    const email = this.formatEmail(data, options);

    switch (this.service) {
      case "sendgrid":
        return await this.sendWithSendGrid(email);
      case "mailgun":
        return await this.sendWithMailgun(email);
      default:
        throw new Error(`Email service ${this.service} not supported`);
    }
  }

  formatEmail(data, options) {
    return {
      to: options.recipients || [],
      subject:
        options.subject || `StandLog Analytics: ${data.title || "Data Export"}`,
      html: this.generateEmailHTML(data, options),
      text: this.generateEmailText(data, options),
    };
  }

  generateEmailHTML(data, options) {
    if (options.type === "alert") {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #F44336;">🚨 Analytics Alert</h2>
          <h3>${data.title}</h3>
          <p>${data.message}</p>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Metric</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                data.metric
              }</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Value</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
                data.value
              }</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Time</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">${new Date(
                data.timestamp
              ).toLocaleString()}</td>
            </tr>
          </table>
        </div>
      `;
    } else {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #2196F3;">📊 Analytics Report</h2>
          <p>Please find your analytics data export attached.</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `;
    }
  }

  generateEmailText(data, options) {
    if (options.type === "alert") {
      return `
StandLog Analytics Alert

${data.title}
${data.message}

Metric: ${data.metric}
Value: ${data.value}
Time: ${new Date(data.timestamp).toLocaleString()}
      `.trim();
    } else {
      return "Analytics data export - see attached file.";
    }
  }

  async sendWithSendGrid(email) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: email.to.map((addr) => ({ email: addr })),
          },
        ],
        from: { email: this.fromEmail },
        subject: email.subject,
        content: [
          { type: "text/plain", value: email.text },
          { type: "text/html", value: email.html },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }

    return { success: true, platform: "email", service: "sendgrid" };
  }

  async sendWithMailgun(email) {
    // Mailgun implementation would go here
    throw new Error("Mailgun integration not implemented");
  }
}

/**
 * Webhook Integration
 */
class WebhookIntegration {
  constructor() {
    this.webhookUrl = null;
    this.headers = {};
    this.method = "POST";
  }

  configure(config) {
    this.webhookUrl = config.webhookUrl;
    this.headers = config.headers || {};
    this.method = config.method || "POST";
  }

  async send(data, options = {}) {
    if (!this.webhookUrl) {
      throw new Error("Webhook URL not configured");
    }

    const payload = {
      timestamp: Date.now(),
      source: "standlog-analytics",
      type: options.type || "data",
      data: data,
    };

    const response = await fetch(this.webhookUrl, {
      method: this.method,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`);
    }

    return { success: true, platform: "webhook" };
  }
}

/**
 * JSON Exporter
 */
class JSONExporter {
  async export(data, options = {}) {
    const exported = {
      metadata: {
        exportedAt: new Date().toISOString(),
        format: "json",
        version: "1.0",
        ...options.metadata,
      },
      data: data,
    };

    const json = JSON.stringify(exported, null, options.pretty ? 2 : 0);

    if (options.download) {
      this.downloadFile(
        json,
        `analytics-export-${Date.now()}.json`,
        "application/json"
      );
    }

    return json;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * CSV Exporter
 */
class CSVExporter {
  async export(data, options = {}) {
    let csv = "";

    if (Array.isArray(data)) {
      csv = this.arrayToCSV(data, options);
    } else if (typeof data === "object") {
      csv = this.objectToCSV(data, options);
    } else {
      throw new Error("Unsupported data format for CSV export");
    }

    if (options.download) {
      this.downloadFile(csv, `analytics-export-${Date.now()}.csv`, "text/csv");
    }

    return csv;
  }

  arrayToCSV(data, options) {
    if (data.length === 0) return "";

    const headers = options.headers || Object.keys(data[0]);
    const rows = [headers.join(",")];

    data.forEach((item) => {
      const row = headers.map((header) => {
        const value = item[header] || "";
        return typeof value === "string" && value.includes(",")
          ? `"${value}"`
          : value;
      });
      rows.push(row.join(","));
    });

    return rows.join("\n");
  }

  objectToCSV(data, options) {
    const rows = ["Key,Value"];

    Object.entries(data).forEach(([key, value]) => {
      const csvValue =
        typeof value === "object" ? JSON.stringify(value) : value;
      rows.push(`${key},"${csvValue}"`);
    });

    return rows.join("\n");
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * PDF Exporter
 */
class PDFExporter {
  async export(data, options = {}) {
    // This would typically use a library like jsPDF
    // For demo purposes, we'll create a simple text-based PDF

    const content = this.generatePDFContent(data, options);

    if (options.download) {
      // In a real implementation, you'd use a PDF library here
      console.log("PDF export would be generated here");

      // For demo, download as text file
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-export-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return content;
  }

  generatePDFContent(data, options) {
    let content = `
StandLog Analytics Report
Generated: ${new Date().toLocaleString()}
${options.title ? `Title: ${options.title}` : ""}

===========================================

`;

    if (Array.isArray(data)) {
      content += "Data Records:\n\n";
      data.forEach((item, index) => {
        content += `Record ${index + 1}:\n`;
        Object.entries(item).forEach(([key, value]) => {
          content += `  ${key}: ${value}\n`;
        });
        content += "\n";
      });
    } else if (typeof data === "object") {
      content += "Data Summary:\n\n";
      Object.entries(data).forEach(([key, value]) => {
        content += `${key}: ${
          typeof value === "object" ? JSON.stringify(value) : value
        }\n`;
      });
    }

    return content;
  }
}

/**
 * Excel Exporter
 */
class ExcelExporter {
  async export(data, options = {}) {
    // This would typically use a library like SheetJS
    // For demo purposes, we'll export as CSV with .xlsx extension

    const csvExporter = new CSVExporter();
    const csv = await csvExporter.export(data, { ...options, download: false });

    if (options.download) {
      const blob = new Blob([csv], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-export-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return csv;
  }
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    IntegrationsManager,
    SlackIntegration,
    JiraIntegration,
    EmailIntegration,
    WebhookIntegration,
    JSONExporter,
    CSVExporter,
    PDFExporter,
    ExcelExporter,
  };
} else {
  window.IntegrationsManager = IntegrationsManager;
  window.SlackIntegration = SlackIntegration;
  window.JiraIntegration = JiraIntegration;
  window.EmailIntegration = EmailIntegration;
  window.WebhookIntegration = WebhookIntegration;
}
