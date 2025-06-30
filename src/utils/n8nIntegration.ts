
// n8n Workflow Integration Utility
interface N8nWebhookConfig {
  webhookUrl: string;
  workflowId?: string;
  authToken?: string;
}

interface N8nPayload {
  [key: string]: any;
}

export class N8nIntegration {
  private config: N8nWebhookConfig;

  constructor(config: N8nWebhookConfig) {
    this.config = config;
  }

  // Trigger n8n workflow via webhook
  async triggerWorkflow(payload: N8nPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          workflowId: this.config.workflowId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('n8n workflow trigger error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Send incident data to n8n for processing
  async processIncident(incidentData: {
    id: string;
    title: string;
    description: string;
    priority: string;
    category: string;
    userId: string;
  }): Promise<{ success: boolean; workflowResponse?: any; error?: string }> {
    return await this.triggerWorkflow({
      event: 'incident_created',
      incident: incidentData,
      source: 'authexa_support'
    });
  }

  // Send user authentication events to n8n
  async logAuthEvent(authData: {
    userId: string;
    email: string;
    event: 'login' | 'logout' | 'mfa_success' | 'mfa_failed';
    ip?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; workflowResponse?: any; error?: string }> {
    return await this.triggerWorkflow({
      event: 'auth_event',
      auth: authData,
      source: 'authexa_support'
    });
  }

  // Send system metrics to n8n
  async sendMetrics(metrics: {
    name: string;
    value: number;
    unit: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; workflowResponse?: any; error?: string }> {
    return await this.triggerWorkflow({
      event: 'system_metric',
      metric: metrics,
      source: 'authexa_support'
    });
  }
}

// Usage example:
// const n8nClient = new N8nIntegration({
//   webhookUrl: 'https://your-n8n-instance.com/webhook/your-webhook-id',
//   workflowId: 'your-workflow-id',
//   authToken: 'your-auth-token' // optional
// });

// Export default instance (configure with your n8n details)
export const defaultN8nClient = new N8nIntegration({
  webhookUrl: process.env.VITE_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/default',
  workflowId: process.env.VITE_N8N_WORKFLOW_ID,
  authToken: process.env.VITE_N8N_AUTH_TOKEN
});
