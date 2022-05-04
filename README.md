# Minimal full stack ethereum web3 demonstration

## Dev Setup

```
nvm use
yarn
```

## Generate typechain bindings
```
rm -r typechain; yarn hardhat typechain
```

## Run tests
```
yarn hardhat test
```

## Deploy contract a a local environment

Start up the hardhat node (in it's own terminal):

```
yarn hardhat node
```

Run the local deploy script:

```
yarn hardhat run scripts/deploys/local.ts --network localhost
```

This script:

   * deploys the TokenStore contract
   * Updates the dapp local config to reference the deployed contract
   * deploys a couple of DemoToken erc20 contracts to assist with testing
   * Mints some demo tokens to the hardhat test Account#2

## Start dapp

```
cd dapp
yarn dev
```

In order to interact with the local setup you need to:

    * Install metamask
    * Configure metamask to point to the local hardhat environment
    * Import the hardhat test Account#2 into metamask
    * Import the demo tokens into metamask

finally open the browser at `http://localhost:3000/`

