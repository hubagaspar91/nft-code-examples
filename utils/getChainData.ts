import supportedChains from './chains';
import { IChainData } from '../types/chain/IChainData';

export function getChainData(
  chainIdOrNetworkName: number | string
): IChainData {
  const chainData =
    typeof chainIdOrNetworkName === 'number'
      ? supportedChains.find(
          (chain: any) => chain.chain_id === chainIdOrNetworkName
        )
      : supportedChains.find(
          (chain: any) => chain.network === chainIdOrNetworkName
        );

  if (!chainData) {
    throw new Error('ChainId missing or not supported');
  }

  // this logic is only needed, if the solution does not use the injected provider by the MetaMask chrome extension
  // in that case (for instance, on the backend), the app has to have a direct connection to an Ethereum full node
  // Infura is a service provider who provides such connections on a monthly subscription basis
  const API_KEY = process.env.INFURA_ID;

  if (
    chainData.rpc_url.includes('infura.io') &&
    chainData.rpc_url.includes('%API_KEY%') &&
    API_KEY
  ) {
    const rpcUrl = chainData.rpc_url.replace('%API_KEY%', API_KEY);

    return {
      ...chainData,
      rpc_url: rpcUrl
    };
  }

  return chainData;
}
