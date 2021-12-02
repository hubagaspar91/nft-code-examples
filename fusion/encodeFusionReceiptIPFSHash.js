const bs58 = require('bs58');

/**
 *
 * @param {string} fusionReceiptIPFSHashHex - fusionReceiptIPFSHash stored on the contract, sent in the Fused event
 * @return {string} - IPFS hash that can be used as an URI to access the content
 */
const main = (fusionReceiptIPFSHashHex) => {
  return bs58.encode(Buffer.from(fusionReceiptIPFSHashHex.slice(2), 'hex'));
}
