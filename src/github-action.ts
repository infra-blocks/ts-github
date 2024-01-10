import { Nullable } from "@infra-blocks/types";
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
  readonly name?: string;
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

export function stringInput(options?: {
  name?: string;
}): InputValidator<string>;
export function stringInput(options: {
  default: string | Provider<string>;
  name?: string;
}): InputValidator<string>;
export function stringInput(options: {
  default: undefined | Provider<string | undefined>;
  name?: string;
}): InputValidator<string | undefined>;
// TODO: figure out a way to automatically infer the union type instead of string. See tests.
export function stringInput<T extends string>(options: {
  choices: T[];
  name?: string;
}): InputValidator<T>;
export function stringInput<T extends string>(options: {
  choices: T[];
  default: T | Provider<T>;
  name?: string;
}): InputValidator<T>;
export function stringInput<T extends string>(options: {
  choices: T[];
  default: undefined | Provider<undefined>;
  name?: string;
}): InputValidator<T | undefined>;
/**
 * Returns a validator for string inputs.
 *
 * @param options.name - The input name. Only useful when overriding the default behavior of ${@link getInputs}.
 * @param options.default - If defined, the input becomes optional and when
 *  not found, the default value is returned. The default can also be a {@link Provider}. In which case, it is
 *  only called when the input isn't found.
 * @param options.choices - The string input can also be validated against a set of choices. An error is thrown
 *  when the input does not match any provided choice.
 */
export function stringInput<T extends string>(options?: {
  name?: string;
  default?: T | Provider<T> | Provider<T | undefined>;
  choices?: T[];
}): InputValidator<T | undefined> {
  const { name, choices } = options || {};

  return {
    name,
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
  name?: string;
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string>>;
export function arrayInput(options: {
  default: ReadonlyArray<string> | Provider<ReadonlyArray<string>>;
  name?: string;
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string>>;
export function arrayInput(options: {
  default: undefined | Provider<ReadonlyArray<string> | undefined>;
  name?: string;
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string> | undefined>;
/**
 * Returns a validator for arrays parsed out of strings.
 *
 * The default separator is the comma, but users can specify other
 * separators.
 *
 * @param options.name - The input name. Only useful when overriding the default behavior of ${@link getInputs}.
 * @param options.default - If defined, the input becomes optional and when
 *  not found, the default value is returned. The default can also be a {@link Provider}. In which case, it is
 *  only called when the input isn't found.
 * @param options.separator - The token separator. Defaults to ",".
 * @param options.trim - Whether to trim the array tokens. False by default.
 */
export function arrayInput(options?: {
  name?: string;
  default?:
    | ReadonlyArray<string>
    | Provider<ReadonlyArray<string>>
    | Provider<ReadonlyArray<string> | undefined>;
  separator?: string | RegExp;
  trim?: boolean;
}): InputValidator<ReadonlyArray<string> | undefined> {
  const { name, separator = ",", trim = false } = options || {};
  return {
    name,
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

export function booleanInput(options?: {
  name?: string;
}): InputValidator<boolean>;
export function booleanInput(options: {
  default: boolean | Provider<boolean>;
  name?: string;
}): InputValidator<boolean>;
export function booleanInput(options: {
  default: undefined | Provider<boolean | undefined>;
  name?: string;
}): InputValidator<boolean | undefined>;
/**
 * Returns a validator for boolean inputs.
 *
 * @param options.default - If defined, the input becomes optional and when
 *  not found, the default value is returned. The default can also be a {@link Provider}. In which case, it is
 *  only called when the input isn't found.
 */
export function booleanInput(options?: {
  name?: string;
  default?: boolean | Provider<boolean> | Provider<boolean | undefined>;
}): InputValidator<boolean | undefined> {
  const { name } = options || {};
  return {
    name,
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
 * Returns a type safe snapshot of the provided GitHub actions inputs.
 *
 * @param inputValidators - An object where the keys are the field names of the result. If an input validator
 *  doesn't specify an input name, then the key is also the input name. For example: { toto: stringInput() }
 *  means we're extracting the input with the name "toto" from the environment and placing it in result.toto.
 *  { toto: stringInput({name: "tutu"}) } means we're parsing the input with name "tutu" from the environment
 *  and placing the result in result.toto.
 */
export function getInputs<T>(inputValidators: {
  [K in keyof T]: InputValidator<T[K]>;
}): Readonly<T> {
  const result: Record<string, unknown> = {};

  for (const [key, validator] of Object.entries<InputValidator<unknown>>(
    inputValidators
  )) {
    const inputName = validator.name || key;
    const input = getInput(inputName);
    try {
      result[key] = validator.parse(input);
    } catch (err) {
      throw new VError(
        { name: "GetInputsError", cause: err as Error },
        `error parsing input ${inputName}`
      );
    }
  }

  return result as T;
}

/**
 * GitHub action outputs are simple strings.
 *
 * Whatever isn't a string is JSON stringified. To be more explicit about it,
 * this framework requires calling code to stringify themselves.
 *
 */
export type Outputs = Record<string, string>;

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

export function runActionHandler(
  handler: () => Promise<Nullable<Outputs>>
): void;
export function runActionHandler<I>(
  handler: (inputs: Readonly<I>) => Promise<Nullable<Outputs>>,
  inputValidators: {
    [K in keyof I]: InputValidator<I[K]>;
  }
): void;
/**
 * This function does away with the common boilerplate code related to running a GitHub Actions
 * handler.
 *
 * It wraps the whole process with convenient debug statements that are turned on
 * by setting ACTIONS_STEP_DEBUG to true.
 *
 * The optional inputs can be declared with the input validators argument. They are extracted out of the
 * environment and passed on to the handler when provided.
 *
 * The handler can return {@link Outputs} and those are forwarded automatically to core.setOutput at the
 * end of the run.
 *
 * Any runtime errors occurring during this function's execution results in a call to core.setFailed.
 *
 * @param handler - The GitHub Actions handler.
 * @param inputValidators - The optional map of validators to extract the inputs from the environment.
 *  See {@link getInputs}
 *
 * @see https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging
 */
export function runActionHandler<I>(
  handler: (inputs: Readonly<I>) => Promise<Nullable<Outputs>>,
  inputValidators?: {
    [K in keyof I]: InputValidator<I[K]>;
  }
) {
  try {
    if (core.isDebug()) {
      core.debug(`received env: ${JSON.stringify(process.env, null, 2)}`);
      core.debug(`received context: ${JSON.stringify(context, null, 2)}`);
    }

    let promise;
    if (inputValidators == null) {
      core.debug("no inputs specified");
      promise = (handler as () => Promise<Outputs>)();
    } else {
      const inputs = getInputs(inputValidators);

      if (core.isDebug()) {
        core.debug(`parsed out inputs: ${JSON.stringify(inputs)}`);
      }
      promise = handler(inputs);
    }

    promise
      .then((outputs) => {
        if (outputs == null) {
          return;
        }
        for (const [key, value] of Object.entries(outputs)) {
          if (core.isDebug()) {
            core.debug(`setting output ${key}=${value}`);
          }
          core.setOutput(key, value);
        }
      })
      .catch((err) => core.setFailed(VError.fullStack(err as Error)));
  } catch (err) {
    core.setFailed(VError.fullStack(err as Error));
  }
}
