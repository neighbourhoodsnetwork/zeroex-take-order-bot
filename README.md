# Rain Order Taker Bot
A bot running on NodeJs environment for targeting sepcific Rain orderbook orders to clear against 0x liquidity (0x orders), this can also run on a github action (with cron job). The operating network will be derived from `RPC_URL` that is specified in `.env` file or passed as argument with `--rpc` flag.
<bt>

## Configurations
Configurations can be set in the files and/or as cli arguments when executing the `node ./run.js`. If any cli argument is passed on, it will override their counterparts specified in the files.

## Configuration through CLI
Configurations can be passed on as cli arguments to the bot. CLI arguments are prioritized over files configurations.

    usage:    

        node ./run.js [option1] <value1> [option2] <value2> ...

    example:

        node ./run.js -k 12345abcd -r 'https://rpc-url.com/'
        node ./run.js --use-etherscan
        node ./run.js --etherscan-key 12345abcd
        node ./run.js -o '../../myOrders.json' --orderbook 0x1234abcd
        node ./run.js -k 12345abcd -r 'https://rpc-url.api.com/' -o '../../myOrders.json' --orderbook 0x1234abcd --arb 0xabcd1234


    options:

        -k, -K, -key            <bot wallet private key>
        Private key of wallet that performs the transactions. Will override the 'WALLET_KEY' in '.env' file.

        -r, -R, --rpc           <rpc url>
        RPC URL that will be provider for interacting with ethereum network. Will override the 'RPC_URL' in '.env' file.

        -o, -O, --orders        <path/to/orders.json>
        Path (relative or absolute) to the file that holds the orders to operate on. If provided will ignore './orders.json' file.

        --ob-add                <deployed orderbook contract address>
        Address of the deployed orderbook contract. Will override 'orderbookAddress' field in './config.json' file.

        --arb-add               <deployed arb contract address>
        Address of the deployed arb contract. Will override 'arbAddress' field in './config.json' file.

        --etherscan-key         <optionaly etherscan api key>
        Etherscan API key to read contract ABI from etherscan. Will ignore './abis' folder and '*SCAN_API_KEY' in '.env'. Contracts need to be verified. 

        --use-etherscan         Forces to read contract abi from etherscan with provided keys in '.env' file. Contracts need to be verified.

        -h, -H, --help          Display cli help

    
    * Configuration can be set through '.env', 'orders.json' and 'config.json' files as well, which are default places the bot looks 
      for the required arguments, however they will be ignored if cli arguments are provided for their counterparts in those files.
      For example if the orderbook address (--orderbook option) is provided, the orderbook address in 'config.json' file will be ignored.
      Please read 'README.md' for more info.

    ** Path can be relative(from the current working directory) or absolute:
        - relative path must start with letters or 1 or 2 dots ".", example: relative/path ./relative/path ../../relative/path
        - absolute path must start with slash "/", example: /absolute/path
<br>

### Configuration through Files
Create a `.env` file and populate it with following:
```bash
WALLET_KEY="<private-key-of-bot-account>"

RPC_URL="<rpc-url-for-network>"

# etherscan api keys (only needed if "--use-etherscan" flag is passed on cli)
POLYGONSCAN_API_KEY=""
ETHERSCAN_API_KEY=""
SNOWTRACE_API_KEY=""
BSC_API_KEY=""
ARBITRUM_API_KEY=""
CELO_API_KEY=""
OPTIMISM_API_KEY=""
FTM_API_KEY=""
```
`WALLET_KEY` will be used as the wallet that submits the transactions and `RPC_URL` will be the provider required for submitting transactions, the operating network also is derived from `RPC_URL`.
All these value can also be provided through cli arguments with thier respective flag, please see CLI section for more info.
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
Optionally you can set up your orders details in another file and pass the file path as an argument to cli with `--orders` flag.
<br>

In order to set the operating `Orderbook`, `ZeroExOrderBookFlashBorrower` contracts, specify them in `./config.json` in their respective fields, these will be the contracts that the bot tries to read and clear orders on. 
Example of a configuration:
```json
[
  {
    "network": "polygon",
    "chainId": 137,
    "apiUrl": "https://polygon.api.0x.org/",
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

## Contract ABIs
By default the bot will get required contract ABIs (`OrderBook`, `ZeroExOrderBookFlashBorrower` and `IInterpreterV1`) from `./abis` folder, so if the contracts get updated the ABI files need to be updated as well.
Optionally with providing `--use-etherscan` or `--etherscan-key` you can force to read contract ABIs from etherscan of the corresponding network, this assumes that the contracts are verified there.
<br>

## Running in Github Actions
The process can be run in a github action, the configuration for it is available in `./.github/cron-job.yaml`. The schedule for triggering can be modified in the mentioned file.
Please be aware that github only allows cron to run at most every 5 minutes.

## Running Locally
You need `NodeJS` installed locally on your machine.
Clone the repo and install Dependencies:
```bash
npm install
```
<br>

For starting the bot: 
```bash
node run.js
```
<br>

