import { Button, Input, InputNumber, Card, Modal } from "antd";
import LocaleProvider from "antd/lib/locale-provider";
import paymentTerminalAbi from "../helpers/paymentterminalabi.json";
import JBSingleTokenPaymentTerminalStore from "../helpers/JBSingleTokenPaymentTerminalStore.json";
import JBTokenProject from "../helpers/JBProjects.json";
import React, { useState } from "react";
import { parseEther } from "@ethersproject/units";
import axios from "axios";
import { useHistory } from "react-router-dom";

import { useEffect } from "react";

import { AddressInput, EtherInput, Address } from "../components";

const ethers = require("ethers");

const JB_TERMINAL_ADDRESS = "0x5d4eb71749dd9984118ebdf96aaf3cf6eae1a745";
const JB_PROJECTS_ADDRESS = "0x2d8e361f8F1B5daF33fDb2C99971b33503E60EEE";
const JB_PROJECTS_KEY = "JB_PROJECTS";

const PayModal = ({
  isOpen,
  setIsOpen,
  price,
  projectId,
  address,
  readContracts,
  contractName,
  nonce,
  localProvider,
  userSigner,
  poolServerUrl,
}) => {
  const history = useHistory();

  const [payAmount, setPayAmount] = useState(0);
  const [memo, setMemo] = useState("");

  const onPay = async () => {
    setIsOpen(false);

    // // const projectid = 4288;
    // const payamount = 100000000000000;
    const token = "0x0000000000000000000000000000000000000000";
    const beneficiary = address;
    const minimumreturnedtokens = 0;
    const preferClaimedtokens = true;
    // const memo = "Buidl";
    const metadata = "0x00";
    const paymentterminaladdress = "0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8";
    const ifacepaymentterminal = new ethers.utils.Interface(paymentTerminalAbi);

    try {
      let paymentcalldata;
      let executeToAddress = paymentterminaladdress;
      // console.log("payAmount: ", ethers.utils.parseEther(payAmount).toString());
      paymentcalldata = ifacepaymentterminal.encodeFunctionData("pay", [
        projectId,
        (payAmount * 10 ** 18).toString(),
        token,
        beneficiary,
        minimumreturnedtokens,
        preferClaimedtokens,
        memo,
        metadata,
      ]);
      console.log("paymentcalldata", paymentcalldata);
      console.log("nonce", nonce.toNumber());
      console.log("executeToAddress", executeToAddress);
      const newHash = await readContracts.MultiSigWallet.getTransactionHash(
        nonce.toNumber(),
        executeToAddress,
        parseEther("" + parseFloat(payAmount).toFixed(12)),
        paymentcalldata,
      );
      console.log("newHash", newHash);

      const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
      console.log("signature: ", signature);

      const recover = await readContracts[contractName].recover(newHash, signature);
      console.log("recover: ", recover);

      const isOwner = await readContracts[contractName].isOwner(recover);
      console.log("isOwner: ", isOwner);

      if (isOwner) {
        const res = await axios.post(poolServerUrl, {
          chainId: localProvider._network.chainId,
          address: readContracts[contractName]?.address,
          nonce: nonce.toNumber(),
          to: executeToAddress,
          amount: payAmount,
          data: paymentcalldata,
          hash: newHash,
          signatures: [signature],
          signers: [recover],
        });

        console.log("RESULT", res.data);
        setTimeout(() => {
          history.push("/pool");
        }, 1000);
      } else {
        console.log("ERROR, NOT OWNER.");
      }
    } catch (err) {
      console.log("error in pay tx", err);
    }
  };

  const onCancle = () => {
    setIsOpen(false);
  };

  return (
    <Modal
      title="Basic Modal"
      visible={isOpen}
      onOk={onPay.bind(this)}
      onCancel={onCancle.bind(this)}
      footer={[
        <Button key="back" onClick={onCancle.bind(this)}>
          Return
        </Button>,
        <Button
          key="submit"
          type="primary"
          // loading={loading}
          onClick={onPay}
        >
          Pay
        </Button>,
      ]}
    >
      <div className=" flex flex-col justify-start items--end">
        <div className="my-1">Project Id # {projectId}</div>
        <div className="my-1">
          <EtherInput
            placeholder="Enter pay amount"
            price={price}
            mode="USD"
            value={payAmount}
            onChange={setPayAmount}
          />
        </div>
        <div className="my-1">
          <Input placeholder="Enter memo" value={memo} onChange={e => setMemo(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

export default function Jbprojects({
  address,
  localProvider,
  userSigner,
  readContracts,
  writeContracts,
  tx,
  nonce,
  poolServerUrl,
  contractName,
  signaturesRequired,
  price,
}) {
  console.log("n-readcontracts JB", readContracts);
  // console.log("n-localprovider", localProvider);

  const [amount, setAmount] = useState("0");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectToggle, setProjectToggle] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState("");

  // const projectid = 4288;
  // // const payamount = 100000000000000;
  // const token = "0x0000000000000000000000000000000000000000";
  // const beneficiary = address;
  // const minimumreturnedtokens = 0;
  // const preferClaimedtokens = true;
  // const memo = "Buidl";
  // const metadata = "0x00";
  // const ifacepaymentterminal = new ethers.utils.Interface(paymentTerminalAbi);
  // const paymentterminaladdress = "0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8";

  // const JB_TERMINAL_ADDRESS = "0x5d4eb71749dd9984118ebdf96aaf3cf6eae1a745";
  // const JB_PROJECTS_ADDRESS = "0x2d8e361f8F1B5daF33fDb2C99971b33503E60EEE";
  // const JB_PROJECTS_KEY = "JB_PROJECTS";

  useEffect(() => {
    let projectsLocalData = localStorage.getItem(JB_PROJECTS_KEY);
    console.log("n-projectsLocalData: ", projectsLocalData);
    projectsLocalData = projectsLocalData != null ? JSON.parse(projectsLocalData) : [];
    console.log("n-projectsLocalData: ", projectsLocalData);
    setProjects(projectsLocalData["data"]);
  }, [projectToggle]);

  // const payTransaction = async () => {
  //   try {
  //     let paymentcalldata;
  //     let executeToAddress = paymentterminaladdress;

  //     paymentcalldata = ifacepaymentterminal.encodeFunctionData("pay", [
  //       projectid,
  //       payamount,
  //       token,
  //       beneficiary,
  //       minimumreturnedtokens,
  //       preferClaimedtokens,
  //       memo,
  //       metadata,
  //     ]);
  //     console.log("paymentcalldata", paymentcalldata);

  //     const newHash = await readContracts[contractName].getTransactionHash(
  //       nonce.toNumber(),
  //       executeToAddress,
  //       parseEther("" + parseFloat(amount).toFixed(12)),
  //       paymentcalldata,
  //     );
  //     console.log("newHash", newHash);

  //     // const signature =
  //   } catch (err) {
  //     console.log("error in pay tx", err);
  //   }
  // };

  // const testContract = async () => {
  //   try {
  //     let JbTerminal = new ethers.Contract(JB_PROJECTS_ADDRESS, JBSingleTokenPaymentTerminalStore, localProvider);
  //     console.log("JBToken: ", JbTerminal.address);

  //     let data = await JbTerminal.balanceOf("0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8", 4266);
  //     console.log("data: ", data);

  //     let JBProject = new ethers.Contract(JB_PROJECTS_ADDRESS, JBTokenProject, localProvider);

  //     let data1 = await JBProject.metadataContentOf(4266, 0);
  //     console.log("data1: ", data1);

  //     let ddd = await axios.get("https://ipfs.io/ipfs/QmQHGuXv7nDh1rxj48HnzFtwvVxwF1KU9AfB6HbfG8fmJF");
  //     console.log("ddd: ", ddd.data);
  //   } catch (error) {
  //     console.log("error: ", error);
  //   }
  // };

  const onAddProject = async () => {
    let currentProjectId = projectId;

    if (currentProjectId > 0) {
      let JbTerminal = new ethers.Contract(JB_TERMINAL_ADDRESS, JBSingleTokenPaymentTerminalStore, localProvider);

      let projectBalance = await JbTerminal.balanceOf("0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8", +currentProjectId);
      console.log("projectBalance: ", ethers.utils.formatEther(projectBalance));

      let JBProject = new ethers.Contract(JB_PROJECTS_ADDRESS, JBTokenProject, localProvider);

      let projectCID = await JBProject.metadataContentOf(+currentProjectId, 0);
      console.log("projectCID: ", projectCID);

      let response = await axios.get(`https://ipfs.io/ipfs/QmQHGuXv7nDh1rxj48HnzFtwvVxwF1KU9AfB6HbfG8fmJF`);
      let projectData = response.data;
      console.log("projectData: ", projectData);
      projectData["balance"] = ethers.utils.formatEther(projectBalance);
      projectData["projectId"] = projectId;

      // add project to local storage

      let projectsLocalData = localStorage.getItem(JB_PROJECTS_KEY);
      projectsLocalData = projectsLocalData != null ? JSON.parse(projectsLocalData) : [];
      projectsLocalData = projectsLocalData["data"] ? projectsLocalData["data"] : [];
      localStorage.setItem(JB_PROJECTS_KEY, JSON.stringify({ data: [...projectsLocalData, { ...projectData }] }));
      setProjectToggle(!projectToggle);
      setProjectId("");
    }
  };

  const onOpenModal = projectId => {
    setCurrentProjectId(projectId);
    setIsOpen(true);
  };

  return (
    <div>
      {isOpen && (
        <PayModal
          key={String(isOpen)}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          price={price}
          projectId={currentProjectId}
          address={address}
          nonce={nonce}
          userSigner={userSigner}
          poolServerUrl={poolServerUrl}
          contractName={contractName}
          readContracts={{ ...readContracts }}
          localProvider={{ ...localProvider }}
        />
      )}

      <div className="flex justify-center items-center flex-col w-full ">
        {/* <button onClick={testContract}>test</button> */}
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
            <Button type="primary" onClick={onAddProject}>
              Submit
            </Button>
          </Input.Group>
        </div>

        {/* project cards */}
        <div className="flex justify-center flex-wrap ">
          {projects &&
            projects.length > 0 &&
            projects.map((data, index) => {
              // balance: "0.112750562368"
              // description: "Supports projects built using the Juicebox protocol, and the development of the protocol itself. All projects withdrawing funds from their treasury pay a 2.5% membership fee and receive JBX at the current issuance rate. JBX members govern the NFT that represents ownership over this treasury."
              // discord: "https://discord.gg/W9mTVG4QhD"
              // infoUri: "https://snapshot.org/#/jbdao.eth"
              // logoUri: "https://jbx.mypinata.cloud/ipfs/QmWXCt1zYAJBkNb7cLXTNRNisuWu9mRAmXTaW9CLFYkWVS"
              // name: "JuiceboxDAO"
              // payButton: "Add juice"
              // tokens: []
              // twitter: "juiceboxETH"
              // version: 4
              return (
                <div className="m-2 " key={index}>
                  <Card
                    title={data.name}
                    className="mx-2 "
                    extra={
                      <button className="text-blue-600" onClick={() => onOpenModal(data.projectId)}>
                        Pay
                      </button>
                    }
                    style={{ width: 300 }}
                  >
                    <div className="flex justify-center">
                      <img
                        className="w-36"
                        // src="https://jbx.mypinata.cloud/ipfs/QmWXCt1zYAJBkNb7cLXTNRNisuWu9mRAmXTaW9CLFYkWVS"
                        src={data.logoUri}
                        alt="JuiceboxDAO logo"
                      ></img>
                    </div>
                    <div>Balance Ξ {Number(data.balance).toFixed(4)}</div>
                    <div className="text-xs text-left text-gray-500">{data.description}</div>
                  </Card>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
