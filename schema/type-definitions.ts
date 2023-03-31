// type definitions to generate json schema for orders and config json files

export type Order = {
    /**
     * @title Order Owner
     * @pattern ^0x[0-9a-zA-Z]{40}$
     */
    owner: string;
    /**
     * @title Order Handle IO
     */
    handleIO: boolean;
    /**
     * @title Order Evaluable Struct
     * @description The evaluable struct of the Order
     */
    evaluable: {
        /**
         * @title Interpreter Address
         * @pattern ^0x[0-9a-zA-Z]{40}$
         */
        interpreter: string;
        /**
         * @title Store Address
         * @pattern ^0x[0-9a-zA-Z]{40}$
         */
        store: string;
        /**
         * @title Expression Address
         * @pattern ^0x[0-9a-zA-Z]{40}$ 
         */
        expression: string;
    };
    /**
     * @title Order Valid Inputs
     */
    validInputs: {
        /**
         * @title Token Address
         * @pattern ^0x[0-9a-zA-Z]{40}$
         */
        token: string;
        /**
         * @title Token Decimals
         */
        decimals: number;
        /**
         * @title Vault ID
         * @pattern ^0x[0-9a-zA-Z]{64}$
         */
        vaultId: string;
    }[];
    /**
     * @title Order Valid Outputs
     */
    validOutputs: {
        /**
         * @title Token Address
         * @pattern ^0x[0-9a-zA-Z]{40}$
         */
        token: string;
        /**
         * @title Token Decimals
         */
        decimals: number;
        /**
         * @title Vault ID
         * @pattern ^0x[0-9a-zA-Z]{64}$
         */
        vaultId: string;
    }[]
}[]

// type of config item
export type Config = {
    /**
     * @title Network
     * @description The network name.
     * @pattern [a-zA-Z0-9]+
     */
    network: string;
    /**
     * @title Network Chain ID
     */
    chainId: string | number;
    /**
     * @title 0x API URL
     * @pattern ^https://(.)+.api.0x.org/$
     */
    apiUrl: string;
    /**
     * @title Default RPC URL
     */
    defaultRpc: string;
    /**
     * @title Orderbook Contract Address
     * @pattern ^0x[0-9a-zA-Z]{40}$
     */
    orderBookAddress: string;
    /**
     * @title 0xOrderbookFlashBorrower Contract Address
     * @pattern ^0x[0-9a-zA-Z]{40}$
     */
    arbAddress: string;
    /**
     * @title 0x Proxy Address
     * @pattern ^0x[0-9a-zA-Z]{40}$
     */
    proxyAddress: string;
    /**
     * @title Native Token of this network
     */
    nativeToken: {
        /**
         * @title Token Symbol
         * @pattern [A-Z]+
         */
        symbol: string;
        /**
         * @title Token Address
         * @pattern ^0x[0-9a-zA-Z]{40}$
         */
        address: string;
        /**
         * @title Token Decimals
         */
        decimals: number
    }
}[]