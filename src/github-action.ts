import VError from "verror";
import * as core from "@actions/core";

/**
 * Typed enum of possible GitHub actions events.
 *
 * This is meant to be extended as we create more GitHub actions
 */
export enum Event {
  Push,
  PullRequest,
}

/**
 * Parses the event name and returns the corresponding {@link Event}
 *
 * @param eventName - The name of the event, as provided by the GitHub context.
 */
export function parseEvent(eventName: string): Event {
  switch (eventName) {
    case "push":
      return Event.Push;
    case "pull_request":
      return Event.PullRequest;
    default:
      throw new Error(`unsupported event: ${eventName}`);
  }
}

/**
 * Parses and verifies that the event is part of the supported event.
 *
 * This is useful in the context of actions where you don't expect most events to trigger the
 * action.
 *
 * If the event is supported, then it is returned. Otherwise, an error is thrown.
 *
 * @param eventName - The event name, as provided by the GitHub context.
 * @param supported - The list of supported events by the action.
 *
 * @return The parsed event, if it's supported.
 */
export function checkSupportedEvent(
  eventName: string,
  supported: ReadonlyArray<Event>
): Event {
  const event = parseEvent(eventName);
  if (supported.includes(event)) {
    return event;
  }
  throw new Error(`unsupported event: ${eventName}`);
}

/**
 * Validator objects used to extract GitHub actions values.
 */
export interface InputValidator<T> {
  parse(input: string | undefined): T;
}

function parseInput<T>(
  input: string | undefined,
  transform: (input: string) => T,
  options?: { default?: T }
): T | undefined {
  const required =
    options == null ||
    !Object.prototype.hasOwnProperty.call(options, "default");
  // GitHub actions actually provide the value as an empty string when it is missing at the time
  // of this writing.
  if (input == null || input === "") {
    if (required) {
      throw Error("input is missing value and no default was provided");
    }
    return options?.default;
  }
  return transform(input);
}

export function stringInput(): InputValidator<string>;
export function stringInput(options: {
  default: string;
}): InputValidator<string>;
export function stringInput(options: {
  default: undefined;
}): InputValidator<string | undefined>;
/**
 * Returns a validator for string inputs.
 *
 * @param options.default - If defined, the input becomes optional and when
 *                          not found, the default value is returned.
 */
export function stringInput(options?: {
  default?: string;
}): InputValidator<string | undefined> {
  return {
    parse(input: string | undefined) {
      return parseInput(input, (input) => input, options);
    },
  };
}

export function arrayInput(options?: {
  separator?: string | RegExp;
}): InputValidator<ReadonlyArray<string>>;
export function arrayInput(options: {
  default: ReadonlyArray<string>;
  separator?: string | RegExp;
}): InputValidator<ReadonlyArray<string>>;
export function arrayInput(options: {
  default: undefined;
  separator?: string | RegExp;
}): InputValidator<ReadonlyArray<string> | undefined>;
/**
 * Returns a validator for arrays parsed out of strings.
 *
 * The default separator is the comma, but users can specify other
 * separators.
 *
 * @param options.default - If defined, the input becomes optional and when
 *                          not found, the default value is returned.
 * @param options.separator - The token separator. Defaults to ",".
 */
export function arrayInput(options?: {
  default?: ReadonlyArray<string>;
  separator?: string | RegExp;
}): InputValidator<ReadonlyArray<string> | undefined> {
  const { separator = "," } = options || {};
  return {
    parse(input: string | undefined) {
      return parseInput(input, (input) => input.split(separator), options);
    },
  };
}

export function booleanInput(): InputValidator<boolean>;
export function booleanInput(options: {
  default: boolean;
}): InputValidator<boolean>;
export function booleanInput(options: {
  default: undefined;
}): InputValidator<boolean | undefined>;
/**
 * Returns a validator for boolean inputs.
 *
 * @param options.default - If defined, the input becomes optional and when
 *                          not found, the default value is returned.
 */
export function booleanInput(options?: {
  default?: boolean;
}): InputValidator<boolean | undefined> {
  return {
    parse(input: string | undefined) {
      function transform(input: string): boolean {
        if (input === "true") {
          return true;
        }
        if (input === "false") {
          return false;
        }
        throw new Error(`invalid boolean input: ${input}`);
      }

      return parseInput(input, transform, options);
    },
  };
}

/**
 * Returns a type safe snapshot of the provided GitHub actions inputs.
 *
 * @param inputValidators - An object where the keys are the name of the inputs
 * and the values are their matching validators.
 */
export function getInputs<T>(inputValidators: {
  [K in keyof T]: InputValidator<T[K]>;
}): Readonly<T> {
  const result: Record<string, unknown> = {};

  for (const [name, value] of Object.entries<InputValidator<unknown>>(
    inputValidators
  )) {
    const input = getInput(name);
    try {
      result[name] = value.parse(input);
    } catch (err) {
      throw new VError(
        { name: "GetInputsError", cause: err as Error },
        `error parsing input ${name}`
      );
    }
  }

  return result as T;
}

/**
 * Returns the value of the input, as found in the environment.
 *
 * This function was copied over from @actions/core, just because we wanted to avoid having
 * a dependency for this single functionality.
 *
 * @param name - The input name.
 */
function getInput(name: string): string | undefined {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`];
}

/**
 * GitHub action outputs are simple strings.
 */
export type Outputs = Record<string, string>;

/**
 * Sets all the provided outputs as the action's outputs.
 *
 * @param outputs - The outputs to set for this action.
 */
export function setOutputs(outputs: Outputs) {
  for (const [key, value] of Object.entries(outputs)) {
    core.setOutput(key, value);
  }
}
