# ren-js substrate example

## Setup

Download and setup [github.com/renproject/ren-substrate](github.com/renproject/ren-substrate).

Build RenJS:

```sh
git submodule init
git submodule update
cd ./ren-js
yarn install
yarn run link
cd ../
yarn link @renproject/ren
```

Run JS example:

```sh
yarn install
yarn start
```
