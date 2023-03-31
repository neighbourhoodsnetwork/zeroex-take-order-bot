const axios = require("axios"); 
const ethers = require("ethers");
const { abi: obAbi } = require("../abis/OrderBook.json");
const { abi: interpreterAbi } = require("../abis/IInterpreterV1.json");
const { abi: arbAbi } = require("../abis/ZeroExOrderBookFlashBorrower.json");


/**
 * Handled arbitrage bot internall proceesses
 * 
 * @param {ethers.Wallet} signer - The bot ethers Wallet (signer)
 * @param {string} api - The 0x api
 * @param {string} obAddress - Orderbook address
 * @param {string} arbAddress - 0xOrderBookFlashBorrower address
 * @param {string} orders - The orders to clear
 */
module.exports = async(signer, api, obAddress, arbAddress, orders) => {

    const MAX_UINT_256 = ethers.constants.MaxUint256.toHexString();

    try {
        console.log("Checking the market price and submitting order...\n");

        // instantiating the contracts
        const orderbook = new ethers.Contract(
            obAddress,
            obAbi,
            signer
        );
        const arb = new ethers.Contract(
            arbAddress,
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
                    orders[i].validOutputs[0].token, 
                    orders[i].validOutputs[0].vaultId
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
                        ["tuple(address,bool,tuple(address,address,address),tuple[](address,uint8,uint256),tuple[](address,uint8,uint256))"],
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
                console.log("Order hash: ", orderhash);

                // eval the Calculate source to get the stack result in order to calculate the 0x quote 
                // sell amount, the quote amount should be minimum of maxOutput and output vault balance.
                // Orderbook address as signer, vital for getting correct eval results.
                const obAsSigner = new ethers.VoidSigner(orderbook.address, signer.provider); 
                const interpreter = new ethers.Contract(
                    orders[i].evaluable.interpreter,
                    interpreterAbi
                );
                const { stack: [ maxOutput, ratio ] } = await interpreter.connect(obAsSigner).eval(
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
                            // empty context column 
                        ], 
                        [
                            // input context column 
                            input.token, 
                            input.decimals, 
                            input.vaultId, 
                            input.balance, 
                            "0" 
                        ], 
                        [
                            // output context column 
                            output.token, 
                            output.decimals, 
                            output.vaultId, 
                            output.balance, 
                            "0" 
                        ], 
                        [
                            // empty context column
                        ], 
                        [
                            // signed context, empty
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
                    const res = await axios.get(
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
                    let txQuote = res?.data;
                    if (txQuote && txQuote.guaranteedPrice) {

                        console.log("Checking the market price against order's ratio...\n");

                        // compare the ratio against the quote price and try to clear if quote price is greater or equal
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
                            arb.connect(
                                signer
                            ).arb(
                                takeOrdersConfigStruct,
                                txQuote.allowanceTarget,
                                txQuote.data,
                                { gasPrice: txQuote.gasPrice }
                            ).then(
                                v => {
                                    v.wait().then(
                                        e => console.log(e)
                                    ).catch(
                                        e => console.log(e)
                                    );
                                    console.log("order submitted successfully, checking next order...\n");
                                }
                            ).catch(
                                v => {
                                    console.log(v);
                                    console.log("order did not submit successfully, checking next order...\n");
                                }
                            );
                        }
                        else console.log("Market price is lower than order's ratio, checking next order...\n");    
                    }
                    else console.log("Did not get a valid 0x quote, checking next order...\n");    
                }
                else console.log("Order's max output is zero, checking next order...\n");    
            }
            else console.log("Order's output vault is empty, checking next order...\n");
        }
    } 
    catch (error) {
        console.log("Error : " , error, "\n");
    }
};