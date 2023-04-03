# 0x Take Order Bot
A bot running on NodeJs environment for targeting sepcific Rain orderbook orders to clear against 0x liquidity (0x orders), this can also run on a github action (with cron job).<br>
The operating network will be derived from `RPC_URL` that is specified in `.env` file or passed as argument with `--rpc` flag.
<bt>


# Easy Setup
For a easy setup to get this working in github actions:<br><br>
1 - Fork this repository and add your wallet private key as `WALLET_KEY` and rpc url as `RPC_URL` to your repository secrets. <br>
For details on how to add secrets to your repository please read [here](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).<br>
For making a rpc url from your alchemy key (in case you only have the alchemy key), just add the key to the end of this: https://polygon-mainnet.g.alchemy.com/v2/YOUR-ALCHEMY-KEY.<br>
Alternatively you can get the HTTPS or Websocket rpc url of your prefered provider by following the instructions of your provider and add it as your `RPC_URL` secret.<br><br>
2 - Add your orders into the `./orders.json` file, orders must be of valid Order struct, and `validInputs` and `validOutputs` should only have one item each. See `./example.orders.json` for an example of an order struct.<br><br>
3 - Add `Orderbook` and `0xOrderBookFlashBorrower` contract addresses to the `./config.json` file of the network they are deployed on.<br><br>
4 - Enable the `Take Orders` workflow in the actions tab of your forked repository, this is needed because scheduled workflows will be disabled by default for forked repositories. Please be aware that the first run may take a bit more time, so be patient after enabling this workflow.<br><br>
5 - Optionally you can edit the schedule in `./github/workflows/take-orders.yaml` by modifying the cron syntax, by default it is set to run every 5 minutes.<br>
Please be aware that github scheduled workflows are not guaranteed to run at exact schedule because of github resource availability.
<br>


# Advanced Setup
The following will give you the full configuration capabilities:

## Adding Orders
Make a json file (optionaly named `orders.json`) and specify the desired order(s) in it. If the file is in any directory other than root directory of this repo then you need to specify its path when executing the `node run.js` using `-o` flag.<br>
`validInputs` and `validOutputs` should only have one item each, if not, only the first item of each going to be used 
by the bot and rest of them will be ignored and please be aware that orders must be of valid `Order` struct.<br>
Example of an Order struct (see `./example.orders.json`):
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
If you use vscode, schmeas in `./schema` folder will help you with tips, else you can set your text editor to use the `./schema/orders.schema.json` schema for your orders file.<br>
Optionally you can set up your orders details in another file and pass the file path as an argument to cli with `--orders` flag.
<br>

## Configurations
Configurations can be set in the files and/or as cli arguments when executing the `node ./run.js` command. If any cli argument is passed on, it will override their counterparts specified in the files.

## Configuration through CLI

    usage:    

        node ./run.js [option1] <value1> [option2] <value2> ...

    example:

        node ./run.js -k 12345...abcd -r 'https://rpc-url.com/'
        node ./run.js --use-etherscan
        node ./run.js --etherscan-key 12345abcd
        node ./run.js -o '../../myOrders.json' --ob-add 0x123...4abcd
        node ./run.js -k 12345...abcd -r 'https://rpc-url.api.com/' --ob-add 0x1234...abcd --arb-add 0xabcd...1234 --use-etherscan


    options:

        -k, -K, -key            <bot wallet private key>
        Private key of wallet that performs the transactions. Will override the 'WALLET_KEY' in '.env' file.

        -r, -R, --rpc           <rpc url>
        RPC URL that will be provider for interacting with evm. Will override the 'RPC_URL' in '.env' file.

        -o, -O, --orders        <path/to/orders.json>
        Path (relative or absolute) to the file that holds the orders to operate on. If provided will ignore './orders.json' file.

        --ob-add                <deployed orderbook contract address>
        Address of the deployed orderbook contract. Will override 'orderbookAddress' field in './config.json' file.

        --arb-add               <deployed arb contract address>
        Address of the deployed arb contract. Will override 'arbAddress' field in './config.json' file.

        --etherscan-key         <optionaly etherscan api key>
        Etherscan API key to required to read contract ABI from etherscan of the operating evm network. Will ignore './abis' folder and '*SCAN_API_KEY' in '.env'. Contracts need to be verified. 

        --use-etherscan         Forces to read contract abi from etherscan with provided keys in '.env' file. Contracts need to be verified.

        -h, -H, --help          Display cli help

    
    * Configuration can be set through '.env', 'orders.json' and 'config.json' files as well, which are default places the bot looks 
      for the required arguments, however they will be ignored if cli arguments are provided for their counterparts in those files.
      For example if the orderbook address (--ob-add flag) is provided, the orderbook address in 'config.json' file will be ignored.
      Please read 'README.md' for more info.

    ** Path can be relative(from the current working directory) or absolute:
        - relative path must start with letters or 1 or 2 dots ".", example: relative/path ./relative/path ../../relative/path
        - absolute path must start with slash "/", example: /absolute/path
<br>

### Configuration through Files
Create a `.env` file and populate it with following (see `./example.env` for reference):
```bash
WALLET_KEY="<private-key-of-bot-account>"

RPC_URL="<rpc-url-for-network>"

# etherscan api keys (optional, only needed if "--use-etherscan" flag is used in cli)
ETHERSCAN_API_KEY=""        # for ethereum, goerli and optimisim networks
POLYGONSCAN_API_KEY=""      # for polygon and mumbai networks
SNOWTRACE_API_KEY=""        # for avalanche network
BSCSCAN_API_KEY=""          # for binance smart chain network
ARBISCAN_API_KEY=""         # for arbitrum network
CELOSCAN_API_KEY=""         # for celo network
FTMSCAN_API_KEY=""          # for fantom network
```
`WALLET_KEY` will be used as the wallet that submits the transactions and `RPC_URL` will be the provider required for submitting transactions.<br>
All these values can alternatively be provided through cli with thier corresponding flag, please see CLI section for more info.
<br>

In order to set the operating `Orderbook`, `ZeroExOrderBookFlashBorrower` contracts, specify them in `./config.json` in their respective fields, these will be the contracts that the bot tries to read and clear orders on.<br>
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
If you use vscode, schmeas in `./schema` folder will help you with tips, else you can set your text editor to use the `./schema/config.schema.json` schema for the config file.
<br>

## Contract ABIs
By default the bot will get required contract ABIs (`OrderBook`, `ZeroExOrderBookFlashBorrower` and `IInterpreterV1`) from `./abis` folder, so if the contracts get updated the ABI files need to be updated as well.<br>
Optionally with providing `--use-etherscan` or `--etherscan-key` you can force to read contract ABIs from etherscan of the corresponding network, this assumes that the contracts are verified in etherscan.
<br>

## Running in Github Actions
The process can be run in a github actions as a workflow, the configuration for it is available in `./.github/workflows/take-orders.yaml`. The schedule for triggering can be modified in the mentioned file with cron syntax (or any other form of triggering event for a github action of your choice).<br>
Please be aware that github only allows scheduled workflows to run at most every 5 minutes and it is neither guaranteed to run at specified schedule due to github resources being reserved, so sometimes it can take 10 or 15 or even more minutes longer than specified schedule time to run, therefore, it's not recommended to use GitHub Actions scheduled workflows for production tasks that require execution guarantee, please read [here](https://upptime.js.org/blog/2021/01/22/github-actions-schedule-not-working/) for more info.

## Running Locally
You need NodeJS installed locally on your machine.<br>
Clone the repo and install Dependencies:
```bash
npm install
```
<br>

For starting the bot (pass cli arguments as desired): 
```bash
node run.js
```
