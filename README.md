# ren-js substrate example

## Setup

Download and setup [github.com/renproject/ren-substrate](github.com/renproject/ren-substrate).

Build RenJS:

```sh
git submodule init
git submodule update
cd ./ren-js
yarn run link
npx lerna run link
yarn install
yarn build
cd ../
yarn link @renproject/ren @renproject/networks
```

Run JS example:

```sh
yarn install
yarn start
```
