/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "./common.js"
import type {
  ProtocolCoordinator,
  ProtocolCoordinatorInterface,
} from "./ProtocolCoordinator.js";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_registry",
        type: "address",
      },
      {
        internalType: "address",
        name: "_protocol",
        type: "address",
      },
      {
        internalType: "address",
        name: "_router",
        type: "address",
      },
      {
        internalType: "address",
        name: "_processor",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "component",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newAddress",
        type: "address",
      },
    ],
    name: "ComponentUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newBaseFee",
        type: "uint256",
      },
    ],
    name: "FeeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "MessageProcessingCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "MessageRetryInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "messageType",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "targetChain",
        type: "uint16",
      },
    ],
    name: "MessageSubmissionInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "EMERGENCY_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_MESSAGE_SIZE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "OPERATOR_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "cancelMessage",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "emergencyCancelMessage",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "getMessageResult",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
      {
        internalType: "bytes",
        name: "result",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getProtocolConfig",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "messageExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "messageProcessor",
    outputs: [
      {
        internalType: "contract IMessageProcessor",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "messageProtocol",
    outputs: [
      {
        internalType: "contract IMessageProtocol",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "messageRegistry",
    outputs: [
      {
        internalType: "contract IMessageRegistry",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "messageRouter",
    outputs: [
      {
        internalType: "contract IMessageRouter",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "messageType",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "uint16",
            name: "targetChain",
            type: "uint16",
          },
          {
            internalType: "bytes",
            name: "payload",
            type: "bytes",
          },
        ],
        internalType: "struct IProtocolCoordinator.MessageSubmission",
        name: "submission",
        type: "tuple",
      },
    ],
    name: "quoteMessageFee",
    outputs: [
      {
        internalType: "uint256",
        name: "_baseFee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_deliveryFee",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "messageId",
        type: "bytes32",
      },
    ],
    name: "retryMessage",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "messageType",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "target",
            type: "address",
          },
          {
            internalType: "uint16",
            name: "targetChain",
            type: "uint16",
          },
          {
            internalType: "bytes",
            name: "payload",
            type: "bytes",
          },
        ],
        internalType: "struct IProtocolCoordinator.MessageSubmission",
        name: "submission",
        type: "tuple",
      },
    ],
    name: "submitMessage",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newBaseFee",
        type: "uint256",
      },
    ],
    name: "updateBaseFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "component",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "newAddress",
        type: "address",
      },
    ],
    name: "updateProtocolComponent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162002a4238038062002a42833981016040819052620000349162000366565b6001805460ff191681556002556001600160a01b0384166200009d5760405162461bcd60e51b815260206004820152601860248201527f496e76616c69642072656769737472792061646472657373000000000000000060448201526064015b60405180910390fd5b6001600160a01b038316620000f55760405162461bcd60e51b815260206004820152601860248201527f496e76616c69642070726f746f636f6c20616464726573730000000000000000604482015260640162000094565b6001600160a01b0382166200014d5760405162461bcd60e51b815260206004820152601660248201527f496e76616c696420726f75746572206164647265737300000000000000000000604482015260640162000094565b6001600160a01b038116620001a55760405162461bcd60e51b815260206004820152601960248201527f496e76616c69642070726f636573736f72206164647265737300000000000000604482015260640162000094565b600380546001600160a01b038087166001600160a01b03199283161790925560048054868416908316179055600580548584169083161790556006805492841692909116919091179055620001fc6000336200029a565b50620002297fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775336200029a565b50620002567f97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929336200029a565b50620002837fbf233dd2aafeb4d50879c4aa5c81e96d92f6e6945c906a58f9f2d1c1631b4b26336200029a565b505066038d7ea4c6800060075550620003c3915050565b6000828152602081815260408083206001600160a01b038516845290915281205460ff166200033f576000838152602081815260408083206001600160a01b03861684529091529020805460ff19166001179055620002f63390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a450600162000343565b5060005b92915050565b80516001600160a01b03811681146200036157600080fd5b919050565b600080600080608085870312156200037d57600080fd5b620003888562000349565b9350620003986020860162000349565b9250620003a86040860162000349565b9150620003b86060860162000349565b905092959194509250565b61266f80620003d36000396000f3fe6080604052600436106101c65760003560e01c80638d8c326d116100f7578063d0380fe211610095578063f5b541a611610064578063f5b541a6146105b2578063f8cad2a5146105e6578063fc4c304e14610606578063fd503de01461063457600080fd5b8063d0380fe2146104d7578063d547741f146104f7578063dd8de1dc14610517578063ed700b3e1461053757600080fd5b806397d340f5116100d157806397d340f514610478578063a217fddf1461048f578063bb014917146104a4578063cd3e1266146104c457600080fd5b80638d8c326d146103f45780638e6901861461041457806391d148541461043457600080fd5b806336568abe116101645780635c975abb1161013e5780635c975abb1461037d5780636ef25c3a1461039557806375b238fc146103ab5780638456cb59146103df57600080fd5b806336568abe146103285780633f4ba83a146103485780634561f5311461035d57600080fd5b806308b583ff116101a057806308b583ff1461027457806320df435914610294578063248a9ca3146102d65780632f2ff15d1461030657600080fd5b806301ffc9a7146101d257806302af43941461020757806303ff321e1461023f57600080fd5b366101cd57005b600080fd5b3480156101de57600080fd5b506101f26101ed366004611e85565b610647565b60405190151581526020015b60405180910390f35b34801561021357600080fd5b50600454610227906001600160a01b031681565b6040516001600160a01b0390911681526020016101fe565b34801561024b57600080fd5b5061025f61025a366004611eb6565b6106b0565b604080519283526020830191909152016101fe565b34801561028057600080fd5b50600554610227906001600160a01b031681565b3480156102a057600080fd5b506102c87fbf233dd2aafeb4d50879c4aa5c81e96d92f6e6945c906a58f9f2d1c1631b4b2681565b6040519081526020016101fe565b3480156102e257600080fd5b506102c86102f1366004611ef1565b60009081526020819052604090206001015490565b34801561031257600080fd5b50610326610321366004611f1f565b610867565b005b34801561033457600080fd5b50610326610343366004611f1f565b610892565b34801561035457600080fd5b506103266108e3565b34801561036957600080fd5b50610326610378366004611f1f565b61095e565b34801561038957600080fd5b5060015460ff166101f2565b3480156103a157600080fd5b506102c860075481565b3480156103b757600080fd5b506102c87fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c2177581565b3480156103eb57600080fd5b50610326610bc3565b34801561040057600080fd5b506101f261040f366004611ef1565b610c49565b34801561042057600080fd5b5061032661042f366004611ef1565b610eca565b34801561044057600080fd5b506101f261044f366004611f1f565b6000918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b34801561048457600080fd5b506102c86210000081565b34801561049b57600080fd5b506102c8600081565b3480156104b057600080fd5b506101f26104bf366004611ef1565b610f76565b6101f26104d2366004611ef1565b6110aa565b3480156104e357600080fd5b50600654610227906001600160a01b031681565b34801561050357600080fd5b50610326610512366004611f1f565b611430565b34801561052357600080fd5b50600354610227906001600160a01b031681565b34801561054357600080fd5b5060075460035460045460055460065460408051602081019690965262100000868201526001600160a01b039485166060870152928416608086015290831660a08501529190911660c0808401919091528151808403909101815260e090920190526040516101fe9190611f9f565b3480156105be57600080fd5b506102c87f97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b92981565b3480156105f257600080fd5b506101f2610601366004611ef1565b611455565b34801561061257600080fd5b50610626610621366004611ef1565b6114dc565b6040516101fe929190611fb2565b6102c8610642366004611eb6565b6115ca565b60006001600160e01b031982167f7965db0b0000000000000000000000000000000000000000000000000000000014806106aa57507f01ffc9a7000000000000000000000000000000000000000000000000000000006001600160e01b03198316145b92915050565b60055460009081906001600160a01b03166107125760405162461bcd60e51b815260206004820152601d60248201527f4d657373616765526f75746572206e6f7420696e697469616c697a656400000060448201526064015b60405180910390fd5b60006107246060850160408601611fe5565b61ffff16116107755760405162461bcd60e51b815260206004820152601060248201527f496e76616c696420636861696e204944000000000000000000000000000000006044820152606401610709565b60006107846060850185612002565b9050116107c35760405162461bcd60e51b815260206004820152600d60248201526c115b5c1d1e481c185e5b1bd859609a1b6044820152606401610709565b6007546005549092506001600160a01b0316639ac086df6107ea6060860160408701611fe5565b6107f76060870187612002565b60405160e085901b6001600160e01b031916815261ffff9093166004840152602483015250604401602060405180830381865afa15801561083c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108609190612050565b9050915091565b60008281526020819052604090206001015461088281611b46565b61088c8383611b53565b50505050565b6001600160a01b03811633146108d4576040517f6697b23200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6108de8282611bfd565b505050565b3360009081527f7d7ffb7a348e1c6a02869081a26547b49160dd3df72d1d75a570eb9b698292ec602052604090205460ff166109545760405162461bcd60e51b815260206004820152601060248201526f21b0b63632b9103737ba1030b236b4b760811b6044820152606401610709565b61095c611c80565b565b3360009081527f7d7ffb7a348e1c6a02869081a26547b49160dd3df72d1d75a570eb9b698292ec602052604090205460ff166109cf5760405162461bcd60e51b815260206004820152601060248201526f21b0b63632b9103737ba1030b236b4b760811b6044820152606401610709565b6001600160a01b038116610a255760405162461bcd60e51b815260206004820152600f60248201527f496e76616c6964206164647265737300000000000000000000000000000000006044820152606401610709565b7f647f7c286926fbfa90ab890a66b66522dad9feca7ced0af9cf45c613acf136168203610a6c57600380546001600160a01b0319166001600160a01b038316179055610b89565b7ff87e69cb514f255f3d32f9d90f25160a10d0cdefe6618a6406db334d4450595c8203610ab357600480546001600160a01b0319166001600160a01b038316179055610b89565b7feb4fd9f47c063b511700e1c8e94e2fa4088ffca1fdcef1e60edf1beecd1b2e648203610afa57600580546001600160a01b0319166001600160a01b038316179055610b89565b7f1a198eab081ff2fdf827cecb74218150a4ed14b0316f72d621b91ae4d91a466d8203610b4157600680546001600160a01b0319166001600160a01b038316179055610b89565b60405162461bcd60e51b815260206004820152601160248201527f496e76616c696420636f6d706f6e656e740000000000000000000000000000006044820152606401610709565b6040516001600160a01b0382169083907f3d31cad23498303ffe2fd15a8245f662a4d2a008e34deef8599737a78222ae5090600090a35050565b3360009081527f3c1b1854ab1360abbb06c8d4c6b2672d4b8cedc5eff522ab19e51d5cb8fdbd46602052604090205460ff16610c415760405162461bcd60e51b815260206004820152601a60248201527f43616c6c6572206e6f7420656d657267656e63792061646d696e0000000000006044820152606401610709565b61095c611cd2565b6000610c5482611455565b610c945760405162461bcd60e51b815260206004820152601160248201527013595cdcd859d9481b9bdd08199bdd5b99607a1b6044820152606401610709565b6000828152600960205260409020546001600160a01b03163314610cfa5760405162461bcd60e51b815260206004820152601260248201527f4e6f74206d6573736167652073656e64657200000000000000000000000000006044820152606401610709565b6003546040517f5075a9d4000000000000000000000000000000000000000000000000000000008152600481018490526000916001600160a01b031690635075a9d490602401602060405180830381865afa158015610d5d573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610d819190612069565b90506000816005811115610d9757610d9761208a565b1480610db457506003816005811115610db257610db261208a565b145b610e005760405162461bcd60e51b815260206004820152601560248201527f43616e6e6f742063616e63656c206d65737361676500000000000000000000006044820152606401610709565b6003546040516326c441e760e21b81526001600160a01b0390911690639b11079c90610e339086906005906004016120a0565b600060405180830381600087803b158015610e4d57600080fd5b505af1158015610e61573d6000803e3d6000fd5b505050600084815260086020526040812081815560018101805475ffffffffffffffffffffffffffffffffffffffffffff191690559150610ea56002830182611e37565b50505060009182525060096020526040902080546001600160a01b0319169055600190565b3360009081527f7d7ffb7a348e1c6a02869081a26547b49160dd3df72d1d75a570eb9b698292ec602052604090205460ff16610f3b5760405162461bcd60e51b815260206004820152601060248201526f21b0b63632b9103737ba1030b236b4b760811b6044820152606401610709565b60078190556040518181527f8c4d35e54a3f2ef1134138fd8ea3daee6a3c89e10d2665996babdf70261e2c769060200160405180910390a150565b3360009081527f3c1b1854ab1360abbb06c8d4c6b2672d4b8cedc5eff522ab19e51d5cb8fdbd46602052604081205460ff16610ff45760405162461bcd60e51b815260206004820152601a60248201527f43616c6c6572206e6f7420656d657267656e63792061646d696e0000000000006044820152606401610709565b610ffd82611455565b61103d5760405162461bcd60e51b815260206004820152601160248201527013595cdcd859d9481b9bdd08199bdd5b99607a1b6044820152606401610709565b6003546040516326c441e760e21b81526001600160a01b0390911690639b11079c906110709085906005906004016120a0565b600060405180830381600087803b15801561108a57600080fd5b505af115801561109e573d6000803e3d6000fd5b50600195945050505050565b60006110b4611d0d565b6110bc611d4a565b6110c582611455565b6111055760405162461bcd60e51b815260206004820152601160248201527013595cdcd859d9481b9bdd08199bdd5b99607a1b6044820152606401610709565b6000828152600960205260409020546001600160a01b0316331461116b5760405162461bcd60e51b815260206004820152601260248201527f4e6f74206d6573736167652073656e64657200000000000000000000000000006044820152606401610709565b600082815260086020908152604080832081516080810183528154815260018201546001600160a01b038116948201949094527401000000000000000000000000000000000000000090930461ffff16918301919091526002810180546060840191906111d7906120d2565b80601f0160208091040260200160405190810160405280929190818152602001828054611203906120d2565b80156112505780601f1061122557610100808354040283529160200191611250565b820191906000526020600020905b81548152906001019060200180831161123357829003601f168201915b50505091909252505060055460408381015160608501515191517f9ac086df00000000000000000000000000000000000000000000000000000000815261ffff909116600482015260248101919091529293506000926001600160a01b039091169150639ac086df90604401602060405180830381865afa1580156112d9573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112fd9190612050565b90508034101561134f5760405162461bcd60e51b815260206004820152601160248201527f496e73756666696369656e7420666565780000000000000000000000000000006044820152606401610709565b6005546020830151604080850151606086015191517f1d9802830000000000000000000000000000000000000000000000000000000081526001600160a01b0390941693631d9802839386936113ac938b9390919060040161210c565b60806040518083038185885af11580156113ca573d6000803e3d6000fd5b50505050506040513d601f19601f820116820180604052508101906113ef91906121c8565b5060405184907fe214fbe9ae40a3726e9055f248041f9cf6ad6ff4187a59cef1eafe1870335b7e90600090a260019250505061142b6001600255565b919050565b60008281526020819052604090206001015461144b81611b46565b61088c8383611bfd565b6003546040517ff8cad2a5000000000000000000000000000000000000000000000000000000008152600481018390526000916001600160a01b03169063f8cad2a590602401602060405180830381865afa1580156114b8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106aa9190612233565b600060606114e983611455565b6115295760405162461bcd60e51b815260206004820152601160248201527013595cdcd859d9481b9bdd08199bdd5b99607a1b6044820152606401610709565b6006546040517f5261b2cc000000000000000000000000000000000000000000000000000000008152600481018590526000916001600160a01b031690635261b2cc90602401600060405180830381865afa15801561158c573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526115b4919081019061224e565b9050806040015181606001519250925050915091565b60006115d4611d0d565b6115dc611d4a565b60006115eb6060840184612002565b90501161162a5760405162461bcd60e51b815260206004820152600d60248201526c115b5c1d1e481c185e5b1bd859609a1b6044820152606401610709565b6210000061163b6060840184612002565b9050111561168b5760405162461bcd60e51b815260206004820152601160248201527f5061796c6f616420746f6f206c617267650000000000000000000000000000006044820152606401610709565b600061169d604084016020850161234a565b6001600160a01b0316036116f35760405162461bcd60e51b815260206004820152600e60248201527f496e76616c6964207461726765740000000000000000000000000000000000006044820152606401610709565b6000806116ff846106b0565b909250905061170e8183612367565b34101561175d5760405162461bcd60e51b815260206004820152601060248201527f496e73756666696369656e7420666565000000000000000000000000000000006044820152606401610709565b6004546001600160a01b031663f9a8bc48853561177d6060880188612002565b6040518463ffffffff1660e01b815260040161179b939291906123b1565b602060405180830381865afa1580156117b8573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906117dc9190612233565b6118285760405162461bcd60e51b815260206004820152601660248201527f496e76616c6964206d65737361676520666f726d6174000000000000000000006044820152606401610709565b60006118376060860186612002565b6040516118459291906123d4565b60408051918290039091206003549092506000916001600160a01b03909116906344ad286890883590859061187f908b0160208c0161234a565b61188f60608c0160408d01611fe5565b61189c60608d018d612002565b6040518763ffffffff1660e01b81526004016118bd969594939291906123e4565b6020604051808303816000875af11580156118dc573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906119009190612050565b6000818152600860205260409020909150869061191d828261253a565b505060008181526009602090815260409182902080546001600160a01b031916331790556005546001600160a01b031691631d9802839186918591611966918c01908c0161234a565b61197660608c0160408d01611fe5565b61198360608d018d612002565b6040518763ffffffff1660e01b81526004016119a39594939291906125fb565b60806040518083038185885af11580156119c1573d6000803e3d6000fd5b50505050506040513d601f19601f820116820180604052508101906119e691906121c8565b506119f76060870160408801611fe5565b61ffff16600103611acd576003546040516326c441e760e21b81526001600160a01b0390911690639b11079c90611a359084906001906004016120a0565b600060405180830381600087803b158015611a4f57600080fd5b505af1158015611a63573d6000803e3d6000fd5b50506003546040516326c441e760e21b81526001600160a01b039091169250639b11079c9150611a9a9084906002906004016120a0565b600060405180830381600087803b158015611ab457600080fd5b505af1158015611ac8573d6000803e3d6000fd5b505050505b853533827ff1e7f3dda12113b783e2629a78c0af1469150f42ae3f1254ed7b3d8f37d90dbe611b0260408b0160208c0161234a565b611b1260608c0160408d01611fe5565b604080516001600160a01b03909316835261ffff90911660208301520160405180910390a4935050505061142b6001600255565b611b508133611d8b565b50565b6000828152602081815260408083206001600160a01b038516845290915281205460ff16611bf5576000838152602081815260408083206001600160a01b03861684529091529020805460ff19166001179055611bad3390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45060016106aa565b5060006106aa565b6000828152602081815260408083206001600160a01b038516845290915281205460ff1615611bf5576000838152602081815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45060016106aa565b611c88611dfb565b6001805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b611cda611d0d565b6001805460ff1916811790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25833611cb5565b60015460ff161561095c576040517fd93c066500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6002805403611d85576040517f3ee5aeb500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60028055565b6000828152602081815260408083206001600160a01b038516845290915290205460ff16611df7576040517fe2517d3f0000000000000000000000000000000000000000000000000000000081526001600160a01b038216600482015260248101839052604401610709565b5050565b60015460ff1661095c576040517f8dfc202b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b508054611e43906120d2565b6000825580601f10611e53575050565b601f016020900490600052602060002090810190611b5091905b80821115611e815760008155600101611e6d565b5090565b600060208284031215611e9757600080fd5b81356001600160e01b031981168114611eaf57600080fd5b9392505050565b600060208284031215611ec857600080fd5b813567ffffffffffffffff811115611edf57600080fd5b820160808185031215611eaf57600080fd5b600060208284031215611f0357600080fd5b5035919050565b6001600160a01b0381168114611b5057600080fd5b60008060408385031215611f3257600080fd5b823591506020830135611f4481611f0a565b809150509250929050565b60005b83811015611f6a578181015183820152602001611f52565b50506000910152565b60008151808452611f8b816020860160208601611f4f565b601f01601f19169290920160200192915050565b602081526000611eaf6020830184611f73565b8215158152604060208201526000611fcd6040830184611f73565b949350505050565b61ffff81168114611b5057600080fd5b600060208284031215611ff757600080fd5b8135611eaf81611fd5565b6000808335601e1984360301811261201957600080fd5b83018035915067ffffffffffffffff82111561203457600080fd5b60200191503681900382131561204957600080fd5b9250929050565b60006020828403121561206257600080fd5b5051919050565b60006020828403121561207b57600080fd5b815160068110611eaf57600080fd5b634e487b7160e01b600052602160045260246000fd5b82815260408101600683106120c557634e487b7160e01b600052602160045260246000fd5b8260208301529392505050565b600181811c908216806120e657607f821691505b60208210810361210657634e487b7160e01b600052602260045260246000fd5b50919050565b8481526001600160a01b038416602082015261ffff8316604082015260806060820152600061213e6080830184611f73565b9695505050505050565b634e487b7160e01b600052604160045260246000fd5b60405160a0810167ffffffffffffffff8111828210171561218157612181612148565b60405290565b604051601f8201601f1916810167ffffffffffffffff811182821017156121b0576121b0612148565b604052919050565b8051801515811461142b57600080fd5b6000608082840312156121da57600080fd5b6040516080810181811067ffffffffffffffff821117156121fd576121fd612148565b60405282518152612210602084016121b8565b602082015260408301516040820152606083015160608201528091505092915050565b60006020828403121561224557600080fd5b611eaf826121b8565b6000602080838503121561226157600080fd5b825167ffffffffffffffff8082111561227957600080fd5b9084019060a0828703121561228d57600080fd5b61229561215e565b8251815283830151600581106122aa57600080fd5b818501526122ba604084016121b8565b60408201526060830151828111156122d157600080fd5b8301601f810188136122e257600080fd5b8051838111156122f4576122f4612148565b612306601f8201601f19168701612187565b9350808452888682840101111561231c57600080fd5b61232b81878601888501611f4f565b5050816060820152608083015160808201528094505050505092915050565b60006020828403121561235c57600080fd5b8135611eaf81611f0a565b808201808211156106aa57634e487b7160e01b600052601160045260246000fd5b81835281816020850137506000828201602090810191909152601f909101601f19169091010190565b8381526040602082015260006123cb604083018486612388565b95945050505050565b8183823760009101908152919050565b8681528560208201526001600160a01b038516604082015261ffff8416606082015260a06080820152600061241d60a083018486612388565b98975050505050505050565b601f8211156108de576000816000526020600020601f850160051c810160208610156124525750805b601f850160051c820191505b818110156124715782815560010161245e565b505050505050565b67ffffffffffffffff83111561249157612491612148565b6124a58361249f83546120d2565b83612429565b6000601f8411600181146124d957600085156124c15750838201355b600019600387901b1c1916600186901b178355612533565b600083815260209020601f19861690835b8281101561250a57868501358255602094850194600190920191016124ea565b50868210156125275760001960f88860031b161c19848701351681555b505060018560011b0183555b5050505050565b8135815560018101602083013561255081611f0a565b8154604085013561256081611fd5565b75ffff00000000000000000000000000000000000000008160a01b166001600160a01b03841675ffffffffffffffffffffffffffffffffffffffffffff19841617178455505050506060820135601e198336030181126125bf57600080fd5b8201803567ffffffffffffffff8111156125d857600080fd5b6020820191508036038213156125ed57600080fd5b61088c818360028601612479565b8581526001600160a01b038516602082015261ffff8416604082015260806060820152600061262e608083018486612388565b97965050505050505056fea2646970667358221220acaa6ee30b0487b74eef089c5c81c52f6af983748200aa0bab3aeead564ae3e864736f6c63430008180033";

type ProtocolCoordinatorConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ProtocolCoordinatorConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ProtocolCoordinator__factory extends ContractFactory {
  constructor(...args: ProtocolCoordinatorConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _registry: AddressLike,
    _protocol: AddressLike,
    _router: AddressLike,
    _processor: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(
      _registry,
      _protocol,
      _router,
      _processor,
      overrides || {}
    );
  }
  override deploy(
    _registry: AddressLike,
    _protocol: AddressLike,
    _router: AddressLike,
    _processor: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(
      _registry,
      _protocol,
      _router,
      _processor,
      overrides || {}
    ) as Promise<
      ProtocolCoordinator & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): ProtocolCoordinator__factory {
    return super.connect(runner) as ProtocolCoordinator__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ProtocolCoordinatorInterface {
    return new Interface(_abi) as ProtocolCoordinatorInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): ProtocolCoordinator {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as ProtocolCoordinator;
  }
}
