const {ethers} = require('ethers');

const apiKeys = {}
const contractAddress = ''; // smart contract address
const abi = [];  // JSON interface for interaction with the contract, will be provided

const listenToEvent = () => {
  const provider = ethers.getDefaultProvider(
    'homestead',  // network name, "homestead" is ethereum mainnet, "rinkeby" is our preferred testnet
    apiKeys // apiKeys for multiple service providers that provide ethereum access as a service (multiple, for being fail-safe), object format: https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider
  );

  // ethers.js contract instance
  const contract = new ethers.Contract(contractAddress, abi, provider);

  contract.on('Fused', (fusedTokenId, burnedTokenId) => {
    // do something
  });
}

