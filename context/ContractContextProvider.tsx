import { createContext, useContext, useEffect, useState } from 'react';
import { WalletContext } from './WalletContextProvider';
import { getChainData } from '../utils/getChainData';
import ContractsContent from '../content/contracts.json';

export type IMainContract = {
  totalSupply: () => Promise<number>;
  maxTotalSupply: () => Promise<number>;
  mintTokens: (numTokens: number) => Promise<void>;
  tokenPrice: () => Promise<number>;
  presaleActiveUntil: () => Promise<number>;
  isPresaleActive: () => Promise<boolean>;
  presaleTokensForAddress: (address: string) => Promise<number>;
  saleIsActive: () => Promise<boolean>;
  maxPurchase: () => Promise<number>;
};

export type IContractContext = {
  main: {
    loaded: boolean;
    address?: string;
    error?: string;
    interface?: IMainContract;
  };
};

export const ContractContext = createContext<IContractContext>({
  main: {
    loaded: false
  }
});

function ContractContextProvider({ children }: { children: any }) {
  const walletContext = useContext(WalletContext);

  const [contextObj, setContextObj] = useState<IContractContext>({
    main: {
      loaded: false
    }
  });
  const tempContextObj: IContractContext = {
    main: {
      loaded: false
    }
  };

  const setup = async () => {
    // determining which Ethereum chain MetaMask is connected to
    const chainId = await walletContext.web3.eth.getChainId();
    const chainData = getChainData(chainId);
    // main
    const mainDeployment = ContractsContent.main.deployments.find(
      (deployment) => deployment.network === chainData.network
    );
    if (!mainDeployment) {
      const deployedNetworks = ContractsContent.main.deployments.map(
        (d) => getChainData(d.network).name
      );

      tempContextObj.main.error = `Please connect to${
        deployedNetworks.length > 1 ? ' one of' : ''
      }: ${deployedNetworks.join(', ')}`;
    } else {
      tempContextObj.main.address = mainDeployment.address;
      tempContextObj.main.error = undefined;

      // web3 contract instance
      const contract = new walletContext.web3.eth.Contract(
        JSON.parse(ContractsContent.main.abi),  // abi defines the interface for interacting with the contract
        mainDeployment.address  // the address where the contract is deployed on the blockchain
      );

      // main contract interface
      // numerical values are returned as strings by default
      // as ether values are expressed in wei, which is 1/10 ** 18 ether
      // so js's MAX_SAFE_INTEGER is passed pretty quickly
      tempContextObj.main.interface = {
        totalSupply: async () =>
          parseInt(await contract.methods.totalSupply().call()),
        maxTotalSupply: async () =>
          parseInt(await contract.methods.MAX_TOTAL_SUPPLY().call()),
        tokenPrice: async () =>
          parseInt(await contract.methods.TOKEN_PRICE().call()),
        presaleActiveUntil: async () =>
          parseInt(await contract.methods.presaleActiveUntil().call()),
        isPresaleActive: contract.methods.isPresaleActive().call,
        presaleTokensForAddress: async (address: string) =>
          parseInt(
            await contract.methods.presaleTokensForAddress(address).call()
          ),
        saleIsActive: contract.methods.saleIsActive().call,
        maxPurchase: async () =>
          parseInt(await contract.methods.MAX_PURCHASE().call()),
        mintTokens: async (numTokens: number) => {
          const contractMethod = contract.methods.mintTokensPresale(numTokens);
          const tokenPriceEth =
            parseInt(await contract.methods.TOKEN_PRICE().call()) / 10 ** 18;
          const opts = {
            from: walletContext.state.connectedAccount,
            to: tempContextObj.main.address,
            value: walletContext.web3.utils.toWei(
              (tokenPriceEth * numTokens).toString(),
              'ether'
            ),
            // setting these to null, so metamask gas price estimations will be used for the transaction
            maxPriorityFeePerGas: null,
            maxFeePerGas: null
          };
          // estimating the gas cost of the transaction
          // gas paid for the transaction === gasCost * gasPrice
          const gasEstimate = await contractMethod.estimateGas(opts);
          const tx = {
            ...opts,
            data: contractMethod.encodeABI(),
            // adding a padding the the estimated value, as estimations are not always accurate
            // and setting a value that's too low will result in an exception
            gas: parseInt(String(1.25 * gasEstimate))
          };
          try {
            await walletContext.web3.eth.sendTransaction(tx);
          } catch (e) {
            console.log(e);
          }
        }
      };
    }
    tempContextObj.main.loaded = true;
    setContextObj(tempContextObj);
  };

  useEffect(() => {
    if (walletContext.state.connected) {
      setup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletContext.state.connected]); // changing chain in metamask reloads the page, so only need to watch this

  return (
    <ContractContext.Provider value={contextObj}>
      {children}
    </ContractContext.Provider>
  );
}

export default ContractContextProvider;
