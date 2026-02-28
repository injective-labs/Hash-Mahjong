/**
 * INJ Pass wallet connector.
 *
 * Creates a local ethers Wallet from a raw private key and connects it to the
 * Injective EVM Mainnet RPC, so the game can sign transactions without a
 * browser extension.
 */

import { Wallet, JsonRpcProvider } from 'ethers';

const RPC_URL = 'https://sentry.evm-rpc.injective.network/';

/** Validate a raw hex private key string and return a normalised 0x-prefixed version. */
export function normalisePrivateKey(raw: string): string {
  const stripped = raw.trim().replace(/^0x/i, '');
  if (!/^[0-9a-fA-F]{64}$/.test(stripped)) {
    throw new Error('Invalid private key — must be 64 hex characters.');
  }
  return `0x${stripped}`;
}

/** Create an ethers Wallet connected to Injective EVM Mainnet. */
export function createInjPassWallet(privateKey: string): Wallet {
  const provider = new JsonRpcProvider(RPC_URL);
  return new Wallet(normalisePrivateKey(privateKey), provider);
}
