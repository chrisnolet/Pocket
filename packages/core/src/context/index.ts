import { ZodType, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getTool } from "../decorators";
import { Tool, ToolCall } from "../types";

interface ContextOptions {
  promptCallback?: (text: string) => void;
  toolsCallback?: (tools: Tool[]) => void;
  displayCallback?: (text: string) => void;
  eventCallback?: (event: string, ...messages: any[]) => void;
  exitCallback?: () => void;
  workerCallback?: <T>(jsonSchema: Record<string, unknown>, text: string) => Promise<T>;
  isDebug?: boolean;
}

export class Context {
  private prompts: string[] = [];
  private tools: Tool[] = [];
  private displays: string[] = [];
  private isUpdatingTools = false;

  private promptCallback?: (text: string) => void;
  private toolsCallback?: (tools: Tool[]) => void;
  private displayCallback?: (text: string) => void;
  private eventCallback?: (event: string, ...messages: any[]) => void;
  private exitCallback?: () => void;
  private workerCallback?: <T>(jsonSchema: Record<string, unknown>, text: string) => Promise<T>;
  private isDebug: boolean;

  constructor(options: ContextOptions) {
    this.promptCallback = options.promptCallback;
    this.toolsCallback = options.toolsCallback;
    this.displayCallback = options.displayCallback;
    this.eventCallback = options.eventCallback;
    this.exitCallback = options.exitCallback;
    this.workerCallback = options.workerCallback;
    this.isDebug = options.isDebug ?? false;
  }

  prompt(...messages: any[]) {
    const prompts = messages.flat().map((message) => String(message));

    if (this.isDebug) {
      console.log("Prompt:", ...prompts);
    }

    // Append to existing prompt list
    if (this.prompts.length > 0) {
      this.prompts = [...this.prompts, ...prompts];
      return;
    }

    // Send prompt text at the end of the run loop
    this.prompts = prompts;

    queueMicrotask(() => {
      if (this.promptCallback) {
        this.promptCallback(this.prompts.join("\n"));
      }

      this.prompts = [];
    });
  }

  state(func: Function, description: string) {
    const tool = getTool("state", func, description);

    if (this.isDebug) {
      console.log("State:", tool.schema.name, tool.schema.description);
    }

    this.addTool(tool);
  }

  action(func: Function, description: string) {
    const tool = getTool("action", func, description);

    if (this.isDebug) {
      console.log("Action:", tool.schema.name, tool.schema.description);
    }

    this.addTool(tool);
  }

  display(...messages: any[]) {
    const displays = messages.flat().map((message) => String(message));

    if (this.isDebug) {
      console.log("Display:", ...displays);
    }

    // Append to existing display list
    if (this.displays.length > 0) {
      this.displays = [...this.displays, ...displays];
      return;
    }

    // Send display text at the end of the run loop
    this.displays = displays;

    queueMicrotask(() => {
      if (this.displayCallback) {
        this.displayCallback(this.displays.join("\n"));
      }

      this.displays = [];
    });
  }

  event(event: string, ...messages: any[]) {
    if (this.isDebug) {
      console.log("Event:", event, ...messages);
    }

    if (this.eventCallback) {
      this.eventCallback(event, ...messages);
    }
  }

  reset() {
    if (this.isDebug) {
      console.log("Reset");
    }

    this.tools = [];
    this.updateTools();
  }

  exit() {
    if (this.isDebug) {
      console.log("Exit");
    }

    if (this.exitCallback) {
      this.exitCallback();
    }
  }

  async worker<T extends ZodType>(schema: T, ...messages: any[]): Promise<z.infer<T>> {
    const jsonSchema = zodToJsonSchema<"openAi">(schema);

    // Remove unwanted properties from JSON schema
    delete jsonSchema.$schema;

    // Prepare worker prompt text
    const prompts = messages.flat().map((message) => String(message));

    if (this.isDebug) {
      console.log("Worker:", ...prompts);
    }

    // Make sure workers are supported
    if (!this.workerCallback) {
      throw new Error("Workers are not supported on this platform");
    }

    return await this.workerCallback(jsonSchema, prompts.join("\n"));
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
      if (this.isDebug) {
        console.log("Tool Call:", toolCall.name, unorderedArguments);
      }

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

    // Remove duplicate tools
    if (previousToolIndex !== -1) {
      this.tools.splice(previousToolIndex, 1);
    }

    // Append to tool list
    this.tools.push(tool);
    this.updateTools();
  }

  private updateTools() {
    if (this.isUpdatingTools) {
      return;
    }

    // Send tools at the end of the run loop
    this.isUpdatingTools = true;

    queueMicrotask(() => {
      if (this.toolsCallback) {
        this.isUpdatingTools = false;
        this.toolsCallback(this.tools);
      }
    });
  }
}
