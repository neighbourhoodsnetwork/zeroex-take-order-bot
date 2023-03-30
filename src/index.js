const axios = require("axios"); 
const ethers = require("ethers");
const orders = require("./orders.js");


module.exports = async(signer, api, orderbook, arb) => {

    const MAX_UINT_256 = ethers.constants.MaxUint256.toHexString();

    try {
        console.log("Checking the market price and submitting order...\n");

        for (let i = 0; i < orders.length; i++) {
            // @TODO - once sg is ready, read Order struct from sg

            const outputTokenBalance = await orderbook.vaultBalance(
                orders[i].owner, 
                orders[i].validOutputs[0].token, 
                orders[i].validOutputs[0].vaultId
            );

            console.log("Order's output vault balance:",  outputTokenBalance.toString(), "\n");

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

            // only try to clear if vault balance is not zero
            if (!outputTokenBalance.isZero()) {
                const query = `${
                    api
                }swap/v1/quote?buyToken=${
                    input_.address.toLowerCase()
                }&sellToken=${
                    output_.address.toLowerCase()
                }&sellAmount=${
                    outputTokenBalance.sub(2).toString()
                }`;

                const res = await axios.get(
                    query,
                    {
                        headers: { "accept-encoding": "null" }
                    }
                );

                let txQuote = res?.data;
                if (txQuote && txQuote.guaranteedPrice) {

                    console.log("submitting an order to clear...\n");

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
                        // this makes sure the cleared order amount will exactly match the 0x qoute
                        minimumInput: outputTokenBalance.sub(2).toString(),
                        maximumInput: outputTokenBalance.sub(2).toString(),
                        maximumIORatio: MAX_UINT_256,
                        orders: [takeOrder],
                    };

                    // submit the transaction
                    arb.connect(signer).arb(
                        takeOrdersConfigStruct,
                        txQuote.allowanceTarget,
                        txQuote.data,
                        {
                            gasPrice: txQuote.gasPrice
                            // gasLimit: txQoute.gasLimit
                        }
                    )
                        .then(v => {
                            console.log(v);
                            console.log("order submitted successfully, checking next order...\n");
                        })
                        .catch(v => {
                            console.log(v);
                            console.log("order did not submit successfully, checking next order...\n");
                        });
                }
            }
            else console.log("Order's output vault is empty, checking next order...\n");
        }
    } 
    catch (error) {
        console.log("Error : " , error, "\n");
    }
};