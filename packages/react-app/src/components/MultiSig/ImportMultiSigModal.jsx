import React, { useState } from "react";
import { Button, Modal, Select, Alert } from "antd";
import { ethers } from "ethers";
import axios from "axios";

import { useLocalStorage } from "../../hooks";

import { AddressInput } from "..";

export default function ImportMultiSigModal({
  mainnetProvider,
  targetNetwork,
  networkOptions,
  multiSigs,
  setMultiSigs,
  setCurrentMultiSigAddress,
  multiSigWalletABI,
  localProvider,
  poolServerUrl,
}) {
  const [importedMultiSigs, setImportedMultiSigs] = useLocalStorage("importedMultiSigs");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [error, setError] = useState(false);
  const [address, setAddress] = useState();
  const [network, setNetwork] = useState(targetNetwork.name);

  const resetState = () => {
    setError(false);
    setAddress("");
    setNetwork(targetNetwork.name);
    setPendingImport(false);
  };

  const handleCancel = () => {
    resetState();
    setIsModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      setPendingImport(true);

      const contract = new ethers.Contract(address, multiSigWalletABI, localProvider);

      let signaturesRequired = await contract.signaturesRequired();
      let owners = await contract.owners();
      let walletName = await contract.name();
      let walletAddress = contract.address;

      let newImportedMultiSigs = importedMultiSigs || {};
      (newImportedMultiSigs[network] = newImportedMultiSigs[network] || []).push(address);
      newImportedMultiSigs[network] = [...new Set(newImportedMultiSigs[network])];
      setImportedMultiSigs(newImportedMultiSigs);

      if (network === targetNetwork.name) {
        setMultiSigs([...new Set([...newImportedMultiSigs[network], ...multiSigs])]);
        setCurrentMultiSigAddress(address);

        let reqData = {
          owners,
          signaturesRequired,
        };
        const res = await axios.post(
          poolServerUrl + `createWallet/${address}/${walletName}/${walletAddress}/${targetNetwork.chainId}`,
          reqData,
        );
        let data = res.data;
        console.log("import wallet res data: ", data);
      }

      resetState();
      setIsModalVisible(false);
    } catch (e) {
      console.log("Import error:", e);
      setError(true);
      setPendingImport(false);
    }
  };

  return (
    <>
      <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
        Import
      </Button>
      <Modal
        title="Import Multisig"
        visible={isModalVisible}
        onCancel={handleCancel}
        destroyOnClose
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!address || !network}
            loading={pendingImport}
            onClick={handleSubmit}
          >
            Import
          </Button>,
        ]}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder={"Multisig address"}
            value={address}
            onChange={setAddress}
          />
          <Select defaultValue={targetNetwork.name} onChange={value => setNetwork(value)}>
            {networkOptions}
          </Select>
          {error && <Alert message="Unable to import: this doesn't seem like a multisig." type="error" showIcon />}
        </div>
      </Modal>
    </>
  );
}
