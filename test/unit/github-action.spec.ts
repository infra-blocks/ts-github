import {
  arrayInput,
  booleanInput,
  checkSupportedEvent,
  Event,
  getInputs,
  parseEvent,
  stringInput,
} from "../../src/github-action.js";
import { expect } from "@infra-blocks/test";

describe("github-action", function () {
  describe(parseEvent.name, function () {
    it("should work with push event", function () {
      expect(parseEvent("push")).to.equal(Event.Push);
    });
    it("should work with pull request event", function () {
      expect(parseEvent("pull_request")).to.equal(Event.PullRequest);
    });
    it("should fail on unknown event type", function () {
      expect(() => parseEvent("rebuild_errthang")).to.throw();
    });
  });
  describe(checkSupportedEvent.name, function () {
    it("should work with a single supported event", function () {
      expect(checkSupportedEvent("push", [Event.Push])).to.equal(Event.Push);
    });
    it("should work with an event that is part of a supported group", function () {
      expect(
        checkSupportedEvent("pull_request", [Event.Push, Event.PullRequest])
      ).to.equal(Event.PullRequest);
    });
    it("should throw if there are no supported events", function () {
      expect(() => checkSupportedEvent("push", [])).to.throw();
    });
    it("should throw if the event cannot be parsed", function () {
      expect(() => checkSupportedEvent("toto", [Event.Push])).to.throw();
    });
    it("should throw if the event is not supported", function () {
      expect(() => checkSupportedEvent("push", [Event.PullRequest])).to.throw();
    });
  });
  describe(getInputs.name, function () {
    const OLD_ENV = process.env;

    afterEach("reset env", function () {
      process.env = OLD_ENV;
    });

    describe(stringInput.name, function () {
      it("should throw if the input is not defined", function () {
        expect(() =>
          getInputs({
            test: stringInput(),
          })
        ).to.throw();
      });
      it("should return the default value if the input is not defined", function () {
        const inputs: { cannotBeUndefined: string } = getInputs({
          cannotBeUndefined: stringInput({ default: "that's the value" }),
        });
        expect(inputs.cannotBeUndefined).to.equal("that's the value");
      });
      it("should return the default value if the input is an empty string", function () {
        process.env.INPUT_CANNOTBEUNDEFINED = "";
        const inputs: { cannotBeUndefined: string } = getInputs({
          cannotBeUndefined: stringInput({ default: "that's the value" }),
        });
        expect(inputs.cannotBeUndefined).to.equal("that's the value");
      });
      it("should return the default value of undefined if the input is not defined", function () {
        const inputs = getInputs({
          canBeUndefined: stringInput({ default: undefined }),
        });
        // Making sure it's marked as potentially undefined.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const compilationTest: typeof inputs.canBeUndefined = undefined;
        expect(inputs.canBeUndefined).to.be.undefined;
      });
      it("should return the expected value if the input is defined", function () {
        process.env.INPUT_TEST2 = "good";
        // Adding types to make sure it compiles as expected.
        const inputs: { test2: string } = getInputs({
          test2: stringInput(),
        });
        expect(inputs.test2).to.equal("good");
      });
    });

    describe(arrayInput.name, function () {
      it("should throw if the input is not defined", function () {
        expect(() =>
          getInputs({
            test: arrayInput(),
          })
        ).to.throw();
      });
      it("should return the default value if one is provided and the value is not defined", function () {
        const inputs: { cannotBeUndefined: ReadonlyArray<string> } = getInputs({
          cannotBeUndefined: arrayInput({ default: ["big-default"] }),
        });
        expect(inputs.cannotBeUndefined).to.deep.equal(["big-default"]);
      });
      it("should return the default value if one is provided and the value is an empty string", function () {
        process.env.INPUT_CANNOTBEUNDEFINED = "";
        const inputs: { cannotBeUndefined: ReadonlyArray<string> } = getInputs({
          cannotBeUndefined: arrayInput({ default: ["big-default"] }),
        });
        expect(inputs.cannotBeUndefined).to.deep.equal(["big-default"]);
      });
      it("should return the default value of undefined if the input is not defined", function () {
        const inputs = getInputs({
          canBeUndefined: arrayInput({ default: undefined }),
        });
        // Making sure it's marked as potentially undefined.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const compilationTest: typeof inputs.canBeUndefined = undefined;
        expect(inputs.canBeUndefined).to.be.undefined;
      });
      it("should return the expected value if it is defined", function () {
        process.env.INPUT_STUFF = "hello, there";
        const inputs: { stuff: ReadonlyArray<string> } = getInputs({
          stuff: arrayInput(),
        });
        expect(inputs.stuff).to.deep.equal(["hello", " there"]);
      });
      it("should respect the separator option", function () {
        process.env.INPUT_SPACEWORDS = "hello there is it me you looking for";
        const inputs: { spaceWords: ReadonlyArray<string> } = getInputs({
          spaceWords: arrayInput({ separator: " " }),
        });
        expect(inputs.spaceWords).to.deep.equal([
          "hello",
          "there",
          "is",
          "it",
          "me",
          "you",
          "looking",
          "for",
        ]);
      });
    });

    describe(booleanInput.name, function () {
      it("should throw if the input is not defined", function () {
        expect(() =>
          getInputs({
            test: booleanInput(),
          })
        ).to.throw();
      });
      it("should return the default value if the input is not defined", function () {
        const inputs: { cannotBeUndefined: boolean } = getInputs({
          cannotBeUndefined: booleanInput({ default: false }),
        });
        expect(inputs.cannotBeUndefined).to.be.false;
      });
      it("should return the default value if the input is an empty string", function () {
        process.env.INPUT_CANNOTBEUNDEFINED = "";
        const inputs: { cannotBeUndefined: boolean } = getInputs({
          cannotBeUndefined: booleanInput({ default: false }),
        });
        expect(inputs.cannotBeUndefined).to.be.false;
      });
      it("should return the default value of undefined if the input is not defined", function () {
        const inputs = getInputs({
          canBeUndefined: booleanInput({ default: undefined }),
        });
        // Making sure it's marked as potentially undefined.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const compilationTest: typeof inputs.canBeUndefined = undefined;
        expect(inputs.canBeUndefined).to.be.undefined;
      });
      it("should return the expected value if the input is true", function () {
        process.env.INPUT_VALUE = "true";
        // Adding types to make sure it compiles as expected.
        const inputs: { value: boolean } = getInputs({
          value: booleanInput(),
        });
        expect(inputs.value).to.be.true;
      });
      it("should return the expected value if the input is false", function () {
        process.env.INPUT_VALUE = "false";
        // Adding types to make sure it compiles as expected.
        const inputs: { value: boolean } = getInputs({
          value: booleanInput(),
        });
        expect(inputs.value).to.be.false;
      });
      it("should throw if the input is an invalid boolean", function () {
        process.env.INPUT_VALUE = "falsy";
        // Adding types to make sure it compiles as expected.
        expect(() =>
          getInputs({
            value: booleanInput(),
          })
        ).to.throw();
      });
    });

    it("works with a bunch of different entries", function () {
      interface Inputs {
        snake_string: string;
        camelCaseString: string;
        "with spaces": string;
        withDefault: string;
        withUndefinedDefault: string | undefined;
        csvArray: readonly string[];
        spaceArray: readonly string[];
      }

      process.env.INPUT_SNAKE_STRING = "yessssssssnake";
      process.env.INPUT_CAMELCASESTRING = "camel cased";
      process.env.INPUT_WITH_SPACES = "you didn't know that worked, did you?";
      process.env.INPUT_CSVARRAY = "one, two, three, four";
      process.env.INPUT_SPACEARRAY = "five six seven eight";

      const inputs: Inputs = getInputs({
        snake_string: stringInput(),
        camelCaseString: stringInput(),
        "with spaces": stringInput(),
        withDefault: stringInput({ default: "hello" }),
        withUndefinedDefault: stringInput({ default: undefined }),
        csvArray: arrayInput(),
        spaceArray: arrayInput({ separator: " " }),
      });

      expect(inputs.snake_string).to.equal("yessssssssnake");
      expect(inputs.camelCaseString).to.equal("camel cased");
      expect(inputs["with spaces"]).to.equal(
        "you didn't know that worked, did you?"
      );
      expect(inputs.withDefault).to.equal("hello");
      expect(inputs.withUndefinedDefault).to.be.undefined;
      expect(inputs.csvArray).to.deep.equal(["one", " two", " three", " four"]);
      expect(inputs.spaceArray).to.deep.equal([
        "five",
        "six",
        "seven",
        "eight",
      ]);
    });
  });
});
