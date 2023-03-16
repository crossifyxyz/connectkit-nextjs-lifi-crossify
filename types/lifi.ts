export type LifiToken = {
  address: `0x${string}`;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  priceUSD?: string;
  coinKey?: string;
  logoURI?: string;
  isCustom?: boolean;
  isFOT?: boolean;
  tags?: string[];
};

export type LifiQuote = {
  id: string;
  type: string;
  action: {
    fromChainId: number;
    fromAmount: string;
    fromToken: LifiToken;
    toChainId: number;
    toToken: LifiToken;
    slippage: number;
    toAddress: `0x${string}`;
    fromAddress: `0x${string}`;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    approvalAddress: `0x${string}`;
    executionDuration: number;
    feeCosts: {
      name: string;
      description: string;
      amount: string;
      percentage: string;
      token: LifiToken;
      amountUSD: string;
    }[];
    gasCosts: {
      type: string;
      price: string;
      estimate: string;
      limit: string;
      amount: string;
      amountUSD: string;
      token: LifiToken;
    }[];
    data: {
      fromToken: LifiToken;
      toToken: LifiToken;
      toTokenAmount: string;
      fromTokenAmount: string;
      protocols: {
        name: string;
        part: number;
        fromTokenAddress: `0x${string}`;
        toTokenAddress: `0x${string}`;
      }[][][];
      estimatedGas: number;
    };
    fromAmountUSD: string;
    toAmountUSD: string;
  };
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
  includedSteps: LifiQuote[];
  integrator: string;
  transactionRequest: {
    data: `0x${string}`;
    to: `0x${string}`;
    value: `0x${string}`;
    from: `0x${string}`;
    chainId: 137;
    gasPrice: `0x${string}`;
    gasLimit: `0x${string}`;
  };
} | null;

export type LifiStatusSide = {
  chainId: number;
  txHash: `0x${string}`;
  txLink: string;
  amount: string;
  token: LifiToken;
  gasPrice: string;
  gasUsed: string;
};

export type LifiStatus = {
  sending: LifiStatusSide;
  receiving: LifiStatusSide;
  tool: string;
  status: string;
  substatus: string;
};
