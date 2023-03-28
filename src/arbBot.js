// const fs = require('fs');
const axios = require('axios'); 
const { getOBInstance ,getZeroExInstance,  bnFromFloat, toFixed18} = require('./utils'); 
const orderConfig = require('./orderConfig.js')
const config = require('./config.js')
const timsort = require('timsort');
const cron = require('node-cron');

const ethers = require('ethers');

require('dotenv').config(); 

(async () => {   

    let network 
    let provider
    let signer
    let chainId
    let trackedTokens
    
    // let proxyAddress
    let nativeToken
    let nativeTokenDecimals
    let api
    try {

        // check the env variables before starting
        if (process.env.BOT_WALLET_PRIVATEKEY) {
            if (process.env.RPC_URL) {  
                network = process.env.NETWORK
                provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)  
                signer = new ethers.Wallet(process.env.BOT_WALLET_PRIVATEKEY,provider)
                chainId = (await provider.getNetwork()).chainId 
                let index = config.findIndex(v => Number(v.chainId) === chainId)
                if (chainId && index > -1) {
                    api = config[index].apiUrl
                    trackedTokens = config[index].trackedTokens
                    // proxyAddress = config[index].proxyAddress
                    nativeToken = config[index].nativeToken.address
                    nativeTokenDecimals = config[index].nativeToken.decimals
                }
                else throw new Error('network not supported')
            }
            else if (process.env.NETWORK) { 
                network = process.env.NETWORK
                let index = config.findIndex(v => v.network === process.env.NETWORK)
                if (index > -1) {
                    signer.connect(new ethers.providers.JsonRpcProvider(config[index].defaultRpc))
                    api = config[index].apiUrl
                    trackedTokens = config[index].trackedTokens
                    // proxyAddress = config[index].proxyAddress
                    nativeToken = config[index].nativeToken.address
                    nativeTokenDecimals = config[index].nativeToken.decimals
                }
                else throw new Error('network not supported')
            }
            else throw new Error('RPC or network not defined')
        }
        else throw new Error('bot wallet private key not defined') 


        const orderBook = await getOBInstance(network,signer)  

    
        const arb = await getZeroExInstance(network,signer) 

       // arrays of token initial token prices based oon WETH for initial match finding
        let priceDescending = [];
        let priceAscending = [];  
        
        //Cron Job to for Updating Price       
        cron.schedule('*/1 * * * *', ()=>{
            updatePriceArray()
        }) 

        //Cron Job for Reviweing Sloshed      
        cron.schedule('*/2 * * * *', ()=>{ 
            console.log('findMatch')
            findMatch()
        })  



        
        
        const updatePriceArray = async function () {   
            
            try {  
                console.log("Updating Price...")
                let zexPriceArray = []   
                
                const responses = await Promise.allSettled(
                    trackedTokens.map(
                        async(e) => {
                            const response = await axios.get(
                                `${
                                    api
                                }swap/v1/quote?buyToken=${
                                    e.address.toLowerCase()
                                }&sellToken=${
                                    nativeToken.toLowerCase()
                                }&sellAmount=${
                                    '1' + '0'.repeat(nativeTokenDecimals)
                                }`, 
                                { 
                                    headers: {
                                        'accept-encoding': 'null'
                                    } 
                                }
                            )
                            return {
                                symbol : e.symbol,
                                address: e.address.toLowerCase(),
                                decimals: e.decimals,
                                price : e.decimals < 18 
                                    ? toFixed18(
                                        bnFromFloat(
                                            response.data.price,
                                            e.decimals,
                                            true
                                        ),
                                        e.decimals
                                    )
                                    : bnFromFloat(
                                        response.data.price,
                                        e.decimals,
                                        true
                                    ),
                            }
                        }
                    )
                )

                for (let i = 0; i < responses.length; i++) {
                    if (responses[i].status == 'fulfilled') zexPriceArray.push(
                        responses[i].value
                    )
                }

                timsort.sort(
                    zexPriceArray, 
                    (a, b) => a.price.gt(b.price) ? -1 : a.price.lt(b.price) ? 1 : 0
                ) 

                priceDescending = zexPriceArray
                Object.assign(priceAscending, zexPriceArray);
                priceAscending.reverse() 
                console.log("Price Updated")
            
            } 
            catch (error) {
                console.log('error : ', error)
            }

        }   

        const findMatch = async() => {  

            console.log('Finding Match...') 

            // No need to fetch data from sg
            let slosh = orderConfig 

            let vaultId = ethers.BigNumber.from(orderConfig.validOutputs[0].vaultId.hex)  

            let inputTokenBalance = await orderBook.vaultBalance(
                signer.address,
                orderConfig.validInputs[0].token, 
                vaultId
            )   

            let outputTokenBalance = await orderBook.vaultBalance(
                signer.address,
                orderConfig.validOutputs[0].token, 
                vaultId
            )    

            

            let inputs_ = slosh.validInputs.map(
                e => { 
                    return {
                        address : e.token,
                        symbol : "USDT", // hard coding for now 
                        decimals: e.decimals,
                        balance : inputTokenBalance
                    }
                }
            )  
            let outputs_ =  slosh.validOutputs.map(
                     (e) => {   
                        return {
                            address : e.token, 
                            symbol : "NHT", // hard coding for now 
                            decimals: e.decimals,
                            balance :  outputTokenBalance
                        }
                    }
                ) 
            

            let possibleMatches = []
            let inputPrice
            for (let j = 0 ; j < outputs_.length ; j++) {
                let output_ = outputs_[j];

                if (output_.balance.gt(0)) {  
                    for (let k = 0 ; k < inputs_.length ; k++ ) { 
                        if (inputs_[k].symbol != output_.symbol) {
                            inputPrice = priceDescending.filter(
                                e => e.address == output_.address
                            )[0]
                            let outputPrice = priceAscending.filter(
                                e => e.address == inputs_[k].address
                            )[0]
                            
                            possibleMatches.push({
                                outputToken : output_,
                                inputToken : inputs_[k],
                                inputIndex: k,
                                outputIndex: j
                            }) 

                            console.log("Possible Match")

                            
                        }
                    }
                } 
            }  

            if (possibleMatches.length > 0) { 
                

                if (possibleMatches.length > 1) { 
                    console.log("sorting matches..." )
                    timsort.sort(
                        possibleMatches,
                        (a, b) => a.ratio.gt(b.ratio) ? -1 : a.ratio.lt(b.ratio) ? 1 : 0
                    )
                }
                for (let j = 0; j < possibleMatches.length; j++) { 
                    console.log("possibleMatches placing " )

                    let bestPossibleMatch = possibleMatches[j]
                    let res = (await axios.get(
                        `${
                            api
                        }swap/v1/quote?buyToken=${
                            bestPossibleMatch.inputToken.address
                        }&sellToken=${
                            bestPossibleMatch.outputToken.address
                        }&sellAmount=${
                            bestPossibleMatch.outputToken.balance.toString()
                        }&takerAddress=${
                            signer.address.toLowerCase()
                        }`,
                        {
                            headers: {
                                'accept-encoding': 'null'
                            }
                        }
                    ))
                    let txQuote = res?.data
                    if (txQuote && txQuote.guaranteedPrice) {
                      
                            console.log('found a match, submiting the transaction now...') 
                            const takeOrder = {
                                order: {
                                    owner: slosh.owner,
                                    handleIO: slosh.handleIO,
                                    evaluable: slosh.evaluable,
                                    validInputs: slosh.validInputs,
                                    validOutputs: slosh.validOutputs
                                },
                                inputIOIndex: bestPossibleMatch.inputIndex,
                                outputIOIndex: bestPossibleMatch.outputIndex,
                                signedContext: [] 
                            }; 
                            
                            const takeOrdersConfigStruct = {
                                output: bestPossibleMatch.inputToken.address,
                                input: bestPossibleMatch.outputToken.address,
                                minimumInput:bestPossibleMatch.outputToken.balance.toString(),
                                maximumInput: bestPossibleMatch.outputToken.balance.toString(),
                                maximumIORatio: ethers.BigNumber.from(
                                    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
                                  ).toString(), // setting to max 
                                orders: [takeOrder],
                            };
                            const spender = txQuote.allowanceTarget;
                            const data = txQuote.data;

                            placeOrder(takeOrdersConfigStruct, spender, data)
                        
                    }
                }
            }
            
        }   

        const placeOrder = async(takeOrdersConfig, spender, data) => { 
            await arb.connect(signer).arb(
                takeOrdersConfig,
                spender,
                data
            )
        } 

        
    } catch (error) {
        console.log("Error : " , error)
    }
})()