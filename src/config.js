/**
 * Configurations of the networks that the bot will operate on.
 */
module.exports = [
    {
        network: 'polygon',
        chainId: 137,
        apiUrl: 'https://polygon.api.0x.org/',
        defaultRpc: '',
        orderBookAddress : "0x8c025F3002B70511B4725d038B14dE4D5C7dA6cB",
        arbAddress : "0x9399464E07dc501534545C09f4e5c428C162076c",
        proxyAddress: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        nativeToken: {
            symbol: 'MATIC',
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            decimals: 18
        },
        // trackedTokens: [
        //     {
        //         symbol: 'USDT',
        //         address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        //         decimals: 6
        //     } ,
        //     {
        //         symbol: 'NHT',
        //         address: '0x84342e932797FC62814189f01F0Fb05F52519708',
        //         decimals: 18
        //     }
        // ]
    },
    {
        network: 'mumbai',
        chainId: 0x80001,
        apiUrl: 'https://mumbai.api.0x.org/',
        defaultRpc: '',
        arbAddress: '0xd14ead3f35f1c034f9fe43316bf36edca2cb2b90',
        orderBookAddress: '0xe646c1bf3cb1223234ebd934d0257fc21ac141cf',
        proxyAddress: '0xf471d32cb40837bf24529fcf17418fc1a4807626',
        nativeToken: {
            symbol: 'MATIC',
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            decimals: 18
        },
        // trackedTokens: [
        //     {
        //         symbol: 'USDT',
        //         address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        //         decimals: 6
        //     } ,
        //     {
        //         symbol: 'NHT',
        //         address: '0x84342e932797FC62814189f01F0Fb05F52519708',
        //         decimals: 18
        //     }
        // ]
    }
];


// Interprter : 0xaE870f76CaF6EE851953303D66fCA0d836D62e22
// Store : 0xE45F955886fae8e64A4CdDd26F9e3DaF08A5ef85
// Deployer : 0x56EB744dd1600C0D7119ECfAe9ff77B56C98953E
// OrderBook : 0x8c025F3002B70511B4725d038B14dE4D5C7dA6cB
// arb : 0x9399464E07dc501534545C09f4e5c428C162076c
// 0x7bd60a6ad667f5cadbe3328f4a5c425fda8b9ab4