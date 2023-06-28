import { Octokit } from "@octokit/core";
import { components } from "@octokit/openapi-types";
import VError = require("verror");

export type PullRequest = components["schemas"]["pull-request-simple"];
export type IssueComment = components["schemas"]["issue-comment"];

const ERROR_NAME = "GitHubClientError";

/**
 * An extension of the {@link GitHubClient} made to work on a specific repository.
 *
 * For operations that happen on a specific repository, it can be convenient to pass
 * the repository information once to the client, instead of every call.
 *
 * This is the problem this client solves. Those clients should be
 * created using the {@link GitHubClient#inRepositoryScope} method.
 */
export class GitHubRepositoryClient {
  private readonly owner: string;
  private readonly repository: string;
  private readonly client: GitHubClient;

  constructor(params: {
    owner: string;
    repository: string;
    client: GitHubClient;
  }) {
    const { owner, repository, client } = params;
    this.owner = owner;
    this.repository = repository;
    this.client = client;
  }

  /**
   * @see GitHubClient#listPrs
   */
  listPrs(): ReturnType<GitHubClient["listPrs"]> {
    return this.client.listPrs(this.addRepoInfo({}));
  }

  /**
   * @see GitHubClient#listPrsWithLabel
   */
  listPrsWithLabel(params: {
    label: string;
  }): ReturnType<GitHubClient["listPrsWithLabel"]> {
    return this.client.listPrsWithLabel(this.addRepoInfo(params));
  }

  /**
   * @see GitHubClient#findBranchPrs
   */
  findBranchPrs(params: {
    branchName: string;
  }): ReturnType<GitHubClient["findBranchPrs"]> {
    return this.client.findBranchPrs(this.addRepoInfo(params));
  }

  /**
   * @see GitHubClient#findCommitPrs
   */
  findCommitPrs(params: {
    commitSha1: string;
  }): ReturnType<GitHubClient["findBranchPrs"]> {
    return this.client.findCommitPrs(this.addRepoInfo(params));
  }

  /**
   * @see GitHubClient#postIssueComment
   */
  postIssueComment(params: {
    issueNumber: number;
    body: string;
  }): ReturnType<GitHubClient["postIssueComment"]> {
    return this.client.postIssueComment(this.addRepoInfo(params));
  }

  /**
   * @see GitHubClient#listIssueComments
   */
  listIssueComments(params: {
    issueNumber: number;
  }): ReturnType<GitHubClient["listIssueComments"]> {
    return this.client.listIssueComments(this.addRepoInfo(params));
  }

  /**
   * @see GitHubClient#deleteIssueComment
   */
  deleteIssueComment(params: {
    commentId: number;
  }): ReturnType<GitHubClient["deleteIssueComment"]> {
    return this.client.deleteIssueComment(this.addRepoInfo(params));
  }

  private addRepoInfo<T>(params: T): T & { owner: string; repository: string } {
    return {
      ...params,
      owner: this.owner,
      repository: this.repository,
    };
  }
}

/**
 * A GitHub convenience client.
 *
 * The "owner" in the context of the GitHub API is either the organization or the user to which
 * repositories belong to. The "repository" is the repository itself. Hence, the URL
 * github.com/Trololol/repo1 refers to the repository "repo1" owned by "Trololol".
 */
export class GitHubClient {
  private readonly octokit: Octokit;

  constructor(params: { octokit: Octokit }) {
    const { octokit } = params;
    this.octokit = octokit;
  }

  /**
   * Returns an instance of {@link GitHubRepositoryClient}.
   *
   * All of the operations of the returned client will take place on the
   * specified repository.
   *
   * @param params.owner - The repository owner
   * @param params.repository - The repository name
   */
  inRepositoryScope(params: {
    owner: string;
    repository: string;
  }): GitHubRepositoryClient {
    const { owner, repository } = params;
    return new GitHubRepositoryClient({
      owner,
      repository,
      client: this,
    });
  }

  /**
   * Lists all pull requests of the provided repository.
   *
   * @param params.owner - The repository owner
   * @param params.repository - The repository name
   */
  async listPrs(params: {
    owner: string;
    repository: string;
  }): Promise<PullRequest[]> {
    const { owner, repository } = params;
    try {
      const result = await this.octokit.request(
        "GET /repos/{owner}/{repo}/pulls",
        {
          owner,
          repo: repository,
        }
      );
      return result.data;
    } catch (err) {
      throw new VError(
        { cause: err as Error, name: ERROR_NAME },
        `error listing PRs for ${owner}/${repository}`
      );
    }
  }

  /**
   * Returns the list of pull requests in the provided repository that are marked with the given label.
   *
   * @param params.owner - The repository owner
   * @param params.repository - The repository name
   * @param params.label - The label that marks the pull requests.
   */
  async listPrsWithLabel(params: {
    owner: string;
    repository: string;
    label: string;
  }): Promise<PullRequest[]> {
    const { owner, repository, label } = params;
    try {
      const prs = await this.listPrs({ owner, repository });
      return prs.filter(
        (pr) => pr.labels.find((prLabel) => prLabel.name === label) != null
      );
    } catch (err) {
      throw new VError(
        { cause: err as Error, name: ERROR_NAME },
        `error listing PRs for ${owner}/${repository} with label ${label}`
      );
    }
  }

  /**
   * Returns the open pull requests corresponding to the provided branch name in the given
   * repository.
   *
   * For example, if the branch name is `feature/stuff`, this function will return all open
   * PRs that have this branch as their head ref.
   *
   * @param params.owner - The repository owner.
   * @param params.repository - The name of the repository.
   * @param params.branchName - The name of the branch to match.
   *
   * @return The list of open PRs for the provided branch.
   */
  async findBranchPrs(params: {
    owner: string;
    repository: string;
    branchName: string;
  }): Promise<PullRequest[]> {
    const { owner, repository, branchName } = params;
    try {
      const response = await this.octokit.request(
        "GET /repos/{owner}/{repo}/pulls",
        {
          repo: repository,
          owner,
          head: `${owner}:${branchName}`,
        }
      );
      return response.data;
    } catch (err) {
      throw new VError(
        { cause: err as Error, name: ERROR_NAME },
        `error while getting PRs for branch: ${owner}/${repository}/${branchName}`
      );
    }
  }

  /**
   * Returns the list of pull requests associated with a commit SHA-1 in the given repository.
   *
   * @param params.owner - The repository owner.
   * @param params.repository - The name of the repository.
   * @param params.commitSha1 - The full or partial commit SHA-1 value.
   *
   * @return The list of PRs with the provided commit.
   */
  async findCommitPrs(params: {
    owner: string;
    repository: string;
    commitSha1: string;
  }): Promise<PullRequest[]> {
    const { owner, repository, commitSha1 } = params;
    try {
      const response = await this.octokit.request(
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
        {
          repo: repository,
          owner,
          commit_sha: commitSha1,
        }
      );
      return response.data;
    } catch (err) {
      throw new VError(
        { cause: err as Error, name: ERROR_NAME },
        `error while getting PRs for commit: ${commitSha1}`
      );
    }
  }

  /**
   * Posts a comment on an issue.
   *
   * Note that a pull request is also an issue. Using this API for a pull request results in a
   * comment for the whole PR (constrasting with a comment for a specific line on a given commit, or
   * par of a review, for example).
   *
   * @param params.owner - The repository owner
   * @param params.repository - The repository name
   * @param params.issueNumber - The issue number. This can also be a PR number.
   * @param params.body - The body of the comment.
   */
  async postIssueComment(params: {
    owner: string;
    repository: string;
    issueNumber: number;
    body: string;
  }): Promise<void> {
    const { owner, repository, issueNumber, body } = params;
    try {
      await this.octokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner,
          repo: repository,
          issue_number: issueNumber,
          body,
        }
      );
    } catch (err) {
      throw new VError(
        { cause: err as Error, name: ERROR_NAME },
        `error while posting issue ${issueNumber} comment`
      );
    }
  }

  /**
   * Lists the comments pertaining to an issue.
   *
   * Note that a pull request is also an issue. Using this API for a pull request lists all top
   * level comments for the whole PR.
   *
   * @param params.owner - The repository owner
   * @param params.repository - The repository name
   * @param params.issueNumber - The number of the issue. This could also be a PR number.
   *
   * @return A list of comments pertaining to the issue.
   */
  async listIssueComments(params: {
    owner: string;
    repository: string;
    issueNumber: number;
  }): Promise<IssueComment[]> {
    const { owner, repository, issueNumber } = params;
    try {
      const result = await this.octokit.request(
        "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner,
          repo: repository,
          issue_number: issueNumber,
        }
      );
      return result.data;
    } catch (err) {
      throw new VError(
        { cause: err as Error, name: ERROR_NAME },
        `error while listing issue ${issueNumber} comments for ${owner}/${repository}`
      );
    }
  }

  /**
   * Deletes a comment on an issue.
   *
   * Note that a pull request is also an issue. Using this API for a pull request deletes a top
   * level comment for the whole PR.
   *
   * @param params.owner - The repository owner
   * @param params.repository - The repository name
   * @param params
   */
  async deleteIssueComment(params: {
    owner: string;
    repository: string;
    commentId: number;
  }): Promise<void> {
    const { owner, repository, commentId } = params;
    try {
      await this.octokit.request(
        "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}",
        {
          owner,
          repo: repository,
          comment_id: commentId,
        }
      );
    } catch (err) {
      throw new VError(
        { cause: err as Error, name: ERROR_NAME },
        `error while deleting comment ${commentId}`
      );
    }
  }
}

/**
 * Returns a {@link GitHubClient} that will use to provided token when authenticating against the
 * GitHub API.
 *
 * @param params.gitHubToken - The GitHub authentication token.
 */
export function createGitHubClient(params: {
  gitHubToken: string;
}): GitHubClient {
  const { gitHubToken } = params;
  const octokit = new Octokit({ auth: gitHubToken });
  return new GitHubClient({ octokit });
}

/**
 * NPM publish labels available for the NPM publish action.
 */
export type NpmPublishLabel = "no version" | "patch" | "minor" | "major";

/**
 * Returns true if the provided label has the conventional format for an NPM publish label,
 * false otherwise.
 *
 * Also acts as a typeguard for Typescript.
 *
 * @param label - The label to test
 */
export function isNpmPublishLabel(label: string): label is NpmPublishLabel {
  return ["no version", "patch", "minor", "major"].includes(label);
}

/**
 * Mister Robot is the avatar providing comments on the pull requests.
 *
 * His comments are meant to be singletons on the pull requests. Meaning, if
 * they exist, then they are removed and reposted anew. We don't edit them because
 * we want Slack notifications to be triggered.
 */
export class MisterRobot {
  private static readonly COMMENT_SUFFIX = " - Yours truly, Mr. Robot";

  private readonly gitHubClient: GitHubRepositoryClient;
  private readonly pullRequest: PullRequest;

  constructor(params: {
    gitHubClient: GitHubRepositoryClient;
    pullRequest: PullRequest;
  }) {
    const { gitHubClient, pullRequest } = params;
    this.gitHubClient = gitHubClient;
    this.pullRequest = pullRequest;
  }

  /**
   * Provides a PR comment with the given body.
   *
   * If there already exists a comment by Mister Robot, it is first removed and then a
   * new comment is created.
   *
   * @param params.body - The comment body.
   */
  async providePrComment(params: { body: string }): Promise<void> {
    const { body } = params;

    // First, we check if we already have posted.
    const issueNumber = this.pullRequest.number;
    const comments = await this.gitHubClient.listIssueComments({
      issueNumber,
    });
    const commentsToRemove = comments.filter(
      (comment) =>
        comment.body != null &&
        comment.body.endsWith(MisterRobot.COMMENT_SUFFIX)
    );
    for (const comment of commentsToRemove) {
      await this.gitHubClient.deleteIssueComment({ commentId: comment.id });
    }
    await this.gitHubClient.postIssueComment({
      issueNumber,
      body: `${body}${MisterRobot.COMMENT_SUFFIX}`,
    });
  }
}

/**
 * Returns a configured instance of {@link MisterRobot}
 *
 * @param params.gitHubClient - The client that will be used for GitHub interactions.
 *
 * @return An instance of {@link MisterRobot}
 */
export function createMisterRobot(params: {
  gitHubClient: GitHubRepositoryClient;
  pullRequest: PullRequest;
}): MisterRobot {
  const { gitHubClient, pullRequest } = params;
  return new MisterRobot({ gitHubClient, pullRequest });
}
