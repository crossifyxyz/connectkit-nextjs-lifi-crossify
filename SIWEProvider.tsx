import { SIWEConfig } from "connectkit/build/components/Standard/SIWE/SIWEContext";
import { SIWEProvider } from "connectkit";
import { SiweMessage } from "siwe";
import { getNonce, getSession, postVerify, signOut } from "./fetch";

const baseUrl = "http://localhost:5000/";

export default function Provider({ children }: { children: React.ReactNode }) {
  // SIWE CONFIG ===================================================
  const siweConfig: SIWEConfig = {
    getNonce: async () => getNonce(baseUrl).then((res) => res.data.nonce),
    createMessage: ({ nonce, address, chainId }) =>
      new SiweMessage({
        version: "1",
        domain: window.location.host,
        uri: window.location.origin,
        address,
        chainId,
        nonce,
        statement: "Sign in With UniPOS Web3",
      }).prepareMessage(),
    verifyMessage: async ({ message, signature }) => {
      console.log(message, signature);
      return postVerify({ baseUrl, message, signature }).then(
        (res) => res.data.ok
      );
    },
    getSession: async () =>
      getSession(baseUrl).then((res) => res.data.result ?? null),
    signOut: async () => signOut(baseUrl).then((res) => res.data.ok),
  };
  // SIWE CONFIG ===================================================

  return <SIWEProvider {...siweConfig}>{children}</SIWEProvider>;
}
