import axios from "axios";
// LIFI API CALLS
export const getChains = async () => {
  const result = await axios.get("https://li.quest/v1/chains");
  return result.data;
};

export const getConnections = async ({ fromChain, toChain }) => {
  const result = await axios.get("https://li.quest/v1/connections", {
    params: {
      fromChain,
      toChain,
    },
  });
  return result.data;
};

export const getQuote = async ({
  fromChain,
  toChain,
  fromToken,
  toToken,
  fromAmount,
  fromAddress,
}: {
  fromChain: number | string;
  toChain: number | string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: `0x${string}`;
}) => {
  const result = await axios.get("https://li.quest/v1/quote", {
    params: {
      fromChain,
      toChain,
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
    },
  });
  return result.data;
};

export const getStatus = async ({
  bridge,
  fromChain,
  toChain,
  txHash,
}: {
  bridge: string;
  fromChain: number;
  toChain: number;
  txHash: string;
}) => {
  const result = await axios.get("https://li.quest/v1/status", {
    params: {
      bridge,
      fromChain,
      toChain,
      txHash,
    },
  });
  return result.data;
};
