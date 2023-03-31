const ethers = require("ethers");
const bot = require("./src/index");
const orders = require("./orders");
// const { argv } = require("process"); 
const config = require("./config.json");
const { execSync } = require("child_process");

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
    console.log("\nStarting the Rain arbitrage bot...\n"); 
    try {
        // check the env variables before starting
        if (process.env.BOT_WALLET_PRIVATEKEY) {
            if (process.env.RPC_URL) {
                const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
                const signer = new ethers.Wallet(process.env.BOT_WALLET_PRIVATEKEY, provider);
                const chainId = (await provider.getNetwork()).chainId;
                let configData = config.find(v => Number(v.chainId) === chainId);
                if (chainId && configData) {
                    // starting the order taker bot
                    await bot(
                        signer, 
                        configData.apiUrl, 
                        configData.orderBookAddress,
                        configData.arbAddress,
                        orders
                    );
                }
                else throw new Error("network config not found");
            }
            else throw new Error("RPC URL not found");
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
