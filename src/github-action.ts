import VError from "verror";
import * as core from "@actions/core";
import { readFile } from "node:fs/promises";
import { isFunction, Provider } from "@infra-blocks/types";

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
  options?: { default?: T | Provider<T> }
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
    if (options == null) {
      throw new Error("unexpected null options");
    }

    if (isFunction(options.default)) {
      try {
        return options.default();
      } catch (err) {
        throw new VError(
          { cause: err as Error },
          `default value provider threw`
        );
      }
    }
    return options.default;
  }
  return transform(input);
}

export function stringInput(
  options?: Record<string, never>
): InputValidator<string>;
export function stringInput(options: {
  default: string | Provider<string>;
}): InputValidator<string>;
export function stringInput(options: {
  default: undefined | Provider<string | undefined>;
}): InputValidator<string | undefined>;
// TODO: figure out a way to automatically infer the union type instead of string. See tests.
export function stringInput<T extends string>(options: {
  choices: T[];
}): InputValidator<T>;
export function stringInput<T extends string>(options: {
  default: T;
  choices: T[];
}): InputValidator<T>;
export function stringInput<T extends string>(options: {
  default: undefined;
  choices: T[];
}): InputValidator<T | undefined>;
/**
 * Returns a validator for string inputs.
 *
 * @param options.default - If defined, the input becomes optional and when
 *  not found, the default value is returned. The default can also be a {@link Provider}. In which case, it is
 *  only called when the input isn't found.
 */
export function stringInput<T extends string>(options?: {
  default?: T | Provider<T> | Provider<T | undefined>;
  choices?: T[];
}): InputValidator<T | undefined> {
  const { choices } = options || {};

  return {
    parse(input: string | undefined) {
      return parseInput(
        input,
        (input) => {
          if (choices == null || choices.length === 0) {
            return input as T;
          }
          if (!choices.includes(input as T)) {
            throw new Error(
              `invalid value: ${input} for string input with choices: ${JSON.stringify(
                choices
              )}`
            );
          }
          return input as T;
        },
        options
      );
    },
  };
}

export function arrayInput(options?: {
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string>>;
export function arrayInput(options: {
  default: ReadonlyArray<string> | Provider<ReadonlyArray<string>>;
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string>>;
export function arrayInput(options: {
  default: undefined | Provider<ReadonlyArray<string> | undefined>;
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string> | undefined>;
/**
 * Returns a validator for arrays parsed out of strings.
 *
 * The default separator is the comma, but users can specify other
 * separators.
 *
 * @param options.default - If defined, the input becomes optional and when
 *  not found, the default value is returned. The default can also be a {@link Provider}. In which case, it is
 *  only called when the input isn't found.
 * @param options.separator - The token separator. Defaults to ",".
 * @param options.trim - Whether to trim the array tokens. False by default.
 */
export function arrayInput(options?: {
  default?:
    | ReadonlyArray<string>
    | Provider<ReadonlyArray<string>>
    | Provider<ReadonlyArray<string> | undefined>;
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string> | undefined> {
  const { separator = ",", trim = false } = options || {};
  return {
    parse(input: string | undefined) {
      return parseInput(
        input,
        (input) => {
          const tokens = input.split(separator);
          if (!trim) {
            return tokens;
          }
          return tokens.map((token) => token.trim());
        },
        options
      );
    },
  };
}

export function booleanInput(): InputValidator<boolean>;
export function booleanInput(options: {
  default: boolean | Provider<boolean>;
}): InputValidator<boolean>;
export function booleanInput(options: {
  default: undefined | Provider<boolean | undefined>;
}): InputValidator<boolean | undefined>;
/**
 * Returns a validator for boolean inputs.
 *
 * @param options.default - If defined, the input becomes optional and when
 *  not found, the default value is returned. The default can also be a {@link Provider}. In which case, it is
 *  only called when the input isn't found.
 */
export function booleanInput(options?: {
  default?: boolean | Provider<boolean> | Provider<boolean | undefined>;
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

/**
 * Parses the Github Actions outputs from the provided file as written by the core.setOutput
 * utility.
 *
 * The core.setOutput utility stores the outputs as heredocs with randomly generated delimiters.
 * This function parses those out and returns the remaining key value pairs as an object.
 *
 * If a key is provided more than once, the last value takes precedence.
 *
 * @param filePath - The outputs file path. Defaults to GITHUB_OUTPUT. Throws if neither the
 *  parameter and the environment variable are provided.
 *
 * @return The outputs as a record of string.
 */
export async function parseOutputs(filePath?: string): Promise<Outputs> {
  const outputsPath = filePath || process.env.GITHUB_OUTPUT;
  if (outputsPath == null) {
    throw new Error(
      `no output file path provided as argument nor through the GITHUB_OUTPUT environment variable`
    );
  }

  const result: Outputs = {};
  const fileContents = await readFile(outputsPath, { encoding: "utf-8" });
  const outputRegex =
    /(?<key>.+?)<<(?<delimiter>.*?)\n(?<value>.*)\n\k<delimiter>\n/g;

  let captures = outputRegex.exec(fileContents);
  while (captures != null && captures.groups != null) {
    result[captures.groups.key] = captures.groups.value;
    captures = outputRegex.exec(fileContents);
  }

  return result;
}
