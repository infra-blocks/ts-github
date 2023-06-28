export type SemverPublishLabel = "no version" | "patch" | "minor" | "major";

const SEMVER_PUBLISH_LABELS = ["no version", "patch", "minor", "major"];

export function isSemverPublishLabel(
  label: string
): label is SemverPublishLabel {
  return SEMVER_PUBLISH_LABELS.includes(label);
}

/**
 * NPM publish labels available for the NPM publish action.
 */
export type NpmPublishLabel = SemverPublishLabel;

/**
 * Returns true if the provided label has the conventional format for an NPM publish label,
 * false otherwise.
 *
 * Also acts as a typeguard for Typescript.
 *
 * @param label - The label to test
 */
export function isNpmPublishLabel(label: string): label is NpmPublishLabel {
  return isSemverPublishLabel(label);
}

/**
 * Git tag publish labels available for the git tag publish action.
 */
export type GitTagPublishLabel = SemverPublishLabel;

/**
 * Returns true if the provided label has the conventional format for an NPM publish label,
 * false otherwise.
 *
 * Also acts as a typeguard for Typescript.
 *
 * @param label - The label to test
 */
export function isGitTagPublishLabel(
  label: string
): label is GitTagPublishLabel {
  return isSemverPublishLabel(label);
}
