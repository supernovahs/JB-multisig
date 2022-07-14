import React, { useState, useEffect } from "react";
import { Button, List } from "antd";

import { Address, Balance, Blockie } from "..";
import TransactionDetailsModal from "./TransactionDetailsModal";
import { EllipsisOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import { parseEther } from "@ethersproject/units";
import { parseExternalContractTransaction } from "../../helpers";

const axios = require("axios");

export default function TransactionListItem({
  item,
  mainnetProvider,
  blockExplorer,
  price,
  readContracts,
  contractName,
  children,
}) {
  //console.log("coming in item:", item);
  item = item.args ? item.args : item;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [txnData, setTxnData] = useState({});

  const showModal = () => {
    setIsModalVisible(true);
  };

  useEffect(() => {
    if (!txnData[item.hash]) {
      try {
        const parsedData = item.data != "0x" ? readContracts[contractName].interface.parseTransaction(item) : null;
        //console.log("SET",JSON.stringify(item),JSON.stringify(parsedData))
        const newData = {};
        newData[item.hash] = parsedData;
        setTxnData({ ...txnData, ...newData });
      } catch (argumentError) {
        const getParsedTransaction = async () => {
          const parsedTransaction = await parseExternalContractTransaction(item.to, item.data);
          const newData = {};
          newData[item.hash] = parsedTransaction;
          setTxnData({ ...txnData, ...newData });
        };
        getParsedTransaction();
      }
    }
  }, [item]);
  // console.log("txndata  list item ", txnData);

  let functionName = txnData[item.hash]?.functionFragment?.name;
  let projectId = txnData[item.hash]?.args["_projectId"]?.toString();
  // console.log("n-projectId: ", projectId);

  const projectCID =
    functionName === "launchProjectFor" ? (txnData[item.hash]?.args[1] ? txnData[item.hash]?.args[1][0] : "") : "";
  console.log("n-projectCID: ", projectCID);
  console.log("n-txnData[item.hash]?.args[1]: ", txnData[item.hash]?.args[1]);

  const txDisplay = () => {
    const toSelf = item?.to == readContracts[contractName].address;

    if (toSelf && txnData[item.hash]?.functionFragment?.name == "addSigner") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Add Signer</span>
          {ethers.utils.isAddress(txnData[item.hash]?.args[0]) && (
            <Address
              address={txnData[item.hash]?.args[0]}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              fontSize={16}
            />
          )}
          <span style={{ fontSize: 16 }}>with threshold {txnData[item.hash]?.args[1]?.toNumber()}</span>
          <>{children}</>
        </>
      );
    } else if (toSelf && txnData[item.hash]?.functionFragment?.name == "removeSigner") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Remove Signer</span>
          {ethers.utils.isAddress(txnData[item.hash]?.args[0]) && (
            <Address
              address={txnData[item.hash]?.args[0]}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              fontSize={16}
            />
          )}
          <span style={{ fontSize: 16 }}>with threshold {txnData[item.hash]?.args[1]?.toNumber()}</span>
          <>{children}</>
        </>
      );
    } else if (txnData[item.hash]?.functionFragment?.name === "pay") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Pay</span>
          <Balance
            balance={item.value ? item.value : parseEther("" + parseFloat(item.amount).toFixed(12))}
            dollarMultiplier={price}
          />
          to
          <b>ProjectId:&nbsp; {txnData[item.hash]?.args[0].toNumber()}</b>
          {/* <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} /> */}
          <>{children}</>
        </>
      );
    } else if (txnData[item.hash]?.functionFragment?.name === "launchProjectFor") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Register New Project</span>

          <b>Owner:</b>
          {/* <b>ProjectId:&nbsp; {txnData[item.hash]?.args[0].toNumber()}</b> */}
          <Address
            address={txnData[item.hash]?.args[0]}
            ensProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            fontSize={16}
          />

          <a href={`https://ipfs.io/ipfs/${projectCID}`} target="_blank">
            Metadata
          </a>
          <>{children}</>
        </>
      );
    } else if (txnData[item.hash]?.functionFragment?.name === "reconfigureFundingCyclesOf") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Reconfigure</span>

          <b>For</b>
          <b>ProjectId:&nbsp; {txnData[item.hash]?.args[0].toNumber()}</b>
          <>{children}</>
        </>
      );
    } else if (txnData[item.hash]?.functionFragment?.name === "issueTokenFor") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Issue ERC20 Tokens</span>

          <b>For</b>
          <b>ProjectId:&nbsp; {txnData[item.hash]?.args[0].toNumber()}</b>
          <b>Token Name: &nbsp; {txnData[item.hash]?.args[1]}</b>
          <b>Token Symbol: &nbsp; {txnData[item.hash]?.args[2]}</b>
          <>{children}</>
        </>
      );
    } else if (!txnData[item.hash]?.functionFragment?.name) {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Transfer </span>
          <Balance
            balance={item.value ? item.value : parseEther("" + parseFloat(item.amount).toFixed(12))}
            dollarMultiplier={price}
          />
          to
          <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
          <>{children}</>
        </>
      );
    } else if (txnData[item.hash]?.signature != "") {
      return (
        <>
          <span style={{ fontSize: 16, fontWeight: "bold" }}>Call</span>
          <span style={{ fontSize: 16 }}>
            <Button style={{ margin: 4 }} disabled={!txnData[item.hash]} onClick={showModal}>
              <EllipsisOutlined />
            </Button>
          </span>
          <span style={{ fontSize: 16 }}>on</span>
          <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={16} />
          <>{children}</>
        </>
      );
    } else {
      return (
        <>
          <div>
            <i>Unknown transaction type...If you are reading this please screenshot and send to @austingriffith</i>
          </div>
          {ethers.utils.isAddress(txnData?.args[0]) && (
            <Address
              address={txnData.args[0]}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              fontSize={16}
            />
          )}
          <Balance
            balance={item.value ? item.value : parseEther("" + parseFloat(item.amount).toFixed(12))}
            dollarMultiplier={price}
          />
          <>{children}</>
          <Button disabled={!txnData[item.hash]} onClick={showModal}>
            <EllipsisOutlined />
          </Button>
          <div
            style={{
              fontSize: 12,
              opacity: 0.5,
              display: "flex",
              justifyContent: "space-evenly",
              width: "100%",
            }}
          >
            <p>
              <b>Event Name :&nbsp;</b>
              {txnData ? txnData[item.hash].functionFragment?.name : "Transfer Funds"}&nbsp;
            </p>
            <p>
              <b>To:&nbsp;</b>
              <Address address={item.to} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={12} />
            </p>
          </div>
        </>
      );
    }
  };

  console.log("n-item: ", item);
  // console.log("n-txnData[item.hash]: ", txnData[item.hash]);

  return (
    <>
      <TransactionDetailsModal
        visible={isModalVisible}
        txnInfo={txnData[item.hash]}
        handleOk={() => setIsModalVisible(false)}
        handleCancel={() => setIsModalVisible(false)}
        mainnetProvider={mainnetProvider}
        price={price}
      />
      {
        // <List.Item key={item.hash} style={{ position: "relative", display: "flex", flexWrap: "wrap", width: 800 }}>
        <List.Item style={{ border: 0 }} key={item.hash} className="b--red m-5 ">
          <>
            {functionName !== "pay" && (
              <a href={blockExplorer + "tx/" + item.hash} target="_blank" rel="noreferrer">
                <b style={{ padding: 16 }}>#{typeof item.nonce === "number" ? item.nonce : item.nonce.toNumber()}</b>
              </a>
            )}

            {functionName === "pay" && (
              <a href={`https://rinkeby.juicebox.money/#/v2/p/${projectId}`} target="_blank" rel="noreferrer">
                <b style={{ padding: 16 }}>#{typeof item.nonce === "number" ? item.nonce : item.nonce.toNumber()}</b>
              </a>
            )}
            {txDisplay()}
            <Blockie size={4} scale={8} address={item.hash} />
          </>
        </List.Item>
      }
    </>
  );
}
