
const axios = require('axios') 
const contractConfig = require('../config/contracts.config.json')  
const { ethers, BigNumber } = require('ethers'); 




/**
 * convert float numbers to big number
 * 
 * @param {*} float - any form of number
 * @param {number} decimals - Decimals point of the number
 * @returns ethers BigNumber with decimals point
 */
exports.bnFromFloat = (float, decimals) => {
    if (typeof float == 'string') {
        if (float.startsWith('0x')) {
            const num = BigInt(float).toString()
            return BigNumber.from(num.padEnd(num.length + decimals), '0')
        }
        else {
            if (float.includes('.')) {
                const offset = decimals - float.slice(float.indexOf('.') + 1).length
                float = offset < 0 ? float.slice(0, offset) : float;
            }
            return ethers.utils.parseUnits(float, decimals) 
        }
    }
    else {
        try {
            float = float.toString()
            return this.bnFromFloat(float, decimals)
        }
        catch {
            return undefined
        }
    
    }
},

/**
 * Convert a BigNumber to a fixed 18 point BigNumber
 * 
 * @param {BigNumber} bn - The BigNumber to convert
 * @param {number} decimals - The decimals point of the given BigNumber
 * @returns A 18 fixed point BigNumber
 */
exports.toFixed18 = (bn, decimals) => {
    const num = bn.toBigInt().toString()
    return BigNumber.from(
        num + '0'.repeat(18 - decimals)
    )
},

/**
 * Convert a 18 fixed point BigNumber to a  BigNumber with some other decimals point
 * 
 * @param {BigNumber} bn - The BigNumber to convert
 * @param {number} decimals - The decimals point of convert the given BigNumber
 * @returns A decimals point BigNumber
 */
exports.fromFixed18 = (bn, decimals) => {
    if (decimals != 18) {
        const num = bn.toBigInt().toString()
        return BigNumber.from(
            num.slice(0, decimals - 18)
        )
    }
    else return bn
}
 


/*
* Get base url
*/
exports.getEtherscanBaseURL = (network) => { 

  let url = ''
  if (network === "mumbai"){ 
    url = 'https://api-testnet.polygonscan.com/api'
  }else if(network === "goerli"){
    url = ''
  }else if(network === "snowtrace"){
    url = ''
  }else if(network === "sepolia"){
    url = 'https://api-sepolia.etherscan.io/api'
  }else if(network === "polygon"){
    url = 'https://api.polygonscan.com/api'
  }
  return url
}   

/*
* Get etherscan key
*/
exports.getEtherscanKey = (network) => { 

  let key = ''
  if (network === "mumbai" || network === "polygon"){ 
    key = process.env.POLYGONSCAN_API_KEY
  }else if(network === "goerli"){
    key = ''
  }else if(network === "snowtrace"){
    key = ''
  }else if(network === "sepolia"){
    key = process.env.ETHERSCAN_API_KEY
    
  }
  return key
}    

 

exports.getOBInstance = async (network,signer) => {  

  console.log("network : " , network )

  //Get Source code from contract
  const url = `${this.getEtherscanBaseURL(network)}?module=contract&action=getsourcecode&address=${contractConfig[network].orderbook.address}&apikey=${this.getEtherscanKey(network)}`;
  const source = await axios.get(url);   

  // Get Orderbook Instance
  const orderBook = new ethers.Contract(contractConfig[network].orderbook.address,source.data.result[0].ABI,signer) 

  return orderBook
} 


exports.getZeroExInstance = async (network,signer) => { 

  console.log("contractConfig[network].zeroexorderbook.address : " , contractConfig[network].zeroexorderbook.address )
  //Get Source code from contract
  const url = `${this.getEtherscanBaseURL(network)}?module=contract&action=getsourcecode&address=${contractConfig[network].zeroexorderbook.address}&apikey=${this.getEtherscanKey(network)}`;
  const source = await axios.get(url);   

  // Get Orderbook Instance
  const zeroEx = new ethers.Contract(contractConfig[network].zeroexorderbook.address,source.data.result[0].ABI,signer) 

  return zeroEx 
}