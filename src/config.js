/**
 * Tokens and their addresses and decimals of ETH mainnet
 */
module.exports = [
    {
        network: 'polygon',
        chainId: '137',
        apiUrl: 'https://polygon.api.0x.org/',
        defaultRpc: '',
        arbAddress: '',
        orderBookAddress: '',
        proxyAddress: '',
        nativeToken: {
            symbol: 'MATIC',
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            decimals: 18
        },
        trackedTokens: [
            {
                symbol: 'USDT',
                address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
                decimals: 6
            } ,
            {
                symbol: 'NHT',
                address: '0x84342e932797FC62814189f01F0Fb05F52519708',
                decimals: 18
            }
        ]
    },
    {
        network: 'mumbai',
        chainId: '80001',
        apiUrl: 'https://mumbai.api.0x.org/',
        defaultRpc: '',
        arbAddress: '0xd14ead3f35f1c034f9fe43316bf36edca2cb2b90',
        orderBookAddress: '',
        proxyAddress: '0xe646c1bf3cb1223234ebd934d0257fc21ac141cf',
        nativeToken: {
            symbol: 'MATIC',
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            decimals: 18
        },
        trackedTokens: [
            {
                symbol: 'USDT',
                address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
                decimals: 6
            } ,
            {
                symbol: 'NHT',
                address: '0x84342e932797FC62814189f01F0Fb05F52519708',
                decimals: 18
            }
        ]
    }
] 