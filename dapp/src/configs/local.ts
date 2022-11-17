export const PROVIDER_URLS = {
  "1": import.meta.env.VITE_MAINNET_RPC_URL,
  "42161": import.meta.env.VITE_ARBITRUM_RPC_URL,
  "100": import.meta.env.VITE_GNOSIS_RPC_URL,
};

export const CONFIG = {
  daiMainnet: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    chainId: 1,
  },
  daiArbitrum: {
    address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    chainId: 42161,
  },
  daiGnosis: {
    address: '0x44fA8E6f47987339850636F88629646662444217',
    chainId: 100,
  },
  tokenStoreAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
}
