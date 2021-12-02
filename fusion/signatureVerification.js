const Web3 = require('web3');
const web3 = new Web3();


/**
 * Client side
 *
 * send along a signature with the API call that created the CREATING state metadata entry in the db
 * The return value of this function must be sent along with the
 * @param {string} sender - address
 * @param {number} toFuse - uint
 * @param {number} toBurn - uint
 * @return {string} signature - hex bytes
 */
const createSignature = async (sender, toFuse, toBurn) => {
  // hashing together the sender address and toFuse and toBurn ids
  const message = web3.utils.soliditySha3Raw(
    {type: 'address', value: sender},
    {type: 'uint256', value: toFuse},
    {type: 'uint256', value: toBurn}
  );

  const [acc] = await web3.eth.getAccounts();

  // gotta be ignored, as this overload is not typed in the lib
  // this will prompt a metamask window to the user to sign the message
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return await web3.eth.personal.sign(message, acc);
}

/**
 * Server side
 *
 * @param {string} sender - address
 * @param {number} toFuse - uint
 * @param {number} toBurn - uint
 * @param {string} signature - hex bytes
 */
const validateSignature = async (sender, toFuse, toBurn, signature) => {
  // hashing together the sender address and toFuse and toBurn ids
  const message = web3.utils.soliditySha3Raw(
    {type: 'address', value: sender},
    {type: 'uint256', value: toFuse},
    {type: 'uint256', value: toBurn}
  );

  // recovering the address from the message and the signature
  // that originally produced the signature, by signing be message
  const address = await web3.eth.personal.ecRecover(message, signature);

  // checking, whether the message was signed by the right address
  if (address.toLowerCase() !== sender.toLowerCase()) {
    throw new Error(`Signature mismatch.`);
  }
}
