const axios = require('axios'); 
const ethers = require('ethers');
const orders = require('./orders.js');
const config = require('./config.js');
const obAbi = require('./abis/OrderBook.json');
const arbAbi = require('./abis/ZeroExOrderBookFlashBorrower.json');
require('dotenv').config(); 

const MAX_UINT_256 = ethers.constants.MaxUint256.toHexString();

(async () => {

    let api, signer, chainId, provider, orderbook, arb;

    try {
        // check the env variables before starting
        if (process.env.BOT_WALLET_PRIVATEKEY) {
            if (process.env.RPC_URL) {
                provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
                signer = new ethers.Wallet(process.env.BOT_WALLET_PRIVATEKEY, provider);
                chainId = (await provider.getNetwork()).chainId; 
                let index = config.findIndex(v => v.chainId === chainId);
                if (chainId && index > -1) {
                    api = config[index].apiUrl;
                    orderbook = new ethers.Contract(
                        config[index].orderBookAddress,
                        obAbi.abi,
                        signer
                    );
                    arb = new ethers.Contract(
                        config[index].arbAddress,
                        arbAbi.abi,
                        signer
                    );
                }
                else throw new Error('network config not found');
            }
            else throw new Error('RPC not found');
        }
        else throw new Error('bot wallet private key not found'); 

        console.log('Checking the market price and submitting order...');

        for (let i = 0; i < orders.length; i++) {
            // @TODO - once sg is ready, read Order struct from sg

            const outputTokenBalance = await orderbook.vaultBalance(
                orders[i].owner, 
                orders[i].validOutputs[0].token, 
                orders[i].validOutputs[0].vaultId
            );

            console.log("Order's output vault balance:",  outputTokenBalance.toString());

            const input_ =  {
                address : orders[i].validInputs[0].token,
                symbol : "USDT",
                decimals: 6
            };
            const output_ = {
                address : orders[i].validOutputs[0].token, 
                symbol : "NHT",
                decimals: 18,
                balance : outputTokenBalance
            };

            const query = `${
                api
            }swap/v1/quote?buyToken=${
                input_.address.toLowerCase()
            }&sellToken=${
                output_.address.toLowerCase()
            }&sellAmount=${
                outputTokenBalance.sub("2000000000000000000").toString()
            }`;

            let res; 
            try{
                res = await axios.get(
                    query,
                    {
                        headers: { 'accept-encoding': 'null' }
                    }
                );
            }
            catch (err) {
                console.log(err);
            }

            let txQuote = res?.data;
            if (txQuote && txQuote.guaranteedPrice) {

                console.log("submitting an order to clear...");

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
                    output: input_.address,
                    input: output_.address,
                    // max and min input should be exactly the same as qouted sell amount
                    // sub 2 (default for NHT token) so not all the vault balance gets cleared
                    minimumInput: outputTokenBalance.sub("2000000000000000000"),
                    maximumInput: outputTokenBalance.sub("2000000000000000000"),
                    maximumIORatio: MAX_UINT_256,
                    orders: [takeOrder],
                };
                const data = txQuote.data;
                // const gasLimit = txQuote.gasLimit;
                const gasPrice = txQuote.gasPrice;
                const spender = txQuote.allowanceTarget;
                const tx = await arb.connect(signer).arb(
                    takeOrdersConfigStruct,
                    spender,
                    data,
                    {
                        gasPrice
                        // gasLimit
                    }
                );
                console.log((await tx.wait()));
            }
        }
    } 
    catch (error) {
        console.log("Error : " , error);
    }
})();