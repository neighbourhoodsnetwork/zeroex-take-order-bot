## Arbitrage Trading Bot 
Bot for targeting sepcific order. This both requires NodeJS to be installed on your local machine. The operating network will be derived from RPC_URL that is specified for the bot tomoperate on.

Clone the repo and install Dependencies:
```bash
npm install
```
<br>

Create a `.env` file and populate it with following:
```bash
BOT_WALLET_PRIVATEKEY="<private-key-of-bot-account>" 
RPC_URL="<rpc-url-for-network>"
```
<br>

Next put the desired orders in the `./src/order.js` file, which bot will go over them in order to try to clear.
The format should be valid `javascript` object and all properties of a valid Order struct is required.
`validInputs` and `validOutputs` should only have one item each, if not, only the first items going to be used 
by the bot and rest of themwill be ignored.
Example: 
```javascript
{
  owner: "owner address",
  handleIO: false, // true or false
  evaluable: {
    interpreter: "interpreter address",
    store: "store address",
    expression: "order expression address"
  },
  validInputs: [{
    token: "input token address",
    decimals: 6, // input token decimals
    vaultId: "vault id"
  }],
  validOutputs: [{
    token: "output token address",
    decimals: 18, // output token decimals
    vaultId: "vault id"
  }]
}
```
<br>

Now run the bot with: 
```bash
node run.js
```

