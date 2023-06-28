import {
  GitHubClient,
  GitHubRepositoryClient,
  isNpmPublishLabel,
  NpmPublishLabel,
} from "../../src/github.js";
import * as sinon from "sinon";
import { expect, fake } from "@infra-blocks/test";

describe("github", function () {
  // We are not going to test against the actual GitHub API here, nor mock it.
  // We are simply going to test that the repository client properly dispatches to the
  // underlying implementation.
  describe("GitHubRepositoryClient", function () {
    async function expectsDispatch<K extends keyof GitHubRepositoryClient>(
      method: string,
      ...params: Parameters<GitHubRepositoryClient[K]>
    ) {
      const owner = "octocat";
      const repository = "the-repo";
      const expectedResult = 5;
      const stub = sinon.fake.resolves(expectedResult);
      const client = fake<GitHubClient>({ [method]: stub });

      const repoClient = new GitHubRepositoryClient({
        client,
        owner,
        repository,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
      const result = await (repoClient as any)[method](...params);
      expect(result).to.equal(expectedResult);
      // We know if there are parameters it's going to be a single object.
      const additionalParams = params[0] != null ? params[0] : {};
      expect(stub).to.have.been.calledOnceWith({
        owner,
        repository,
        ...additionalParams,
      });
    }

    it("should dispatch when listing PRs", async function () {
      await expectsDispatch("listPrs");
    });
    it("should dispatch when listing PRs", async function () {
      await expectsDispatch("listPrsWithLabel");
    });
    it("should dispatch when finding branch PRs", async function () {
      await expectsDispatch("findBranchPrs", { branchName: "my-branch" });
    });
    it("should dispatch when finding commit PRs", async function () {
      await expectsDispatch("findCommitPrs", { commitSha1: "1234560123456" });
    });
    it("should dispatch when posting issue comment", async function () {
      await expectsDispatch("postIssueComment", {
        issueNumber: 1234,
        body: "comment is me",
      });
    });
    it("should dispatch when listing issue comments", async function () {
      await expectsDispatch("listIssueComments", { issueNumber: 4321 });
    });
    it("should dispatch when deleting issue comment", async function () {
      await expectsDispatch("deleteIssueComment", { commentId: 1234567890 });
    });
  });
  describe(isNpmPublishLabel.name, function () {
    const valid = ["no version", "patch", "minor", "major"];
    for (const label of valid) {
      it(`should return true for '${label}'`, function () {
        expect(isNpmPublishLabel(label)).to.be.true;
        // Enforce it compiles.
        if (isNpmPublishLabel(label)) {
          const typeChecked: NpmPublishLabel = label;
          expect(typeChecked).to.equal(label);
        }
      });
    }
    it("should return false for invalid label", function () {
      expect(isNpmPublishLabel("deploy dev0")).to.be.false;
    });
  });
});
