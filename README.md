# ts-github

GitHub and GitHub actions related utilities.

## Development

### Repo init

This repository leverages [nvm](https://github.com/nvm-sh/nvm) and users should have it installed in their local environment.
In addition, it is recommended that users install a [shell hook](https://github.com/nvm-sh/nvm#deeper-shell-integration)
so that `nvm use` is run upon changing into a project that utilises `nvm`.

Upon checking out the repository, run the following commands:
```shell
nvm install
npm install
npm run compile
npm run lint
npm run test
```

### Package publication

Package publication is done manually at the moment.
