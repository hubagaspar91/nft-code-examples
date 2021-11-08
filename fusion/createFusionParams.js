const Web3 = require('web3');
const bs58 = require('bs58');

const web3 = new Web3();

const mockPrivateKey = '';  // a private key that is gonna be used to generate the signatures

// function to create the arguments for calling the fusion method on the smart contract
// sender - eth address
// toFuse - tokenId
// toBurn - tokenId
// catalysts - integer
// fusionReceiptIPFSHash - IPFS hash of  the fusion receipts (string)
const createFusionParams = (sender, toFuse, toBurn, catalysts, fusionReceiptIPFSHash) => {
  // IPFS hashes are base58 encoded by default, and are 34 bytes long
  // a 32 bytes hash, and the first two bytes, that signify the hash function used
  // here we decode the IPFS hash, convert it to hex and strip the first two bytes, that are not a part of the content hash
  // this is so, that we can store the actual IPFS uri as bytes32 on the contract, which is cheaper
  const fusionReceiptIPFSHashBytes32 = '0x' + bs58.decode(fusionReceiptIPFSHash).slice(2).toString('hex');

  // the message that is to be signed, containing all important details of the fusion
  const msg = web3.utils.soliditySha3Raw(
    {type: 'address', value: sender},
    {type: 'uint256', value: toFuse},
    {type: 'uint256', value: toBurn},
    {type: 'uint256', value: catalysts},
    {type: 'bytes32', value: fusionReceiptIPFSHashBytes32}
  );

  // signing the message with the private key
  const {signature} = web3.eth.accounts.sign(msg, mockPrivateKey);

  // start to assemble payload, that is a bytes array
  // byte 0 -> number of catalysts needed
  // byte 1 - 32 -> ipfs hash
  // byte 32 - end -> signature
  const payloadBytes = web3.utils.hexToBytes(signature);
  const ipfsHashBytes = web3.utils.hexToBytes(fusionReceiptIPFSHashBytes32);
  payloadBytes.unshift(...ipfsHashBytes);
  payloadBytes.unshift(catalysts);

  // these are the params to call the contract method with
  return [toFuse, toBurn, web3.utils.bytesToHex(payloadBytes)];
}
