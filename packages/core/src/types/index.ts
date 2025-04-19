export type ToolType = "state" | "action" | "callback";

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
