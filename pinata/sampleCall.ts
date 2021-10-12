import pinataSDK from '@pinata/sdk';
import fs from 'fs';

// initializing the client with credentials obtained from the Pinata interface at pinata.cloud
const pinata = pinataSDK('yourPinataApiKey', 'yourPinataSecretApiKey');


const main = async () => {
  const imageStream = fs.createReadStream(`./path/to/image.jpg`);
  // pinning is basically IPFS talk for storing files on the IPFS network, that can be accessed
  // IpfsHash is the hash that can be used to access the pinned file
  // either a native ipfs path have to be used, i.e.: ipfs://<IpfsHash>
  // the above only works from a browser, if the IPFS extension is installed
  // a more common way to access files stored on IPFS is through IPFS http gateways
  // one of the official works like: https://ipfs.io/ipfs/<IpfsHash>
  const {IpfsHash} = await pinata.pinFileToIPFS(imageStream, {});
  // pinning JSON data is easier using another Pinata endpoint:
  const json = {data: 'example'};
  const {IpfsHash} = await pinata.pinJSONToIPFS(json, {});
  // detailed docs at: https://github.com/PinataCloud/Pinata-SDK
}
