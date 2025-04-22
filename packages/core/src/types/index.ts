export type ToolType = "state" | "action";

export type Tool = {
  type: ToolType;
  func: Function;
  schema: {
    type: "function";
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: boolean;
    };
  };
};

export type ToolCall = {
  name: string;
  arguments: string;
};
