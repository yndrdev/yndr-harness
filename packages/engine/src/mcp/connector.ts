/**
 * MCP Server connector.
 * Connects to MCP servers declared in playbook configs.
 * Post-MVP: will integrate with Agent SDK's MCP support.
 */

export interface MCPServerConfig {
  name: string;
  url: string;
  transport: "stdio" | "sse";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPConnection {
  name: string;
  status: "connected" | "disconnected" | "error";
  tools: string[];
}

/**
 * Placeholder MCP connector.
 * Will be implemented with Agent SDK MCP support in Sprint 4.
 */
export class MCPConnector {
  private connections = new Map<string, MCPConnection>();

  async connect(config: MCPServerConfig): Promise<MCPConnection> {
    // TODO: Implement actual MCP connection via Agent SDK
    const connection: MCPConnection = {
      name: config.name,
      status: "connected",
      tools: [],
    };
    this.connections.set(config.name, connection);
    return connection;
  }

  async disconnect(name: string): Promise<void> {
    this.connections.delete(name);
  }

  async disconnectAll(): Promise<void> {
    this.connections.clear();
  }

  getConnection(name: string): MCPConnection | undefined {
    return this.connections.get(name);
  }

  getAllConnections(): MCPConnection[] {
    return [...this.connections.values()];
  }
}
