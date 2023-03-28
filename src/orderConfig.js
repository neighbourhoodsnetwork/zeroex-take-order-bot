

// Since bot will target a particular order. 
// There is no need to fetch order again and again. 
module.exports = {   
        "owner" : "0xa25f22b0ab021a9ca1513c892e6faacc50e92907" ,  
        "handleIO" : "true", 
        "evaluable" : {
            "interpreter" : "0x842056b68aa8c3b14c09ba6eb69618f854e168c7" , 
            "store" : "0x22345029ba9bd5a252cd67b7aae92ba5bbea4196" , 
            "expression" : "0xd7fe6a19a11fda69bad14450e9d06c69dc5f858c"
        },
        "validInputs": [
          {
            "token": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            "decimals": 6,
            "vaultId": {
              "type": "BigNumber",
              "hex": "0x05f3ff447c32b611352527c7afa8c3f7deee31428637a91cb3574f399b53b8fa"
            }
          }
        ],
        "validOutputs": [
          {
            "token": "0x84342e932797FC62814189f01F0Fb05F52519708",
            "decimals": 18, 
            "vaultId": {
              "type": "BigNumber",
              "hex": "0x05f3ff447c32b611352527c7afa8c3f7deee31428637a91cb3574f399b53b8fa"
            }
          }
        ],
        "evaluableConfig": {
          "deployer": "0x0a8c6d9ebc0af7852f756c47b1801c500d7b2901",
          "sources": [
            "0x000d0001000d000000040102002b000000180001000d0003004a0000000d00020000203f001a0000000d0004000d0005001b0002002d000000180001000d000700080221000d0008000d0009001e0002000d000b000d0006003e0000",
            "0x000d000d000d00030004040400040401000d0006000d00040025000100080231000d0002004a0000000d000e0000001f000d000e0000203f000d0002000d000a000d0010002d0000001a0000000d000a000d00070001001f0001203f000d000e002a0000004b0000000d0000000d0008004b0000",
            "0x000d000d000d000f000d0002004a0000000d0000001b0002000d0006000d0004001c0002000d0008000d0011001b0002000d000400210002000d000600220002"
          ],
          "constants": [
            "0x95DE47fDee675D1850e74777610587ad857cb4EF",
            "0xac62de4eba19d5b81f845e169c63b25688d494f595bb85367ef190897e811aa9",
            "86400",
            "0",
            "10000000000000000000",
            "1020000000000000000",
            "0xc5a65bb3dc9abdd9c751e2fb0fb0ccc8929e1f040a273ce685f88ac4385396c8",
            "1000000000000000000000",
            "1"
          ]
        },
        "meta": "0xff0a89c674ee7874"
      }
