# Rain Order Taker Bot 
A bot for targeting sepcific orders that can run on a github action with (with cron job). This both requires NodeJS to be installed. The operating network will be derived from `RPC_URL` that is specified for the bot to operate on.
<bt>

## Configurations
Create a `.env` file and populate it with following, `BOT_WALLET_PRIVATEKEY` will be used as the wallet that submits the transactions and `RPC_URL` will be the provider required for submitting transactions, the operating network also is derived from `RPC_URL`:
```bash
BOT_WALLET_PRIVATEKEY="<private-key-of-bot-account>" 
RPC_URL="<rpc-url-for-network>"
```
<br>

Specify desired order(s) in `./orders.json` which holds an array of `Order` structs to operate on. Orders must be of valid `Order` struct.
`validInputs` and `validOutputs` should only have one item each, if not, only the first item of each going to be used 
by the bot and rest of them will be ignored.
Example of an order:
```json
{
  "owner": "<owner address>",
  "handleIO": "<true/false>",
  "evaluable": {
    "interpreter": "<interpreter address>",
    "store": "<store address>",
    "expression": "<order expression address>"
  },
  "validInputs": [{
    "token": "<input token address>",
    "decimals": "<token decimals, number>",
    "vaultId": "<vault id>"
  }],
  "validOutputs": [{
    "token": "<output token address>",
    "decimals": "<token decimals>",
    "vaultId": "<vault id>"
  }]
}
```
If you use vscode, schmeas in `./schema` folder will help you with tips, else you can use the schemas to validate the content manualy.
<br>

In order to configure the operating `Orderbook`, `ZeroExOrderBookFlashBorrower` contracts, specify them in `./config.json` in their respective fields, these will be the contracts that the bot tries to read and clear orders. 
You can also add more networks to the config file which hold the data of networks that the bot can operate on, the operating network will be derived from `RPC_URL` specified in you `.env` file.
Example of a configuration:
```json
[
  {
    "network": "polygon",
    "chainId": 137,
    "apiUrl": "https://polygon.api.0x.org/",
    "defaultRpc": "",
    "orderBookAddress": "<OrderBook contract address>",
    "arbAddress": "<ZeroExOrderBookFlashBorrower contract address>",
    "proxyAddress": "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    "nativeToken": {
      "symbol": "MATIC",
      "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "decimals": 18
    }
  },
  {
    "network": "mumbai",
    "chainId": "0x80001",
    "apiUrl": "https://mumbai.api.0x.org/",
    "defaultRpc": "",
    "orderBookAddress": "<OrderBook contract address>",
    "arbAddress": "<ZeroExOrderBookFlashBorrower contract address>",
    "proxyAddress": "0xf471d32cb40837bf24529fcf17418fc1a4807626",
    "nativeToken": {
      "symbol": "MATIC",
      "address": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      "decimals": 18
    }
  }
]
```
If you use vscode, schmeas in `./schema` folder will help you with tips, else you can use the schemas to validate the content manualy.
<br>

## Updates
There are contract ABIs (`OrderBook`, `ZeroExOrderBookFlashBorrower` and `IInterpreterV1`) in `./abis` folder that holds the necessaru abi in order to instantiate the contract instances. For updating the contracts (in case their ABI has been changed), replace the files in `./abis` with updated versions.
Don't forget to update the network configurations in `./config.json` for Orderbook and ZeroExOrderBookFlashBorrower contract address, and also your orders in `./orders.json`.
<br>

## Running in Github Actions


## Running Locally
You need `NodeJS` installed locally on your machine.
Clone the repo and install Dependencies:
```bash
npm install
```
<br>

Then add your `.env`, configurations and orders (see `Configuraions`), lastly execute the following:
```bash
node run.js
```
<br>

