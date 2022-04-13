export interface DeployedContracts {
  DEMO_TOKEN: string,
  OWNER: string,
}

export const DEPLOYED_CONTRACTS: {[key: string]: DeployedContracts} = {
  localhost: {
    DEMO_TOKEN: process.env.DEMO_TOKEN || '',
    OWNER: '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199', // Account #19
  }
}