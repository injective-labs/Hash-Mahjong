export const GAME_TO_ADDRESS = '0x6cd6592b7d2a9b1e59aa60a6138434d2fe4cd062';
export const PLAY_COST_ETH = '0.000001';

export const CHAIN = {
  chainId: 1776n,
  chainIdHex: '0x6f0',
  name: 'Injective EVM Mainnet',
  explorerTx: 'https://blockscout.injective.network/tx/',
  explorerHome: 'https://blockscout.injective.network/',
};

export function shortAddr(a: string): string {
  return a ? a.slice(0, 6) + '…' + a.slice(-4) : '—';
}

export function buildExplorerTxLink(txHash: string): string {
  return CHAIN.explorerTx + txHash;
}

export function escapeHtml(str: string): string {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function switchToInjective(): Promise<void> {
  const ethereum = window.ethereum;
  if (!ethereum) throw new Error('No wallet found');
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN.chainIdHex }],
    });
  } catch (err: unknown) {
    const switchErr = err as { code?: number };
    if (switchErr.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CHAIN.chainIdHex,
            chainName: CHAIN.name,
            nativeCurrency: { name: 'INJ', symbol: 'INJ', decimals: 18 },
            rpcUrls: ['https://sentry.evm-rpc.injective.network/'],
            blockExplorerUrls: [CHAIN.explorerHome],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}
