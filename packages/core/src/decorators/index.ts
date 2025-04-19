import "reflect-metadata";
import { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Tool, ToolType } from "../types";

type Constructor = new (...args: unknown[]) => unknown;

type ToolMetadata = {
  name: string;
  type: ToolType;
};

type ParamMetadata = {
  name: string;
  type: string;
  description: string;
  schema: ZodType | null;
};

export function state(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  return setToolMetadata("state", target, key, descriptor);
}

export function action(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  return setToolMetadata("action", target, key, descriptor);
}

export function callback(target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  return setToolMetadata("callback", target, key, descriptor);
}

export function param(name: string, description: string, schema?: ZodType): ParameterDecorator {
  return (target: object, key: string | symbol | undefined, index: number) => {
    if (key === undefined) {
      throw new Error("Decorator '@param' cannot be applied to parameter in constructor");
    }

    // Get existing parameter metadata
    const paramsMetadata: ParamMetadata[] = Reflect.getOwnMetadata("params", target, key) || [];

    // Get parameter type
    const types: Constructor[] = Reflect.getOwnMetadata("design:paramtypes", target, key) || [];
    const type = types[index].name.toLowerCase();

    if (!type && !schema) {
      throw new Error(`Parameter ${index + 1} on function '${String(key)}' requires schema for complex type`);
    }

    // Append parameter to existing metadata
    paramsMetadata[index] = {
      name,
      type,
      description,
      schema: schema ?? null,
    };

    // Reassign with updated metadata
    Reflect.defineMetadata("params", paramsMetadata, target, key);
  };
}

export function getTool(type: ToolType, func: Function, description: string): Tool {
  const toolMetadata: ToolMetadata | undefined = Reflect.getOwnMetadata("tool", func);
  const paramsMetadata: ParamMetadata[] = Reflect.getOwnMetadata("params", func);

  // Make sure target function has metadata
  if (!toolMetadata || toolMetadata.type !== type) {
    throw new Error(`Function '${toolMetadata?.name ?? func.name}' must have '@${type}' decorator`);
  }

  // Enumerate tool function parameters
  const properties = Object.fromEntries(
    paramsMetadata.slice(1).map((paramMetadata) => {
      const schema = paramMetadata.schema ? zodToJsonSchema<"openAi">(paramMetadata.schema) : {};

      // Remove unwanted properties from schema
      delete schema.$schema;

      // Return key-value list of parameters
      return [
        paramMetadata.name,
        {
          type: paramMetadata.type,
          description: paramMetadata.description,
          ...schema,
        },
      ];
    }),
  );

  // Construct the tool object
  const tool: Tool = {
    type: toolMetadata.type,
    func,
    schema: {
      type: "function",
      name: toolMetadata.name,
      description: description,
      parameters: {
        type: "object",
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
      },
    },
  };

  return tool;
}

function setToolMetadata(
  type: ToolType,
  target: object,
  key: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  const toolMetadata: ToolMetadata = { name: key, type };
  const paramsMetadata: ParamMetadata[] = Reflect.getOwnMetadata("params", target, key) || [];
  const types: Constructor[] = Reflect.getOwnMetadata("design:paramtypes", target, key) || [];

  // Make sure the first parameter does not have @param decorator
  if (paramsMetadata[0] !== undefined) {
    throw new Error(`Parameter 1 on function '${key}' must not have '@param' decorator`);
  }

  // Make sure every other parameter has @param decorator
  for (let index = 1; index < types.length; index++) {
    if (paramsMetadata[index] === undefined) {
      throw new Error(`Parameter ${index + 1} on function '${key}' must have '@param' decorator`);
    }
  }

  // Callback functions must receive some data
  if (type === "callback" && types.length < 2) {
    throw new Error(`Callback function '${key}' must have at least one parameter with '@param' decorator`);
  }

  // Auto-bind to lexical 'this' with lazy initialization
  return {
    configurable: true,
    get() {
      const bound = descriptor.value.bind(this);

      // Copy metadata to the bound function
      Reflect.defineMetadata("tool", toolMetadata, bound);
      Reflect.defineMetadata("params", paramsMetadata, bound);

      // Replace getter with bound function for subsequent calls
      Object.defineProperty(this, key, {
        value: bound,
        configurable: true,
        writable: true,
      });

      return bound;
    },
  };
}
