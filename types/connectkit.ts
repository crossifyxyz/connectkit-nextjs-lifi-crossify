import "connectkit";

declare module "connectkit" {
  export type SIWESession = {
    address?: string;
    chainId?: number;
    uid?: string;
    role?: number;
  };
}

