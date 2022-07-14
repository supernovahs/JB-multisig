import { Button, Input, Badge } from "antd";
import { CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import WalletConnect from "@walletconnect/client";
import QrReader from "react-qr-reader";
import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks";
import { parseExternalContractTransaction } from "../helpers";
import TransactionDetailsModal from "./MultiSig/TransactionDetailsModal";

const WalletConnectInput = ({ chainId, address, loadWalletConnectData, mainnetProvider, price }) => {
  const [walletConnectConnector, setWalletConnectConnector] = useLocalStorage("walletConnectConnector");
  const [wallectConnectConnectorSession, setWallectConnectConnectorSession] = useLocalStorage(
    "wallectConnectConnectorSession",
  );
  const [walletConnectUri, setWalletConnectUri] = useLocalStorage("walletConnectUri", "");
  const [isConnected, setIsConnected] = useLocalStorage("isConnected", false);
  const [peerMeta, setPeerMeta] = useLocalStorage("peerMeta");
  const [data, setData] = useState();
  const [to, setTo] = useState();
  const [value, setValue] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parsedTransactionData, setParsedTransactionData] = useState();
  const [scan, setScan] = useState(false);

  useEffect(() => {
    if (walletConnectUri) {
      setupAndSubscribe();
    }
  }, [walletConnectUri]);

  useEffect(
    () => {
      if (address && !isConnected) {
        resetConnection();
      }
    },
    [address],
    isConnected,
  );

  const setupAndSubscribe = () => {
    const connector = setupConnector();
    if (connector) {
      subscribeToEvents(connector);
      setWalletConnectConnector(connector);
    }
  };

  const setupConnector = () => {
    console.log(" 📡 Connecting to Wallet Connect....", walletConnectUri);
    let connector;
    try {
      connector = new WalletConnect({ uri: walletConnectUri });
      // return connector;
    } catch (error) {
      console.error("setupConnector error:", error);
      localStorage.removeItem("walletConnectUri");
      setWalletConnectUri("");
      return;
    }
    setWalletConnectConnector(connector);
    return connector;
  };

  const subscribeToEvents = connector => {
    connector.on("session_request", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log("Event: session_request", payload);
      setPeerMeta(payload.params[0].peerMeta);

      connector.approveSession({
        accounts: [address],
        chainId,
      });

      if (connector.connected) {
        setIsConnected(true);
        console.log("Session successfully connected.");
      }
    });
    //
    connector.on("call_request", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log("Event: call_request", payload);
      parseCallRequest(payload);
    });
    //

    connector.on("disconnect", (error, payload) => {
      localStorage.removeItem("walletconnect"); // lololol
      console.log("Event: disconnect", payload);
      resetConnection();
      if (error) {
        throw error;
      }
    });
  };
  //
  useEffect(() => {
    if (!isConnected) {
      let nextSession = localStorage.getItem("wallectConnectNextSession");
      if (nextSession) {
        localStorage.removeItem("wallectConnectNextSession");
        console.log("FOUND A NEXT SESSION IN CACHE");
        console.log("this is the", nextSession);
        setWalletConnectUri(nextSession);
      } else if (walletConnectConnector) {
        console.log("NOT CONNECTED AND walletConnectConnector", walletConnectConnector);
        setupConnector(walletConnectConnector);
        setIsConnected(true);
      } else if (walletConnectUri /*&&!walletConnectUriSaved*/) {
        //CLEAR LOCAL STORAGE?!?
        console.log(" old uri was", walletConnectUri);
        console.log("clear local storage and connect...", nextSession);
        localStorage.removeItem("walletconnect"); // lololol
        setupConnector(
          {
            // Required
            uri: walletConnectUri,
            // Required
          } /*,
              {
                // Optional
                url: "<YOUR_PUSH_SERVER_URL>",
                type: "fcm",
                token: token,
                peerMeta: true,
                language: language,
              }*/,
        );
      }
    }
  }, [walletConnectUri]);

  const parseCallRequest = payload => {
    const callData = payload.params[0];
    setValue(callData.value);
    setTo(callData.to);
    setData(callData.data);
  };
  //

  useEffect(() => {
    if (data && to) {
      decodeFunctionData();
    }
  }, [data]);
  //

  const decodeFunctionData = async () => {
    try {
      const parsedTransactionData = await parseExternalContractTransaction(to, data);
      setParsedTransactionData(parsedTransactionData);
      setIsModalVisible(true);
    } catch (error) {
      console.log(error);
      setParsedTransactionData(null);
    }
  };
  //

  const killSession = () => {
    setIsConnected(false);
    console.log("ACTION", "killSession");
    if (isConnected) {
      walletConnectConnector.killSession();
    }
    resetConnection();
    localStorage.removeItem("walletconnect");
    localStorage.removeItem("walletConnectUri");
    localStorage.removeItem("walletConnectConnector");
    localStorage.setItem("wallectConnectNextSession", walletConnectUri);
    console.log("the connection was reset");
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  };
  //

  const hideModal = () => setIsModalVisible(false);

  const handleOk = () => {
    loadWalletConnectData({
      data,
      to,
      value,
    });
  };

  const resetConnection = () => {
    setWalletConnectUri("");
    setIsConnected(false);
    setWalletConnectConnector(null);
    setData();
    setValue();
    setTo();
  };

  // const mockData = {
  //   args: [
  //     "0x83b1cc8bcA46160d866458b207EADCeb4Ea3A654",
  //     [
  //       "QmTUC9AwdsPzeia4b4GuEUdPkYKEormgP8AMGaEdwRqoWz",
  //       {
  //         type: "BigNumber",
  //         hex: "0x00",
  //       },
  //     ],
  //     [
  //       {
  //         type: "BigNumber",
  //         hex: "0x00",
  //       },
  //       {
  //         type: "BigNumber",
  //         hex: "0xd3c21bcecceda1000000",
  //       },
  //       {
  //         type: "BigNumber",
  //         hex: "0x00",
  //       },
  //       "0xC3890c4Dac5D06C4DAA2eE3Fdc95eC1686A4718e",
  //     ],
  //     [
  //       [false, false],
  //       {
  //         type: "BigNumber",
  //         hex: "0x00",
  //       },
  //       {
  //         type: "BigNumber",
  //         hex: "0x2710",
  //       },
  //       {
  //         type: "BigNumber",
  //         hex: "0x2710",
  //       },
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       false,
  //       "0x0000000000000000000000000000000000000000",
  //     ],
  //     {
  //       type: "BigNumber",
  //       hex: "0x01",
  //     },
  //     [
  //       [
  //         {
  //           type: "BigNumber",
  //           hex: "0x01",
  //         },
  //         [],
  //       ],
  //       [
  //         {
  //           type: "BigNumber",
  //           hex: "0x02",
  //         },
  //         [],
  //       ],
  //     ],
  //     [],
  //     ["0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8"],
  //     "",
  //   ],
  //   functionFragment: {
  //     type: "function",
  //     name: "launchProjectFor",
  //     constant: false,
  //     inputs: [
  //       {
  //         name: "_owner",
  //         type: "address",
  //         indexed: null,
  //         components: null,
  //         arrayLength: null,
  //         arrayChildren: null,
  //         baseType: "address",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_projectMetadata",
  //         type: "tuple",
  //         indexed: null,
  //         components: [
  //           {
  //             name: "content",
  //             type: "string",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "string",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "domain",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //         ],
  //         arrayLength: null,
  //         arrayChildren: null,
  //         baseType: "tuple",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_data",
  //         type: "tuple",
  //         indexed: null,
  //         components: [
  //           {
  //             name: "duration",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "weight",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "discountRate",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "ballot",
  //             type: "address",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "address",
  //             _isParamType: true,
  //           },
  //         ],
  //         arrayLength: null,
  //         arrayChildren: null,
  //         baseType: "tuple",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_metadata",
  //         type: "tuple",
  //         indexed: null,
  //         components: [
  //           {
  //             name: "global",
  //             type: "tuple",
  //             indexed: null,
  //             components: [
  //               {
  //                 name: "allowSetTerminals",
  //                 type: "bool",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "bool",
  //                 _isParamType: true,
  //               },
  //               {
  //                 name: "allowSetController",
  //                 type: "bool",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "bool",
  //                 _isParamType: true,
  //               },
  //             ],
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "tuple",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "reservedRate",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "redemptionRate",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "ballotRedemptionRate",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "pausePay",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "pauseDistributions",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "pauseRedeem",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "pauseBurn",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "allowMinting",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "allowChangeToken",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "allowTerminalMigration",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "allowControllerMigration",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "holdFees",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "useTotalOverflowForRedemptions",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "useDataSourceForPay",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "useDataSourceForRedeem",
  //             type: "bool",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "bool",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "dataSource",
  //             type: "address",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "address",
  //             _isParamType: true,
  //           },
  //         ],
  //         arrayLength: null,
  //         arrayChildren: null,
  //         baseType: "tuple",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_mustStartAtOrAfter",
  //         type: "uint256",
  //         indexed: null,
  //         components: null,
  //         arrayLength: null,
  //         arrayChildren: null,
  //         baseType: "uint256",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_groupedSplits",
  //         type: "tuple[]",
  //         indexed: null,
  //         components: [
  //           {
  //             name: "group",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "splits",
  //             type: "tuple[]",
  //             indexed: null,
  //             components: [
  //               {
  //                 name: "preferClaimed",
  //                 type: "bool",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "bool",
  //                 _isParamType: true,
  //               },
  //               {
  //                 name: "preferAddToBalance",
  //                 type: "bool",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "bool",
  //                 _isParamType: true,
  //               },
  //               {
  //                 name: "percent",
  //                 type: "uint256",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "uint256",
  //                 _isParamType: true,
  //               },
  //               {
  //                 name: "projectId",
  //                 type: "uint256",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "uint256",
  //                 _isParamType: true,
  //               },
  //               {
  //                 name: "beneficiary",
  //                 type: "address",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "address",
  //                 _isParamType: true,
  //               },
  //               {
  //                 name: "lockedUntil",
  //                 type: "uint256",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "uint256",
  //                 _isParamType: true,
  //               },
  //               {
  //                 name: "allocator",
  //                 type: "address",
  //                 indexed: null,
  //                 components: null,
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "address",
  //                 _isParamType: true,
  //               },
  //             ],
  //             arrayLength: -1,
  //             arrayChildren: {
  //               name: null,
  //               type: "tuple",
  //               indexed: null,
  //               components: [
  //                 {
  //                   name: "preferClaimed",
  //                   type: "bool",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "bool",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "preferAddToBalance",
  //                   type: "bool",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "bool",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "percent",
  //                   type: "uint256",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "uint256",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "projectId",
  //                   type: "uint256",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "uint256",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "beneficiary",
  //                   type: "address",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "address",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "lockedUntil",
  //                   type: "uint256",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "uint256",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "allocator",
  //                   type: "address",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "address",
  //                   _isParamType: true,
  //                 },
  //               ],
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "tuple",
  //               _isParamType: true,
  //             },
  //             baseType: "array",
  //             _isParamType: true,
  //           },
  //         ],
  //         arrayLength: -1,
  //         arrayChildren: {
  //           name: null,
  //           type: "tuple",
  //           indexed: null,
  //           components: [
  //             {
  //               name: "group",
  //               type: "uint256",
  //               indexed: null,
  //               components: null,
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "uint256",
  //               _isParamType: true,
  //             },
  //             {
  //               name: "splits",
  //               type: "tuple[]",
  //               indexed: null,
  //               components: [
  //                 {
  //                   name: "preferClaimed",
  //                   type: "bool",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "bool",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "preferAddToBalance",
  //                   type: "bool",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "bool",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "percent",
  //                   type: "uint256",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "uint256",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "projectId",
  //                   type: "uint256",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "uint256",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "beneficiary",
  //                   type: "address",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "address",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "lockedUntil",
  //                   type: "uint256",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "uint256",
  //                   _isParamType: true,
  //                 },
  //                 {
  //                   name: "allocator",
  //                   type: "address",
  //                   indexed: null,
  //                   components: null,
  //                   arrayLength: null,
  //                   arrayChildren: null,
  //                   baseType: "address",
  //                   _isParamType: true,
  //                 },
  //               ],
  //               arrayLength: -1,
  //               arrayChildren: {
  //                 name: null,
  //                 type: "tuple",
  //                 indexed: null,
  //                 components: [
  //                   {
  //                     name: "preferClaimed",
  //                     type: "bool",
  //                     indexed: null,
  //                     components: null,
  //                     arrayLength: null,
  //                     arrayChildren: null,
  //                     baseType: "bool",
  //                     _isParamType: true,
  //                   },
  //                   {
  //                     name: "preferAddToBalance",
  //                     type: "bool",
  //                     indexed: null,
  //                     components: null,
  //                     arrayLength: null,
  //                     arrayChildren: null,
  //                     baseType: "bool",
  //                     _isParamType: true,
  //                   },
  //                   {
  //                     name: "percent",
  //                     type: "uint256",
  //                     indexed: null,
  //                     components: null,
  //                     arrayLength: null,
  //                     arrayChildren: null,
  //                     baseType: "uint256",
  //                     _isParamType: true,
  //                   },
  //                   {
  //                     name: "projectId",
  //                     type: "uint256",
  //                     indexed: null,
  //                     components: null,
  //                     arrayLength: null,
  //                     arrayChildren: null,
  //                     baseType: "uint256",
  //                     _isParamType: true,
  //                   },
  //                   {
  //                     name: "beneficiary",
  //                     type: "address",
  //                     indexed: null,
  //                     components: null,
  //                     arrayLength: null,
  //                     arrayChildren: null,
  //                     baseType: "address",
  //                     _isParamType: true,
  //                   },
  //                   {
  //                     name: "lockedUntil",
  //                     type: "uint256",
  //                     indexed: null,
  //                     components: null,
  //                     arrayLength: null,
  //                     arrayChildren: null,
  //                     baseType: "uint256",
  //                     _isParamType: true,
  //                   },
  //                   {
  //                     name: "allocator",
  //                     type: "address",
  //                     indexed: null,
  //                     components: null,
  //                     arrayLength: null,
  //                     arrayChildren: null,
  //                     baseType: "address",
  //                     _isParamType: true,
  //                   },
  //                 ],
  //                 arrayLength: null,
  //                 arrayChildren: null,
  //                 baseType: "tuple",
  //                 _isParamType: true,
  //               },
  //               baseType: "array",
  //               _isParamType: true,
  //             },
  //           ],
  //           arrayLength: null,
  //           arrayChildren: null,
  //           baseType: "tuple",
  //           _isParamType: true,
  //         },
  //         baseType: "array",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_fundAccessConstraints",
  //         type: "tuple[]",
  //         indexed: null,
  //         components: [
  //           {
  //             name: "terminal",
  //             type: "address",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "address",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "token",
  //             type: "address",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "address",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "distributionLimit",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "distributionLimitCurrency",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "overflowAllowance",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //           {
  //             name: "overflowAllowanceCurrency",
  //             type: "uint256",
  //             indexed: null,
  //             components: null,
  //             arrayLength: null,
  //             arrayChildren: null,
  //             baseType: "uint256",
  //             _isParamType: true,
  //           },
  //         ],
  //         arrayLength: -1,
  //         arrayChildren: {
  //           name: null,
  //           type: "tuple",
  //           indexed: null,
  //           components: [
  //             {
  //               name: "terminal",
  //               type: "address",
  //               indexed: null,
  //               components: null,
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "address",
  //               _isParamType: true,
  //             },
  //             {
  //               name: "token",
  //               type: "address",
  //               indexed: null,
  //               components: null,
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "address",
  //               _isParamType: true,
  //             },
  //             {
  //               name: "distributionLimit",
  //               type: "uint256",
  //               indexed: null,
  //               components: null,
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "uint256",
  //               _isParamType: true,
  //             },
  //             {
  //               name: "distributionLimitCurrency",
  //               type: "uint256",
  //               indexed: null,
  //               components: null,
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "uint256",
  //               _isParamType: true,
  //             },
  //             {
  //               name: "overflowAllowance",
  //               type: "uint256",
  //               indexed: null,
  //               components: null,
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "uint256",
  //               _isParamType: true,
  //             },
  //             {
  //               name: "overflowAllowanceCurrency",
  //               type: "uint256",
  //               indexed: null,
  //               components: null,
  //               arrayLength: null,
  //               arrayChildren: null,
  //               baseType: "uint256",
  //               _isParamType: true,
  //             },
  //           ],
  //           arrayLength: null,
  //           arrayChildren: null,
  //           baseType: "tuple",
  //           _isParamType: true,
  //         },
  //         baseType: "array",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_terminals",
  //         type: "address[]",
  //         indexed: null,
  //         components: null,
  //         arrayLength: -1,
  //         arrayChildren: {
  //           name: null,
  //           type: "address",
  //           indexed: null,
  //           components: null,
  //           arrayLength: null,
  //           arrayChildren: null,
  //           baseType: "address",
  //           _isParamType: true,
  //         },
  //         baseType: "array",
  //         _isParamType: true,
  //       },
  //       {
  //         name: "_memo",
  //         type: "string",
  //         indexed: null,
  //         components: null,
  //         arrayLength: null,
  //         arrayChildren: null,
  //         baseType: "string",
  //         _isParamType: true,
  //       },
  //     ],
  //     outputs: [
  //       {
  //         name: "projectId",
  //         type: "uint256",
  //         indexed: null,
  //         components: null,
  //         arrayLength: null,
  //         arrayChildren: null,
  //         baseType: "uint256",
  //         _isParamType: true,
  //       },
  //     ],
  //     payable: false,
  //     stateMutability: "nonpayable",
  //     gas: null,
  //     _isFragment: true,
  //   },
  //   name: "launchProjectFor",
  //   signature:
  //     "launchProjectFor(address,(string,uint256),(uint256,uint256,uint256,address),((bool,bool),uint256,uint256,uint256,bool,bool,bool,bool,bool,bool,bool,bool,bool,bool,bool,bool,address),uint256,(uint256,(bool,bool,uint256,uint256,address,uint256,address)[])[],(address,address,uint256,uint256,uint256,uint256)[],address[],string)",
  //   sighash: "0x7fc19af5",
  //   value: {
  //     type: "BigNumber",
  //     hex: "0x00",
  //   },
  // };

  return (
    <>
      {scan ? (
        <div
          style={{
            zIndex: 256,
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
          }}
          onClick={() => {
            setScan(false);
          }}
        >
          <QrReader
            delay={250}
            resolution={1200}
            onError={e => {
              console.log("SCAN ERROR", e);
              setScan(false);
            }}
            onScan={newValue => {
              if (newValue) {
                console.log("SCAN VALUE", newValue);
                setScan(false);
                setWalletConnectUri(newValue);
              }
            }}
            style={{ width: "100%" }}
          />
        </div>
      ) : (
        ""
      )}

      <Input.Group compact>
        <Input
          style={{ width: "calc(100% - 31px)", marginBottom: 20 }}
          placeholder="Paste WalletConnect URI"
          disabled={isConnected}
          value={walletConnectUri}
          onChange={e => setWalletConnectUri(e.target.value)}
        />
        <Button
          disabled={isConnected}
          onClick={() => setScan(!scan)}
          icon={
            <Badge count={<CameraOutlined style={{ fontSize: 9 }} />}>
              <QrcodeOutlined style={{ fontSize: 18 }} />
            </Badge>
          }
        />
      </Input.Group>

      {isConnected && (
        <>
          <div style={{ marginTop: 10 }}>
            <img src={peerMeta.icons[0]} style={{ width: 25, height: 25 }} />
            <p>
              <a href={peerMeta.url} target="_blank" rel="noreferrer">
                {peerMeta.url}
              </a>
            </p>
          </div>
          <Button onClick={killSession} type="primary">
            Disconnect
          </Button>
        </>
      )}

      {!isConnected && (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            localStorage.removeItem("walletconnect");
            setTimeout(() => {
              window.location.reload(true);
            }, 500);
          }}
        >
          🗑
        </div>
      )}

      {isModalVisible && (
        <TransactionDetailsModal
          visible={isModalVisible}
          txnInfo={parsedTransactionData}
          // txnInfo={mockData}
          handleOk={handleOk}
          handleCancel={hideModal}
          showFooter={true}
          mainnetProvider={mainnetProvider}
          price={price}
        />
      )}
    </>
  );
};
export default WalletConnectInput;
