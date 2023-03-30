const ethers = require("ethers");
const bot = require("./src/index");
// const { argv } = require("process"); 
const config = require("./src/config.js");
const { execSync } = require("child_process");
const obAbi = require("./src/abis/OrderBook.json");
const arbAbi = require("./src/abis/ZeroExOrderBookFlashBorrower.json");

require("dotenv").config(); 


/**
 * Execute Child Processes
 * 
 * @param {string} cmd Command to execute
 * @returns The command to ran as shell
 */
const exec = (cmd) => {
    try {
        return execSync(cmd, { stdio: "inherit" });
    } 
    catch (e) {
        throw new Error(`Failed to run command \`${cmd}\``);
    }
};
 

const main = async() => { 
    console.log("\nStarting the Rain arbitrage bot..."); 
    try {
        // check the env variables before starting
        if (process.env.BOT_WALLET_PRIVATEKEY) {
            if (process.env.RPC_URL) {
                const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
                const signer = new ethers.Wallet(process.env.BOT_WALLET_PRIVATEKEY, provider);
                const chainId = (await provider.getNetwork()).chainId; 
                let index = config.findIndex(v => v.chainId === chainId);
                if (chainId && index > -1) {
                    const api = config[index].apiUrl;
                    const orderbook = new ethers.Contract(
                        config[index].orderBookAddress,
                        obAbi.abi,
                        signer
                    );
                    const arb = new ethers.Contract(
                        config[index].arbAddress,
                        arbAbi.abi,
                        signer
                    );
                    
                    // starting the bot internall process
                    await bot(signer, api, orderbook, arb);
                }
                else throw new Error("network config not found");
            }
            else throw new Error("RPC not found");
        }
        else throw new Error("bot wallet private key not found"); 
    }
    catch (err) {
        console.log(err);
    }
};

main().then(
    () => {
        const exit = process.exit;
        console.log("Rain arbitrage bot executed successfully!\n");
        exit(0);
    }
).catch(
    (error) => {
        console.error(error);
        const exit = process.exit;
        exit(1);
    }
);
