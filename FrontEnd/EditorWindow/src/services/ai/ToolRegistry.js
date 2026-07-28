/**
 * ToolRegistry manages the modular tools available to the AI.
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  registerTool(tool) {
    if (!tool.name || !tool.description || !tool.execute) {
      throw new Error("Invalid tool: must have name, description, and execute method.");
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  getAllTools() {
    return Array.from(this.tools.values());
  }

  // Normalizes schemas to standard JSON Schema
  _normalizeSchema(schema) {
    if (!schema) return undefined;
    const normalized = { ...schema };
    if (normalized.type) {
      // Standard JSON schema uses lowercase types
      normalized.type = typeof normalized.type === 'string' ? normalized.type.toLowerCase() : normalized.type;
    }
    if (normalized.properties) {
      const props = {};
      for (const [key, prop] of Object.entries(normalized.properties)) {
        props[key] = this._normalizeSchema(prop);
      }
      normalized.properties = props;
    }
    if (normalized.items) {
      normalized.items = this._normalizeSchema(normalized.items);
    }
    return normalized;
  }

  /** Schemas for a chosen subset (see ToolRouter), not the whole registry. */
  getSchemasFor(tools) {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: this._normalizeSchema(tool.parameters || { type: "object", properties: {} })
    }));
  }

  getToolSchemas() {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: this._normalizeSchema(tool.parameters || { type: "object", properties: {} })
    }));
  }
}

export const toolRegistry = new ToolRegistry();
