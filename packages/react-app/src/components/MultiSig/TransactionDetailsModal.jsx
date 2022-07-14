import React from "react";
import { Modal, Button } from "antd";
import { Address, Balance } from "..";
import { ethers } from "ethers";

export default function TransactionDetailsModal({
  visible,
  handleOk,
  handleCancel,
  mainnetProvider,
  price,
  txnInfo,
  showFooter = true,
}) {
  console.log("n-txinfo", txnInfo);

  return (
    <Modal
      title="Transaction Details"
      width={"90%"}
      visible={visible}
      onCancel={handleCancel}
      destroyOnClose
      onOk={handleOk}
      closable
      maskClosable
      footer={
        showFooter
          ? [
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button key="ok" type="primary" onClick={handleOk}>
                Propose
              </Button>,
            ]
          : null
      }
    >
      {txnInfo && (
        <div className="flex flex-col">
          <p>
            <b>Event Name :</b> {txnInfo.functionFragment.name}
          </p>
          <p>
            <b>Function Signature :</b> {txnInfo.signature}
          </p>
          <h4>Arguments :&nbsp;</h4>
          <div>
            <table className="border--4 w-full table-auto border-collapse border border-slate-500">
              <tr>
                {/* <th>Key</th>
                <th>Value</th> */}
              </tr>
              {/* <tr>
                <td>Centro comercial Moctezuma</td>
                <td>Francisco Chang</td>
              </tr> */}
              {txnInfo.functionFragment.inputs.map((element, index) => {
                if (element.type === "address") {
                  return (
                    <tr key={element.name}>
                      <td className="border border-slate-700">
                        <b>{element.name} :&nbsp;</b>
                      </td>
                      <td className="border border-slate-700">
                        <Address fontSize={16} address={txnInfo.args[index]} ensProvider={mainnetProvider} />
                      </td>
                    </tr>
                  );
                } else if (element.type === "uint256") {
                  return (
                    <tr className="border--2" key={element.name}>
                      {element.name === "_amount" ? (
                        <>
                          <td className="border border-slate-700">
                            <b>{element.name} : </b>{" "}
                          </td>
                          <td className="border border-slate-700 ">
                            <Balance fontSize={16} balance={txnInfo.args[index]} dollarMultiplier={price} />{" "}
                          </td>
                        </>
                      ) : (
                        <>
                          {
                            <tr>
                              <td className="border border-slate-700">
                                <b>{element.name} : </b>
                              </td>

                              <td className="border border-slate-700">
                                {txnInfo.args[index] &&
                                  txnInfo.args[index]?.toNumber &&
                                  txnInfo.args[index]?.toNumber()}
                              </td>
                            </tr>
                          }
                        </>
                      )}
                    </tr>
                  );
                } else if (element.type === "bool") {
                  return (
                    <tr key={element.name}>
                      <td className="border border-slate-700 font-bold">{element.name}</td>
                      <td className="border border-slate-700 ">{txnInfo.args[index]}</td>
                    </tr>
                  );
                } else {
                  return (
                    <tr key={element.name}>
                      {
                        <>
                          <td className="border border-slate-700 ">
                            <b>{element.name} : </b>
                          </td>

                          <td className="border border-slate-700 ">
                            {JSON.stringify(txnInfo.args[index]).toString().slice(0, 65)}
                          </td>
                        </>
                      }
                    </tr>
                  );
                }
              })}
            </table>
          </div>

          <p className="my-4">
            <b>SigHash : &nbsp;</b>
            {txnInfo.sighash}
          </p>
        </div>
      )}
    </Modal>
  );
}
