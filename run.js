const fs = require("fs");
const path  = require("path");
const axios = require("axios"); 
const ethers = require("ethers"); 
const { argv } = require("process"); 
const config = require("./config.json"); 
const { execSync } = require("child_process"); 
const { abi: obAbi } = require("./abis/OrderBook.json"); 
const { abi: interpreterAbi } = require("./abis/IInterpreterV1.json"); 
const { abi: arbAbi } = require("./abis/ZeroExOrderBookFlashBorrower.json"); 

require("dotenv").config(); 


const MAX_UINT_256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; 

/**
 * Execute Child Processes
 * 
 * @param {string} cmd Command to execute
 * @returns The command to ran as shell
 */
const _exec = (cmd) => {
    try {
        return execSync(cmd, { stdio: "inherit" });
    } 
    catch (e) {
        throw new Error(`Failed to run command \`${cmd}\``);
    }
};

/**
 * Convert a float numbers to big number
 * 
 * @param {*} float - any form of number
 * @param {number} decimals - Decimals point of the number
 * @returns ethers BigNumber with decimals point
 */
const _bnFromFloat = (float, decimals) => {
    if (typeof float == 'string') {
        if (float.startsWith('0x')) {
            const num = BigInt(float).toString();
            return ethers.BigNumber.from(num.padEnd(num.length + decimals), '0');
        }
        else {
            if (float.includes('.')) {
                const offset = decimals - float.slice(float.indexOf('.') + 1).length;
                float = offset < 0 ? float.slice(0, offset) : float;
            }
            return ethers.utils.parseUnits(float, decimals); 
        }
    }
    else {
        try {
            float = float.toString();
            return _bnFromFloat(float, decimals);
        }
        catch {
            return undefined;
        }
    }
};

/**
 * Convert a BigNumber to a fixed 18 point BigNumber
 * 
 * @param {ethers.BigNumber} bn - The BigNumber to convert
 * @param {number} decimals - The decimals point of the given BigNumber
 * @returns A 18 fixed point BigNumber
 */
const _toFixed18 = (bn, decimals) => {
    const num = bn.toBigInt().toString();
    return ethers.BigNumber.from(
        num + '0'.repeat(18 - decimals)
    );
};

/**
 * Convert a 18 fixed point BigNumber to a  BigNumber with some other decimals point
 * 
 * @param {ethers.BigNumber} bn - The BigNumber to convert
 * @param {number} decimals - The decimals point of convert the given BigNumber
 * @returns A decimals point BigNumber
 */
const _fromFixed18 = (bn, decimals) => {
    if (decimals != 18) {
        const num = bn.toBigInt().toString();
        return ethers.BigNumber.from(
            num.slice(0, decimals - 18)
        );
    }
    else return bn;
};
 
/**
 * Get base url of an network etherscan
 * 
 * @param {number} chainId - network chain id to get the scanner base url for
 * @returns base etherscan utl
 */
const getEtherscanBaseURL = (chainId) => { 
    if (chainId === 1)          return "https://api.etherscan.io/";
    if (chainId === 5)          return "https://api-goerli.etherscan.io/";
    if (chainId === 10)         return "https://api-optimistic.etherscan.io/";
    if (chainId === 56)         return "https://api.bscscan.com/";
    if (chainId === 137)        return "https://api.polygonscan.com/";
    if (chainId === 250)        return "https://api.ftmscan.com/";
    if (chainId === 42161)      return "https://api.arbiscan.io/";
    if (chainId === 42220)      return "https://api.celoscan.io/";
    if (chainId === 43114)      return "https://api.snowtrace.io/";
    if (chainId === 524289)     return "https://api-testnet.polygonscan.com/";
    return "";
};

/**
 * Get api key of a network scanner.
 * Optionaly can be used to get contract abi from network scanner if the contract is verfied
 * 
 * @param {number} chainId - network chain id to get the scanner keys for
 * @returns etherscan api key
 */
const getEtherscanKey = (chainId) => { 
    if (chainId === 1)          return process.env.ETHERSCAN_API_KEY;
    if (chainId === 5)          return process.env.ETHERSCAN_API_KEY;
    if (chainId === 10)         return process.env.OPTIMISM_API_KEY;
    if (chainId === 56)         return process.env.BSC_API_KEY;
    if (chainId === 137)        return process.env.POLYGONSCAN_API_KEY;
    if (chainId === 250)        return process.env.FTM_API_KEY;
    if (chainId === 42161)      return process.env.ARBITRUM_API_KEY;
    if (chainId === 42220)      return process.env.CELO_API_KEY;
    if (chainId === 43114)      return process.env.SNOWTRACE_API_KEY;
    if (chainId === 524289)     return process.env.POLYGONSCAN_API_KEY;
    return "";
};

/**
 * Get an ethers contract instance with signer that reads the contract abi from network scanner if the contract is verified
 * 
 * @param {string} address - Address of the deployed contract
 * @param {ethers.Signer} signer - Ethers signer with provider to instantiate the contract with
 * @param {string} key - Provided ethersscan key
 * @returns Ethers contract instance
 */
const getContract = async (address, signer, key) => {
    //Get Source code from contract
    const chainId = (await signer.provider?.getNetwork())?.chainId;
    if (!chainId) throw "Undefined provider";

    const url = `${
        getEtherscanBaseURL(Number(chainId))
    }api?module=contract&action=getsourcecode&address=${
        address.toLowerCase()
    }&apikey=${
        key ? key : getEtherscanKey(Number(chainId))
    }`;
    
    const source = await axios.get(url);
    if (!source?.data?.result[0]?.ABI) throw "Could not get the contract abi";

    // Get Orderbook Instance
    return new ethers.Contract(address, source.data.result[0].ABI, signer);
};

/**
 * Processes the passed arguments
 * 
 * @param {string[]} params - Passed parameters
 * @returns Values passed as arguments
 */
const processArgs = (params) => {
    const values = {};
    const result = {};
    const args = params.splice(2);

    // get orders file
    if (args.includes("--orders")) values.orders = args.splice(args.indexOf("--orders"), 2)[1];
    else if (args.includes("-o")) values.orders = args.splice(args.indexOf("-o"), 2)[1];
    else if (args.includes("-O")) values.orders = args.splice(args.indexOf("-O"), 2)[1];
    else values.orders = "./orders.json";

    // get rpc url
    if (args.includes("-r")) values.rpc = args.splice(args.indexOf("-r"), 2)[1];
    else if (args.includes("-R")) values.rpc = args.splice(args.indexOf("-R"), 2)[1];
    else if (args.includes("--rpc")) values.rpc = args.splice(args.indexOf("--rpc"), 2)[1];
    else values.rpc = process.env.RPC_URL;

    // get wallet private key
    if (args.includes("-k")) values.key = args.splice(args.indexOf("-k"), 2)[1];
    else if (args.includes("-K")) values.key = args.splice(args.indexOf("-K"), 2)[1];
    else if (args.includes("--key")) values.key = args.splice(args.indexOf("--key"), 2)[1];
    else values.key = process.env.WALLET_KEY;

    // get orderbook contract address from passed arguments
    if (args.includes("--ob-add")) {
        const v = args.splice(args.indexOf("--ob-add"), 2)[1];
        if (v?.match(/^0x[A-Fa-f0-9]{40}$/)) result.orderbook = v;
    }

    // get arb contract address from passed arguments
    if (args.includes("--arb-add")) {
        const v = args.splice(args.indexOf("--arb-add"), 2)[1];
        if (v?.match(/^0x[A-Fa-f0-9]{40}$/)) result.arb = v;
    }

    // get etherscan key 
    if (args.includes("--etherscan-key")) result.etherscan = args.splice(
        args.indexOf("--etherscan-key"), 
        2
    )[1];

    // check for --use-etherscan flag
    if (args.includes("--use-etherscan")) {
        args.splice(args.indexOf("--use-etherscan"), 1);
        result.useEtherscan = true;
    }

    if (values.orders && values.orders.endsWith(".json")) {
        try {
            result.orders = JSON.parse(
                fs.readFileSync(
                    path.resolve(__dirname, values.orders)
                )
            );
        }
        catch (err) {
            if (err.message) throw "Invalid orders file: " + err.message;
            else throw "Invalid orders file: " + err;
        }
    }
    else throw "Invalid orders file!";

    if (values.rpc && values.rpc.match(/^http(s)?:\/\/|^ws(s)?:\/\//)) result.rpc = values.rpc;
    else throw "Invalid RPC URL!";

    if (values.key && values.key.match(/^[A-Fa-f0-9]{64}/)) result.key = values.key;
    else throw "Invalid wallet private key!";

    return result;
};


const main = async() => { 
    if (argv.slice(2).find(v => v === "-h" || v === "-H" || v === "--help")) {
        console.log(`
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
`
        );
    }
    else try {
        console.log("\nStarting the Rain 0x take order process...\n");
        const args = processArgs(argv);
        const orders = args.orders;
        const provider = new ethers.providers.JsonRpcProvider(args.rpc);
        const signer = new ethers.Wallet(args.key, provider);
        const chainId = (await provider.getNetwork()).chainId;
        const configData = config.find(v => Number(v.chainId) === chainId);

        // checking required data validity
        const obAdd = args.orderbook ? args.orderbook : configData.orderbookAddress;
        const arbAdd = args.arb ? args.arb : configData.arbAddress;
        if (!obAdd) throw "Undefined orderbook contract address";
        if (!arbAdd) throw "Undefined arb contract address";
        if (!chainId) throw "Undefined operating network";
        if (!configData.api) throw "Undefined 0x api url";
        if (!orders || !Array.isArray(orders)) throw "Invalid specified orders";

        console.log("Checking the market price...\n");

        const api = configData.apiUrl;
        const orderbook = args.useEtherscan || args.etherscan 
            ? getContract(obAdd, signer, args.etherscan) 
            : new ethers.Contract(
                obAdd,
                obAbi,
                signer
            );
        const arb = args.useEtherscan || args.etherscan 
            ? getContract(arbAdd, signer, args.etherscan) 
            : new ethers.Contract(
                arbAdd,
                arbAbi,
                signer
            );

        // running over specified order
        for (let i = 0; i < orders.length; i++) {
            // @TODO - once sg is ready, read Order struct from sg

            // getting output vault balance to check if it's not empty to proceed
            const outputTokenBalance = await orderbook.vaultBalance(
                orders[i].owner, 
                orders[i].validOutputs[0].token, 
                orders[i].validOutputs[0].vaultId
            );

            console.log("Order's output vault balance:",  outputTokenBalance.toString(), "\n");

            // only try to clear if vault balance is not zero
            if (!outputTokenBalance.isZero()) {

                // getting input vault balance for eval context
                const inputTokenBalance = await orderbook.vaultBalance(
                    orders[i].owner, 
                    orders[i].validInputs[0].token, 
                    orders[i].validInputs[0].vaultId
                );

                const input =  {
                    address : orders[i].validInputs[0].token,
                    decimals: orders[i].validInputs[0].decimals,
                    vaultId: orders[i].validInputs[0].vaultId,
                    balance: inputTokenBalance.toHexString()
                };
                const output = {
                    address : orders[i].validOutputs[0].token, 
                    decimals : orders[i].validOutputs[0].decimals, 
                    vaultId : orders[i].validOutputs[0].vaultId, 
                    balance : outputTokenBalance.toHexString()
                };

                // calculate the order hash needed in context for eval
                const orderhash = ethers.utils.keccak256(
                    ethers.utils.defaultAbiCoder.encode(
                        [
                            "tuple(" 
                                + "address,"
                                + "bool,"
                                + "tuple(address,address,address),"
                                + "tuple[](address,uint8,uint256),"
                                + "tuple[](address,uint8,uint256)" +
                            ")"
                        ],
                        [[
                            orders[i].owner, 
                            orders[i].handleIO, 
                            [
                                orders[i].evaluable.interpreter, 
                                orders[i].evaluable.store, 
                                orders[i].evaluable.expression
                            ], 
                            [[
                                orders[i].validInputs[0].token, 
                                orders[i].validInputs[0].decimals, 
                                orders[i].validInputs[0].vaultId
                            ]],
                            [[
                                orders[i].validOutputs[0].token, 
                                orders[i].validOutputs[0].decimals, 
                                orders[i].validOutputs[0].vaultId
                            ]]
                        ]]
                    )
                );

                // eval the Calculate source to get the stack result in order to calculate the 0x quote 
                // sell amount, the quote amount should be minimum of maxOutput and output vault balance.
                // Orderbook address as signer, vital for getting correct eval results.
                const obAsSigner = new ethers.VoidSigner(
                    orderbook.address,
                    provider
                ); 
                const interpreter = args.useEtherscan || args.etherscan 
                    ? getContract(
                        orders[i].evaluable.interpreter, 
                        obAsSigner, 
                        args.etherscan
                    ) 
                    : new ethers.Contract(
                        orders[i].evaluable.interpreter,
                        interpreterAbi,
                        obAsSigner
                    );
                
                const { stack: [ maxOutput, ratio ] } = await interpreter.eval(
                    orders[i].evaluable.store,
                    orders[i].owner,
                    orders[i].evaluable.expression + "00000002",
                    // construct the context for eval
                    [
                        [ 
                            // base column 
                            arb.address, 
                            orderbook.address 
                        ], 
                        [
                            // calling context column 
                            orderhash, 
                            orders[i].owner, 
                            arb.address 
                        ], 
                        [
                            // calculateIO context column 
                        ], 
                        [
                            // input context column 
                            input.address, 
                            input.decimals, 
                            input.vaultId, 
                            input.balance, 
                            "0" 
                        ], 
                        [
                            // output context column 
                            output.address, 
                            output.decimals, 
                            output.vaultId, 
                            output.balance, 
                            "0" 
                        ], 
                        [
                            // empty context column
                        ], 
                        [
                            // signed context column
                        ] 
                    ]
                );

                // take minimum of maxOutput and output vault balance for 0x qouting amount
                const quoteAmount = outputTokenBalance.lte(maxOutput)
                    ? outputTokenBalance
                    : maxOutput;

                // only try to clear if quote amount is not zero
                if (!quoteAmount.isZero()) {

                    // get quote from 0x
                    const response = await axios.get(
                        `${
                            api
                        }swap/v1/quote?buyToken=${
                            input.address.toLowerCase()
                        }&sellToken=${
                            output.address.toLowerCase()
                        }&sellAmount=${
                            quoteAmount.toString()
                        }`,
                        { headers: { "accept-encoding": "null" } }
                    );

                    // proceed if 0x quote is valid
                    const txQuote = response?.data;
                    if (txQuote && txQuote.guaranteedPrice) {

                        console.log("Checking the market price against order's ratio...\n");

                        // compare the ratio against the quote price and try to clear if 
                        // quote price is greater or equal
                        if (ethers.utils.parseUnits(txQuote.price).gte(ratio)) {

                            console.log("Found a match, submitting an order to clear...\n");

                            // construct the take order config
                            const takeOrder = {
                                order: {
                                    owner: orders[i].owner,
                                    handleIO: orders[i].handleIO,
                                    evaluable: orders[i].evaluable,
                                    validInputs: orders[i].validInputs,
                                    validOutputs: orders[i].validOutputs
                                },
                                inputIOIndex: 0,
                                outputIOIndex: 0,
                                signedContext: []
                            };
                            const takeOrdersConfigStruct = {
                                output: input.address,
                                input: output.address,
                                // max and min input should be exactly the same as quoted sell amount
                                // this makes sure the cleared order amount will exactly match the 0x quote
                                minimumInput: quoteAmount,
                                maximumInput: quoteAmount,
                                maximumIORatio: MAX_UINT_256,
                                orders: [ takeOrder ],
                            };

                            // submit the transaction
                            try {
                                const tx = await arb.arb(
                                    takeOrdersConfigStruct,
                                    txQuote.allowanceTarget,
                                    txQuote.data,
                                    { gasPrice: txQuote.gasPrice }
                                );
                                console.log(tx, "\n");
                                console.log("Transaction submitted successfully, checking next order...\n");
                                // console.log(await tx.wait(), "\n");
                                // console.log("Order cleared successfully, checking next order...\n");
                            }
                            catch (_e) {
                                console.log(_e, "\n");
                                console.log( "Transaction failed, checking next order...\n");
                            }
                        }
                        else console.log(
                            "Market price is lower than order's ratio, checking next order...\n"
                        );
                    }
                    else console.log(
                        "Did not get a valid 0x quote, checking next order...\n"
                    );
                }
                else console.log(
                    "Order's max output is zero, checking next order...\n"
                );
            }
            else console.log(
                "Order's output vault is empty, checking next order...\n"
            );
        }
        return true;
    }
    catch (err) {
        const errMsgs = new RegExp([
            /^Invalid RPC URL/,
            /^Invalid orders file/,
            /^Invalid wallet private key/,
            /^Undefined orderbook contract address/,
            /^Undefined arb contract address/,
            /^Undefined operating network/,
            /^Undefined 0x api url/,
            /^Invalid specified orders/,
        ]
            .map(v => v.source)
            .join("|")
        );
        if (typeof err === "string" && err.match(errMsgs)) console.log(err, "\n");
        else throw "An error occured during execution: \n\n\t" + (err.message ? err.message : err) + "\n";
    }
};

main().then(
    (v) => {
        const exit = process.exit;
        if (v) console.log("Rain 0x take order process executed successfully!\n");
        exit(0);
    }
).catch(
    (error) => {
        console.error(error);
        const exit = process.exit;
        exit(1);
    }
);
