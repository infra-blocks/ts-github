import {
  isGitTagPublishLabel,
  isNpmPublishLabel,
  isSemverPublishLabel,
  SemverPublishLabel,
} from "../../src/index.js";
import { expect } from "@infra-blocks/test";

describe("label", function () {
  for (const labelFunction of [
    isSemverPublishLabel,
    isNpmPublishLabel,
    isGitTagPublishLabel,
  ])
    describe(labelFunction.name, function () {
      const valid = ["no version", "patch", "minor", "major"];
      for (const label of valid) {
        it(`should return true for '${label}'`, function () {
          expect(labelFunction(label)).to.be.true;
          // Enforce it compiles.
          if (labelFunction(label)) {
            const typeChecked: SemverPublishLabel = label;
            expect(typeChecked).to.equal(label);
          }
        });
      }
      it("should return false for invalid label", function () {
        expect(labelFunction("big alpha")).to.be.false;
      });
    });
});
