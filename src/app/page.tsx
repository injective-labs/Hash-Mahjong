'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, parseEther } from 'ethers';
import Header from '@/components/Header';
import Background from '@/components/Background';
import HashDisplay from '@/components/HashDisplay';
import Modal, { ModalType } from '@/components/Modal';
import { evaluate } from '@/lib/rules';
import { PlayRecord, Tasks } from '@/lib/types';
import {
  initTasks,
  getExpReward,
  getLevelFromExp,
  TASK_LIST,
} from '@/lib/tasks';
import {
  CHAIN,
  GAME_TO_ADDRESS,
  PLAY_COST_ETH,
  shortAddr,
  buildExplorerTxLink,
  escapeHtml,
  switchToInjective,
} from '@/lib/wallet';
import {
  openInjPassPopup,
  signTxViaInjPass,
  disconnectInjPass,
  isInjPassConnected,
} from '@/lib/injpass';

declare global {
  interface Window {
    ethereum?: {
      on?: (event: string, handler: () => void) => void;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

type WalletMode = 'metamask' | 'injpass' | null;

export default function Home() {
  // ── Wallet state ──────────────────────────────────────────────────────────
  const [address, setAddress] = useState<string | null>(null);
  const [onRightChain, setOnRightChain] = useState(false);
  const [netLabel, setNetLabel] = useState('—');
  const [netBlink, setNetBlink] = useState(false);
  const [netClickable, setNetClickable] = useState(false);
  const [walletMode, setWalletMode] = useState<WalletMode>(null);

  // INJ Pass connecting state
  const [injPassConnecting, setInjPassConnecting] = useState(false);
  const [injPassConnectError, setInjPassConnectError] = useState('');
  const [injPassErrorVisible, setInjPassErrorVisible] = useState(false);
  const injPassErrorHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const injPassErrorClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Game state ────────────────────────────────────────────────────────────
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txLink, setTxLink] = useState<string | null>(null);
  const [seed10, setSeed10] = useState<string | null>(null);
  const [currentRule, setCurrentRule] = useState<ReturnType<typeof evaluate>>(null);
  const [tilesVisible, setTilesVisible] = useState(false);
  const [resultMsg, setResultMsg] = useState('WAITING FOR GAME...');
  const [resultClass, setResultClass] = useState('result-text');
  const [statusMsg, setStatusMsg] = useState('STATUS: NOT CONNECTED');
  const [playing, setPlaying] = useState(false);
  const [playBtnText, setPlayBtnText] = useState('PLAY');

  // ── EXP / Tasks ───────────────────────────────────────────────────────────
  const [totalExp, setTotalExp] = useState(0);
  const [history, setHistory] = useState<PlayRecord[]>([]);
  const [tasks, setTasks] = useState<Tasks>(() => initTasks({}));

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [modalType, setModalType] = useState<ModalType>(null);

  // ── Load from localStorage ────────────────────────────────────────────────
  useEffect(() => {
    const savedExp = parseInt(localStorage.getItem('hashMahjongTotalExp') || '0');
    const savedHistory: PlayRecord[] = JSON.parse(localStorage.getItem('hashMahjongHistory') || '[]');
    const savedTasks: Partial<Tasks> = JSON.parse(localStorage.getItem('hashMahjongTasks') || '{}');
    setTotalExp(savedExp);
    setHistory(savedHistory);
    setTasks(initTasks(savedTasks));
  }, []);

  useEffect(() => {
    if (injPassErrorHideTimer.current) {
      clearTimeout(injPassErrorHideTimer.current);
      injPassErrorHideTimer.current = null;
    }
    if (injPassErrorClearTimer.current) {
      clearTimeout(injPassErrorClearTimer.current);
      injPassErrorClearTimer.current = null;
    }

    if (!injPassConnectError) {
      setInjPassErrorVisible(false);
      return;
    }

    setInjPassErrorVisible(true);

    injPassErrorHideTimer.current = setTimeout(() => {
      setInjPassErrorVisible(false);
    }, 3000);

    injPassErrorClearTimer.current = setTimeout(() => {
      setInjPassConnectError('');
    }, 3400);

    return () => {
      if (injPassErrorHideTimer.current) {
        clearTimeout(injPassErrorHideTimer.current);
        injPassErrorHideTimer.current = null;
      }
      if (injPassErrorClearTimer.current) {
        clearTimeout(injPassErrorClearTimer.current);
        injPassErrorClearTimer.current = null;
      }
    };
  }, [injPassConnectError]);

  // ── Network refresh (MetaMask) ────────────────────────────────────────────
  const refreshRef = useRef<() => void>(() => {});

  const refreshNetworkAndAccount = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setNetLabel('NO WALLET');
      setNetBlink(false);
      setNetClickable(false);
      setAddress(null);
      setStatusMsg('STATUS: NOT CONNECTED');
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();
      const right = net.chainId === CHAIN.chainId;
      setOnRightChain(right);

      if (right) {
        setNetLabel('INJECTIVE EVM');
        setNetBlink(true);
        setNetClickable(false);
      } else {
        setNetLabel('Click to Switch Network');
        setNetBlink(false);
        setNetClickable(true);
      }

      const accounts = await provider.send('eth_accounts', []) as string[];
      const addr = accounts?.[0] || null;
      setAddress(addr);

      if (!addr) setStatusMsg('STATUS: NOT CONNECTED');
      else if (!right) setStatusMsg(`STATUS: WRONG NETWORK - CLICK TO SWITCH TO ${CHAIN.name}`);
      else setStatusMsg('STATUS: READY');
    } catch {
      setStatusMsg('STATUS: NOT CONNECTED');
    }
  }, []);

  useEffect(() => {
    refreshRef.current = refreshNetworkAndAccount;
  }, [refreshNetworkAndAccount]);

  useEffect(() => {
    refreshNetworkAndAccount();
    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', () => refreshRef.current());
      window.ethereum.on('chainChanged',    () => refreshRef.current());
    }
  }, [refreshNetworkAndAccount]);

  // ── EXP helpers ───────────────────────────────────────────────────────────
  const addExp = useCallback((amount: number) => {
    setTotalExp((prev) => {
      const level = getLevelFromExp(prev);
      if (level >= 100) return prev;
      const next = prev + amount;
      localStorage.setItem('hashMahjongTotalExp', next.toString());
      return next;
    });
  }, []);

  // ── MetaMask connect / disconnect ─────────────────────────────────────────
  const connectMetaMask = async () => {
    if (!window.ethereum) { setStatusMsg('STATUS: NO WALLET FOUND'); return; }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []) as string[];
      setAddress(accounts?.[0] || null);
      setWalletMode('metamask');
      await refreshNetworkAndAccount();
    } catch (e) {
      setStatusMsg(`STATUS: CONNECT FAILED - ${escapeHtml((e as Error)?.message || String(e))}`);
    }
  };

  const disconnect = () => {
    if (walletMode === 'injpass') disconnectInjPass();
    setAddress(null);
    setWalletMode(null);
    setNetLabel('—');
    setNetBlink(false);
    setOnRightChain(false);
    setPlayBtnText('PLAY');
    setStatusMsg('STATUS: DISCONNECTED');
  };

  // ── INJ Pass connect (popup) ──────────────────────────────────────────────
  const connectInjPass = async () => {
    setInjPassConnectError('');
    setInjPassConnecting(true);
    setStatusMsg('STATUS: OPENING INJ PASS…');
    try {
      const addr = await openInjPassPopup();
      setAddress(addr);
      setWalletMode('injpass');
      setOnRightChain(true);
      setNetLabel('λ INJ PASS');
      setNetBlink(true);
      setNetClickable(false);
      setStatusMsg('STATUS: READY (INJ PASS)');
    } catch (e) {
      const msg = (e as Error)?.message || String(e);
      setInjPassConnectError(msg);
      setStatusMsg(`STATUS: ${msg}`);
    } finally {
      setInjPassConnecting(false);
    }
  };

  // ── Switch network (MetaMask only) ────────────────────────────────────────
  const handleSwitchNetwork = async () => {
    if (walletMode === 'injpass') return;
    try {
      await switchToInjective();
      await refreshNetworkAndAccount();
    } catch (e) {
      setStatusMsg(`STATUS: SWITCH FAILED - ${escapeHtml((e as Error)?.message || String(e))}`);
    }
  };

  // ── Play ──────────────────────────────────────────────────────────────────
  const play = async () => {
    setPlaying(true);
    setTilesVisible(false);
    setTxHash(null);
    setTxLink(null);
    setSeed10(null);
    setCurrentRule(null);
    setResultMsg('LOADING...');
    setResultClass('result-text');

    try {
      let txHashStr: string;
      let chainId: bigint;

      if (walletMode === 'injpass') {
        // ── INJ Pass path (popup signs the tx) ──────────────────────────────
        if (!isInjPassConnected()) {
          setStatusMsg('STATUS: INJ PASS DISCONNECTED - RECONNECT');
          return;
        }
        setStatusMsg('STATUS: WAITING FOR INJ PASS CONFIRMATION…');
        txHashStr = await signTxViaInjPass(GAME_TO_ADDRESS, PLAY_COST_ETH);
        chainId = CHAIN.chainId;
      } else {
        // ── MetaMask path ────────────────────────────────────────────────────
        if (!window.ethereum) return;
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const net = await provider.getNetwork();
        if (net.chainId !== CHAIN.chainId) {
          setStatusMsg(`STATUS: WRONG NETWORK - CLICK TO SWITCH TO ${CHAIN.name}`);
          setPlayBtnText('PLAY');
          return;
        }
        chainId = net.chainId;
        setStatusMsg('STATUS: SENDING TX...');
        const tx = await signer.sendTransaction({
          to: GAME_TO_ADDRESS,
          value: parseEther(PLAY_COST_ETH),
        });
        txHashStr = tx.hash;
        setTxHash(txHashStr);
        setTxLink(buildExplorerTxLink(txHashStr));
        setStatusMsg('STATUS: PENDING...');
        await tx.wait();
      }

      setTxHash(txHashStr);
      setTxLink(buildExplorerTxLink(txHashStr));
      setStatusMsg('STATUS: CONFIRMED');

      const s10 = txHashStr.replace(/^0x/i, '').slice(-10).toLowerCase();
      setSeed10(s10);
      const rule = evaluate(s10);
      setCurrentRule(rule);
      setTilesVisible(true);

      if (rule) {
        setResultMsg(`WIN! ${rule.name} (${rule.payout})`);
        setResultClass('result-text result-win');
      } else {
        setResultMsg('NO WIN - TRY AGAIN');
        setResultClass('result-text result-lose');
      }

      const record: PlayRecord = {
        chainId: chainId.toString(),
        to: GAME_TO_ADDRESS,
        valueEth: PLAY_COST_ETH,
        txHash: txHashStr,
        blockNumber: '',
        seed10: s10,
        rule: rule ? { id: rule.id, name: rule.name, payout: rule.payout } : null,
        timestamp: new Date().toISOString(),
      };

      setHistory((prev) => {
        const next = [...prev, record].slice(-50);
        localStorage.setItem('hashMahjongHistory', JSON.stringify(next));
        return next;
      });

      const expGain = getExpReward(rule?.id ?? null);
      addExp(expGain);

      setTasks((prev) => {
        const updated: Tasks = {
          daily:  { ...prev.daily,  progress: { ...prev.daily.progress  } },
          weekly: { ...prev.weekly, progress: { ...prev.weekly.progress } },
        };
        updated.daily.progress.playCount++;
        updated.weekly.progress.playCount++;
        if (rule) { updated.daily.progress.winCount++; updated.weekly.progress.winCount++; }
        updated.daily.progress.totalExp  += expGain;
        updated.weekly.progress.totalExp += expGain;

        let bonusExp = 0;
        for (const task of TASK_LIST) {
          const period = updated[task.type];
          if (period.completed[task.id]) continue;
          let current = 0;
          switch (task.id) {
            case 'daily_play_1':
            case 'daily_play_5':   current = updated.daily.progress.playCount;  break;
            case 'daily_win_1':    current = updated.daily.progress.winCount;   break;
            case 'daily_exp_100':  current = updated.daily.progress.totalExp;   break;
            case 'weekly_play_20': current = updated.weekly.progress.playCount; break;
            case 'weekly_win_5':   current = updated.weekly.progress.winCount;  break;
            case 'weekly_exp_500': current = updated.weekly.progress.totalExp;  break;
          }
          if (current >= task.target) {
            updated[task.type] = {
              ...updated[task.type],
              completed: { ...updated[task.type].completed, [task.id]: true },
            };
            bonusExp += task.reward;
          }
        }

        localStorage.setItem('hashMahjongTasks', JSON.stringify(updated));
        if (bonusExp > 0) setTimeout(() => addExp(bonusExp), 0);
        return updated;
      });

      setPlayBtnText('PLAY AGAIN');
      setStatusMsg('STATUS: DONE');
    } catch (e) {
      setStatusMsg(`STATUS: PLAY FAILED - ${escapeHtml((e as Error)?.message || String(e))}`);
      setPlayBtnText((prev) => (prev !== 'PLAY AGAIN' ? 'PLAY' : prev));
    } finally {
      setPlaying(false);
      if (walletMode === 'metamask') await refreshNetworkAndAccount();
    }
  };

  const playDisabled = playing || !address || !onRightChain;
  const networkHint = !address
    ? 'Connect a wallet first'
    : netClickable
      ? 'Tap to switch to Injective EVM'
      : 'Ready on Injective EVM';
  const walletHint = walletMode === 'injpass'
    ? 'Connected with INJ Pass'
    : walletMode === 'metamask'
      ? 'Connected with MetaMask'
      : 'Choose your wallet';

  return (
    <>
      <Background />
      <div className="wrap">
        <Header totalExp={totalExp} onMenuClick={() => setModalType('menu')} />

        <div className="main-card">
          <span className="sr-only" aria-live="polite">{statusMsg}</span>
          {injPassConnectError && (
            <div
              className={`injpass-connect-error${injPassErrorVisible ? ' is-visible' : ''}`}
              role="status"
              aria-live="polite"
            >
              {injPassConnectError}
            </div>
          )}

          <div className="connect-info">
            <button
              className={`info-badge info-button network-badge${netClickable ? ' is-clickable' : ''}`}
              type="button"
              disabled={!netClickable}
              onClick={handleSwitchNetwork}
            >
              <span className="info-caption">Network</span>
              <span className={`mono info-primary${netBlink ? ' net-name-blink' : ''}`}>
                {netLabel}
              </span>
              <span className="info-meta">{networkHint}</span>
            </button>
            <div className="info-badge wallet-badge">
              <span className="info-caption">Wallet</span>
              <span className="mono info-primary">{address ? shortAddr(address) : 'Not Connected'}</span>
              <span className="info-meta">{walletHint}</span>
              <div className="wallet-actions">
                {walletMode !== 'injpass' && (
                  <button className="inline-btn" type="button" onClick={address ? disconnect : connectMetaMask}>
                    {address && walletMode === 'metamask' ? 'Disconnect' : 'MetaMask'}
                  </button>
                )}
                {walletMode !== 'metamask' && (
                  <button
                    className={`inline-btn injpass-inline-btn${walletMode === 'injpass' ? ' is-active' : ''}`}
                    type="button"
                    onClick={walletMode === 'injpass' ? disconnect : connectInjPass}
                    disabled={injPassConnecting}
                  >
                    {injPassConnecting
                      ? 'Opening...'
                      : walletMode === 'injpass'
                        ? 'Disconnect'
                        : 'INJ Pass'}
                  </button>
                )}
              </div>
            </div>
            <button
              className="info-badge info-action compact-badge rules-btn"
              type="button"
              onClick={() => setModalType('rules')}
            >
              <span className="info-caption">Reference</span>
              <span className="info-action-label">Rulebook</span>
            </button>
            <button
              className="info-badge info-action compact-badge tasks-btn"
              type="button"
              onClick={() => setModalType('tasks')}
            >
              <span className="info-caption">Progress</span>
              <span className="info-action-label">Quest Log</span>
            </button>
          </div>

          <HashDisplay
            txHash={txHash}
            txLink={txLink}
            seed10={seed10}
            rule={currentRule}
            tilesVisible={tilesVisible}
          />

          <div className="play-btn-container">
            <button className="btn" type="button" disabled={playDisabled} onClick={play}>
              {playing ? 'Playing...' : playBtnText}
            </button>
          </div>

          <div className="result-display">
            <span className="section-label">Latest Result</span>
            <div className={resultClass} aria-live="polite">{resultMsg}</div>
          </div>
        </div>
      </div>

      <Modal
        type={modalType}
        history={history}
        tasks={tasks}
        onClose={() => setModalType(null)}
        onOpen={(t) => setModalType(t)}
      />
    </>
  );
}
