import Web3Modal from 'web3modal';
import Web3 from 'web3';
import { createContext, Dispatch, useEffect, useReducer } from 'react';
import { Action } from '../types/dataflow/Action';

export type WalletState = {
  connected: boolean;
  connectedChainId: number;
  connectedAccount: string;
};

export type WalletConnectPayload = {
  account: string;
  chainId: number;
};

export type IWalletContext = {
  web3: Web3;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  state: WalletState;
};

const web3Instance = new Web3();
// not initializing here, as it uses window, which is undefined on the server, therefore Next build throws an error
let web3ModalInstance: Web3Modal;

const subscribeWalletEvents = (dispatch: Dispatch<any>, provider: any) => {
  provider.on('disconnect', () => dispatch(createDisconnect()));
  // reloading page here as well, to avoid errors
  provider.on('accountsChanged', () => window.location.reload());
  // metamask recommendation
  provider.on('chainChanged', () => window.location.reload());
};

const removeWalletEventSubscribers = (provider: any) => {
  provider.removeAllListeners('accountsChanged');
  provider.removeAllListeners('disconnect');
  provider.removeAllListeners('chainChanged');
};

export const initialState: WalletState = {
  connected: false,
  connectedChainId: 0,
  connectedAccount: ''
};

export const WalletContext = createContext<IWalletContext>({
  web3: web3Instance,
  connect: async () => undefined,
  disconnect: async () => undefined,
  state: initialState
});

export const CONNECT = 'connect';
export const DISCONNECT = 'disconnect';

export const createConnect = (
  payload: WalletConnectPayload
): Action<WalletConnectPayload> => ({
  type: CONNECT,
  payload
});
export const createDisconnect = (): Action<any> => ({
  type: DISCONNECT,
  payload: null
});

const reducer = (
  state: WalletState,
  { type, payload }: { type: string; payload: any }
): WalletState => {
  switch (type) {
    case CONNECT:
      const connectPayload: WalletConnectPayload = payload;
      return {
        ...state,
        connectedChainId: connectPayload.chainId,
        connectedAccount: connectPayload.account,
        connected: true
      };
    case DISCONNECT:
      return { ...state, ...initialState };
    default:
      throw new Error(`No such action type: ${type}`);
  }
};

function WalletContextProvider({ children }: { children: any }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { connected } = state;

  const connect = async () => {
    if (connected) {
      return;
    }

    let provider;
    try {
      if (!web3ModalInstance) {
        web3ModalInstance = new Web3Modal({
          cacheProvider: true
        });
      }
      provider = await web3ModalInstance.connect();
      web3Instance.setProvider(provider);
    } catch (e) {
      web3ModalInstance.clearCachedProvider();
      return;
    }

    const accounts = await web3Instance.eth.getAccounts();
    const account = accounts[0];

    const chainId = await web3Instance.eth.getChainId();

    subscribeWalletEvents(dispatch, provider);

    dispatch(createConnect({ account, chainId }));
  };

  const disconnect = async () => {
    if (!connected) {
      return;
    }

    const provider = web3Instance.currentProvider as any;
    if (typeof provider.close === 'function') {
      await provider.close();
    }

    removeWalletEventSubscribers(provider);

    if (web3ModalInstance) {
      await web3ModalInstance.clearCachedProvider();
    }

    dispatch(createDisconnect());
  };

  const defaultValue: IWalletContext = {
    web3: web3Instance,
    connect,
    disconnect,
    state
  };

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WalletContext.Provider value={defaultValue}>
      {children}
    </WalletContext.Provider>
  );
}

export default WalletContextProvider;
