import { SIWEConfig } from "connectkit/build/components/Standard/SIWE/SIWEContext";
import { SIWEProvider } from "connectkit";
import { SiweMessage } from "siwe";
import { useAccount } from "wagmi";

const baseUrl = 'http://localhost:5000/'

export default function Provider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();

  // SIWE CONFIG ===================================================
  const siweConfig: SIWEConfig = {
    getNonce: async () =>
      fetch(`${baseUrl}auth/nonce/${address}`).then((res) =>
        res.json().then(res => res?.result?.nonce)
      ),
    createMessage: ({ nonce, address, chainId }) =>
      new SiweMessage({
        version: "1",
        domain: window.location.host,
        uri: window.location.origin,
        address,
        chainId,
        nonce,
        statement: "Sign in With UniPOS Web3.",
      }).prepareMessage(),
    verifyMessage: async ({ message, signature }) =>
      fetch(`${baseUrl}auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      }).then((res) => res.ok),
    getSession: async () =>
      fetch(`${baseUrl}auth/session`).then((res) => (res.ok ? res.json() : null)),
    signOut: async () => fetch(`${baseUrl}siwe/logout`).then((res) => res.ok),
  };
  // SIWE CONFIG ===================================================

  return <SIWEProvider {...siweConfig}>{children}</SIWEProvider>;
}
