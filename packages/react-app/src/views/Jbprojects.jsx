import { Button, Input, Card } from "antd";
import LocaleProvider from "antd/lib/locale-provider";
import paymentterminalabi from "../helpers/paymentterminalabi.json";
import React, { useState } from "react";
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
  const [projectId, setProjectId] = useState("");

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

  let mockProjects = [1, 2, 3, 4];

  return (
    <div>
      {/* <h1>Jbprojects</h1> */}
      {/* <Input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} /> */}
      {/* <Button onClick={async () => {}}>Pay</Button> */}
      <div className="flex justify-center items-center flex-col w-full ">
        {/* input action */}
        <div className=" my-2">
          <Input.Group compact>
            <Input
              style={{
                width: "calc(100% - 90px)",
              }}
              placeholder="Enter project id"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
            />
            <Button type="primary">Submit</Button>
          </Input.Group>
        </div>

        {/* project cards */}
        <div className="flex justify-center flex-wrap ">
          {mockProjects.map((data, index) => {
            return (
              <div className="m-2 " key={index}>
                <Card title="Project name" className="mx-2 " extra={<a href="#">Pay</a>} style={{ width: 300 }}>
                  <div className="flex justify-center">
                    <img
                      className="w-36"
                      src="https://jbx.mypinata.cloud/ipfs/QmWXCt1zYAJBkNb7cLXTNRNisuWu9mRAmXTaW9CLFYkWVS"
                      alt="JuiceboxDAO logo"
                    ></img>
                  </div>
                  <div>Balance Ξ 232</div>
                  <div>this is demo description</div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
