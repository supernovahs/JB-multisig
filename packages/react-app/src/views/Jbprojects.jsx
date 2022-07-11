import { Button, Input } from "antd";
import LocaleProvider from "antd/lib/locale-provider";
import paymentterminalabi from "../helpers/paymentterminalabi.json";
import { useState } from "react";
import { parseEther } from "@ethersproject/units";

const ethers = require("ethers");

export default function Jbprojects({
  address,
  LocalProvider,
  signer,
  readContracts,
  writeContracts,
  tx,
  nonce,
  poolServerUrl,
  contractName,
  signaturesRequired,
}) {
  const [amount, setAmount] = useState("0");
  console.log("address", address);
  const projectid = 4288;
  const payamount = 100000000000000;
  const token = "0x0000000000000000000000000000000000000000";
  const beneficiary = address;
  const minimumreturnedtokens = 0;
  const preferClaimedtokens = true;
  const memo = "Buidl";
  const metadata = "0x00";
  const ifacepaymentterminal = new ethers.utils.Interface(paymentterminalabi);
  const paymentterminaladdress = "0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8";

  const paytransaction = async () => {
    try {
      let paymentcalldata;
      let executeToAddress = paymentterminaladdress;

      paymentcalldata = ifacepaymentterminal.encodeFunctionData("pay", [
        projectid,
        payamount,
        token,
        beneficiary,
        minimumreturnedtokens,
        preferClaimedtokens,
        memo,
        metadata,
      ]);
      console.log("paymentcalldata", paymentcalldata);

      const newHash = await readContracts[contractName].getTransactionHash(
        nonce.toNumber(),
        executeToAddress,
        parseEther("" + parseFloat(amount).toFixed(12)),
        paymentcalldata,
      );
      console.log("newHash", newHash);

      // const signature =
    } catch (err) {
      console.log("error in pay tx", err);
    }
  };

  return (
    <div>
      <h1>Jbprojects</h1>
      <Input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />

      <Button onClick={async () => {}}>Pay</Button>
    </div>
  );
}
