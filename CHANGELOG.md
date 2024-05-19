# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.7] - 2024-05-19

### Changed

- Migrated to the [infra-blocks](https://github.com/infra-blocks) organization.

## [0.13.6] - 2024-04-21

### Added

- This changelog!

## [0.13.5] - 2024-04-13

### Fixed

- `package-lock.json` conflicts in a previous version. 

## [0.13.4] - 2024-04-13

### Added

- `package.json` search keywords.

## [0.13.3] - 2024-04-08

### Fixed

- `package-lock.json` conflicts in a previous version.

## [0.13.2] - 2024-04-08

### Added

- `package.json` repository URL.

## [0.13.1] - 2024-04-07

### Changed

- Split the `README.md` file into `README.md` and `CONTIBUTING.md`.

## [0.13.0] - 2024-02-25

### Added

- CJS compatible build output with package exports.

## [0.12.0] - 2024-01-11

### Changed

- Exported GitHub Actions utilities into their own package: `@infra-blocks/github-actions`.

## [0.11.0] - 2024-01-10

### Changed

- Allow input name remapping. This change affect several input related functions.

## [0.10.0] - 2024-01-08

### Added

- `runActionHandler` to run an action handlers in a conventional manner and reduce boilerplate.

## [0.9.0] - 2024-01-05

### Added

- Allow lazy input defaults as providers.

## [0.8.0] - 2024-01-01

### Added

- `parseOutputs`

## [0.7.0] - 2023-12-24

### Added

- `arrayInput` option `trim` to support trimming of array elements.

## [0.6.0] - 2023-12-15

### Added

- `stringInput` option `choices` to support string inputs that should correspond to an enum.

## [0.5.0] - 2023-12-14

### Added

- Clients: `getUser`, `isUser`, `isOrganization`, `listUserRepositories`, `listOrganizationRepositories`

### Changed

- Replaced `org` for `organization` where applicable. Such as renaming `listOrgRepositories` to
`listOrganizationRepositories`.

## [0.4.0] - 2023-12-04

### Added

- Automated publication CI

### Changed

- Moved to Node.js 20. Still support Node.js 18 though.

### Removed

- `MisterRobot`

## [0.3.1] - 2023-07-10

### Fixed

- Don't use `require` to import `VError`.

## [0.3.0] - 2023-07-02

### Added

- `setOutputs`

## [0.2.0] - 2023-06-28

### Added

- Git tag publish labels.

## [0.1.0] - 2023-06-28

### Added

- First iteration of the library. Exported utility functions include:
    - `GitHubClient`, `GitHubRepositoryClient`
    - GitHub Actions utilities

[0.13.7]: https://github.com/infra-blocks/ts-github/compare/v0.13.6...v0.13.7
[0.13.6]: https://github.com/infra-blocks/ts-github/compare/v0.13.5...v0.13.6
[0.13.5]: https://github.com/infra-blocks/ts-github/compare/v0.13.4...v0.13.5
[0.13.4]: https://github.com/infra-blocks/ts-github/compare/v0.13.3...v0.13.4
[0.13.3]: https://github.com/infra-blocks/ts-github/compare/v0.13.2...v0.13.3
[0.13.2]: https://github.com/infra-blocks/ts-github/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/infra-blocks/ts-github/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/infra-blocks/ts-github/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/infra-blocks/ts-github/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/infra-blocks/ts-github/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/infra-blocks/ts-github/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/infra-blocks/ts-github/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/infra-blocks/ts-github/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/infra-blocks/ts-github/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/infra-blocks/ts-github/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/infra-blocks/ts-github/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/infra-blocks/ts-github/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/infra-blocks/ts-github/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/infra-blocks/ts-github/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/infra-blocks/ts-github/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/infra-blocks/ts-github/releases/tag/v0.1.0
