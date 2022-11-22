const MAINNET =   {
  name: "Ethereum Mainnet",
  chainId: 1,
  rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL,
  metamaskRpcUrl: "https://ethereum.publicnode.com",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  }
}

const ARBITRUM =   {
  name: "Arbitrum One",
  chainId: 42161,
  rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL,
  metamaskRpcUrl: "https://arb1.arbitrum.io/rpc",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  }
}

const GNOSIS = {
  name: "Gnosis",
  chainId: 100,
  rpcUrl: import.meta.env.VITE_GNOSIS_RPC_URL,
  metamaskRpcUrl: "https://rpc.gnosischain.com",
  nativeCurrency: {
    name: "xDAI",
    symbol: "xDAI",
    decimals: 18,
  }
}

export const CHAINS = [
  MAINNET,
  ARBITRUM,
  GNOSIS,
];

export const TOKENS = [
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    chainId: MAINNET.chainId,
  },
  {
    address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    chainId: ARBITRUM.chainId,
  },
  {
    address: '0x44fA8E6f47987339850636F88629646662444217',
    chainId: 100,
  },
];
