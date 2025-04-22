import { getTool } from "../decorators";
import { Tool, ToolCall } from "../types";

interface ModelOptions {
  promptCallback?: (text: string) => void;
  updateCallback?: () => void;
  exitCallback?: () => void;
}

export class Model {
  private tools: Tool[] = [];

  private promptCallback?: (text: string) => void;
  private updateCallback?: () => void;
  private exitCallback?: () => void;

  constructor(options: ModelOptions) {
    this.promptCallback = options.promptCallback;
    this.updateCallback = options.updateCallback;
    this.exitCallback = options.exitCallback;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prompt(...messages: any[]) {
    const text = messages
      .flat()
      .map((message) => String(message))
      .join("\n");

    if (this.promptCallback) {
      this.promptCallback(text);
    }
  }

  state(func: Function, description: string) {
    const tool = getTool("state", func, description);
    this.addTool(tool);
  }

  action(func: Function, description: string) {
    const tool = getTool("action", func, description);
    this.addTool(tool);
  }

  exit() {
    if (this.exitCallback) {
      this.exitCallback();
    }
  }

  getTools(): Tool[] {
    return this.tools;
  }

  reset() {
    this.tools = [];
  }

  getFunction(toolCall: ToolCall): () => Promise<unknown> {
    const tool = this.tools.find((tool) => tool.schema.name === toolCall.name);

    if (!tool) {
      throw new Error(`Tool '${toolCall.name}' not found`);
    }

    // Generate ordered arguments based on the tool's parameter list
    const parameters = Object.keys(tool.schema.parameters.properties);

    let unorderedArguments: Record<string, unknown> = {};
    let orderedArguments: unknown[] = [];

    if (parameters.length > 0) {
      try {
        unorderedArguments = JSON.parse(toolCall.arguments);
      } catch {
        throw new Error(`Tool call '${toolCall.name}' cannot parse arguments '${toolCall.arguments}'`);
      }

      // Reorder incoming arguments according to the tool's parameter list
      orderedArguments = parameters.map((parameter) => {
        const result = unorderedArguments[parameter];

        // Make sure required arguments are provided
        if (result === undefined) {
          if (tool.schema.parameters.required.includes(parameter)) {
            throw new Error(`Tool call '${toolCall.name}' is missing required argument '${parameter}'`);
          }
        }

        return result;
      });
    }

    // Return a closure that will execute the tool with its arguments
    return async () => {
      if (tool.type === "state") {
        this.reset();
      }

      return await tool.func(this, ...orderedArguments);
    };
  }

  private addTool(tool: Tool) {
    const previousToolIndex = this.tools.findIndex(
      (previousTool) => previousTool.schema.name === tool.schema.name,
    );

    if (previousToolIndex !== -1) {
      this.tools.splice(previousToolIndex, 1);
    }

    this.tools.push(tool);

    if (this.updateCallback) {
      this.updateCallback();
    }
  }
}
