// const axios = require('axios');
const obAbi = require('../abis/OrderBook.json');
const { ethers, BigNumber } = require('ethers');
const arbAbi = require('../abis/ZeroExOrderBookFlashBorrower.json');


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
            // eslint-disable-next-line no-undef
            const num = BigInt(float).toString();
            return BigNumber.from(num.padEnd(num.length + decimals), '0');
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
            return this.bnFromFloat(float, decimals);
        }
        catch {
            return undefined;
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
    const num = bn.toBigInt().toString();
    return BigNumber.from(
        num + '0'.repeat(18 - decimals)
    );
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
        const num = bn.toBigInt().toString();
        return BigNumber.from(
            num.slice(0, decimals - 18)
        );
    }
    else return bn;
};
 
/**
 * Get base url
 * 
 * @param {string} network - network to get the contract ABI from
 * @returns base etherscan utl
 */
exports.getEtherscanBaseURL = (network) => { 
    let url = '';
    if (network === "mumbai") url = 'https://api-testnet.polygonscan.com/api';
    else if(network === "goerli") url = '';
    else if(network === "snowtrace") url = '';
    else if(network === "sepolia") url = 'https://api-sepolia.etherscan.io/api';
    else if(network === "polygon") url = 'https://api.polygonscan.com/api';
    return url;
};

/**
 * Get etherscan key
 * 
 * @param {string} network - network to get the contract ABI from
 * @returns etherscan api key
 */
exports.getEtherscanKey = (network) => { 
    let key = '';
    if (network === "mumbai" || network === "polygon") key = process.env.POLYGONSCAN_API_KEY;
    else if(network === "goerli") key = '';
    else if(network === "snowtrace") key = '';
    else if(network === "sepolia") key = process.env.ETHERSCAN_API_KEY;
    return key;
};

/**
 * Get Orderbook contract instance with signer
 * 
 * @param {string} network - network to get the contract ABI from
 * @param {ethers.Signer} signer - ethers signer to instantiate the contract with
 * @returns - ethers Orderbook contract instance
 */
exports.getOBInstance = async (network,signer) => {
    console.log("network : " , network );
    //Get Source code from contract
    // const url = `${
    //     this.getEtherscanBaseURL(network)
    // }?module=contract&action=getsourcecode&address=${
    //     "0x8c025F3002B70511B4725d038B14dE4D5C7dA6cB"
    // }&apikey=${
    //     this.getEtherscanKey(network)
    // }`;
    // const source = await axios.get(url);

    // Get Orderbook Instance
    return new ethers.Contract(
        "0x8c025F3002B70511B4725d038B14dE4D5C7dA6cB",
        // source.data.result[0].ABI,
        obAbi.abi,
        signer
    );
}; 

/**
 * Get 0xOrderBookFlashBorrower contract instance with signer
 * 
 * @param {string} network - network to get the contract ABI from
 * @param {ethers.Signer} signer - ethers signer to instantiate the contract with
 * @returns ethers 0xOrderBookFlashBorrower contract instance
 */
exports.getZeroExInstance = async (network,signer) => { 
    //Get Source code from contract
    // const url = `${
    //     this.getEtherscanBaseURL(network)
    // }?module=contract&action=getsourcecode&address=${
    //     "0x9399464E07dc501534545C09f4e5c428C162076c"
    // }&apikey=${
    //     this.getEtherscanKey(network)
    // }`;
    // const source = await axios.get(url);

    // Get Orderbook Instance
    return new ethers.Contract(
        "0x9399464E07dc501534545C09f4e5c428C162076c",
        // source.data.result[0].ABI,
        arbAbi.abi,
        signer
    );
};
