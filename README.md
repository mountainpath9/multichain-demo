# Minimal hardhat/typechain/openzeppelin starter

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

Run the deploy script:

```
yarn hardhat run scripts/deploys/local.ts --network localhost
```
