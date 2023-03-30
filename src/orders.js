/**
 * List of orders and their properties needed for the bot to clear them, order is important, top orders will clear first
 */
module.exports = [
    {
        owner: "0x86aeF9BeaC77fee6f2165e515FcE6505F40afC27",
        handleIO: true,
        evaluable: {
            interpreter: "0xaE870f76CaF6EE851953303D66fCA0d836D62e22",
            store: "0xE45F955886fae8e64A4CdDd26F9e3DaF08A5ef85",
            expression: "0x88355b1c04e70cbf50a36a5a7d47bd29c97089e2"
        },
        validInputs: [{
            token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            decimals: 6,
            vaultId: "0x05f3ff447c32b611352527c7afa8c3f7deee31428637a91cb3574f399b53b8fa"
        }],
        validOutputs: [{
            token: "0x84342e932797FC62814189f01F0Fb05F52519708",
            decimals: 18,
            vaultId: "0x05f3ff447c32b611352527c7afa8c3f7deee31428637a91cb3574f399b53b8fa"
        }],
        // evaluableConfig: {
        //     deployer: "0x56EB744dd1600C0D7119ECfAe9ff77B56C98953E",
        //     sources: [
        //         "0x000d0001000d0000000401020028000000180001000d000300470000000d00020000203f001a0000000d0004000d0005001b0002002a000000180001000d000700080221000d0009000d0006003b0000000d0008000d0007001e0002000d000a000d000b00390000",
        //         "0x000d000d000d00030004040400040401000d0006000d00040024000100080231000d000200470000000d000e0000001f000d000e0000203f000d0002000d000a000d0010002a0000001a0000000d000a000d00070001001f0001203f000d000e0027000000480000000d0000000d000800480000",
        //         "0x000d000d000d000f000d000200470000000d0000001b0002000d0006000d0004001c0002000d0008000d0011001b0002000d000400210002000d000600220002"
        //     ],
        //     constants: [
        //         "0x9399464E07dc501534545C09f4e5c428C162076c",
        //         "77972495278833642094819470026370656159324223492829775753087982515005341899433",
        //         "86400",
        //         "0",
        //         "1020000000000000000",
        //         "250000000000000",
        //         "89399560691637062840373064769363936142816079139435654936243288670112442455752",
        //         "1000000000000000000000",
        //         "1"
        //     ]
        // },
        // meta: "0xff0a89c674ee7874"
    },
    // {
    //     owner: "0x86aeF9BeaC77fee6f2165e515FcE6505F40afC27",
    //     handleIO: false,
    //     evaluable: {
    //         interpreter: "0xaE870f76CaF6EE851953303D66fCA0d836D62e22",
    //         store: "0xE45F955886fae8e64A4CdDd26F9e3DaF08A5ef85",
    //         expression: "0xa01fe776d66602cf522d6b94302a3f3eba8ef529"
    //     },
    //     validInputs: [{
    //         token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    //         decimals: 6,
    //         vaultId: "0x05f3ff447c32b611352527c7afa8c3f7deee31428637a91cb3574f399b53b8fa"
    //     }],
    //     validOutputs: [{
    //         token: "0x84342e932797FC62814189f01F0Fb05F52519708",
    //         decimals: 18,
    //         vaultId: "0x05f3ff447c32b611352527c7afa8c3f7deee31428637a91cb3574f399b53b8fa"
    //     }],
    //     evaluableConfig: {
    //         deployer: "0x56EB744dd1600C0D7119ECfAe9ff77B56C98953E",
    //         constants: [
    //             "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    //             "250000000000000"
    //         ],
    //         sources: [ "0x000d0001000d0003", "0x" ]
    //     },
    //     meta: "0xff0a89c674ee7874"
    // }
];
