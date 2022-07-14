import { ethers } from "ethers";

const axios = require("axios");

export default async function parseExternalContractTransaction(contractAddress, txData) {

  console.log("PARSE", contractAddress, txData)
  try {
    let response = await axios.get('https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=' + contractAddress + '&apikey=NS4S9UP9T8TDMPVI9H9RWH572AKWQPI4UN')
    console.log("response", response);

    const getParsedTransaction = async () => {
      const abi = response?.data?.result;
      if (abi && txData && txData !== "") {
        const iface = new ethers.utils.Interface(JSON.parse(abi));
        return iface.parseTransaction({ data: txData });
      }
    }

    return await getParsedTransaction();
  } catch (error) {
    console.log("parseExternalContractTransaction error:", error);
  }
};
