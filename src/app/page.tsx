'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { BrowserProvider, parseEther } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      on?: (event: string, handler: () => void) => void;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export default function Home() {
  // ── Wallet state ──────────────────────────────────────────────────────────
  const [address, setAddress] = useState<string | null>(null);
  const [onRightChain, setOnRightChain] = useState(false);
  const [netLabel, setNetLabel] = useState('—');
  const [netBlink, setNetBlink] = useState(false);
  const [netClickable, setNetClickable] = useState(false);

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

  // ── Network refresh ───────────────────────────────────────────────────────
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
      window.ethereum.on('chainChanged', () => refreshRef.current());
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

  // ── Connect / Disconnect ──────────────────────────────────────────────────
  const connect = async () => {
    if (!window.ethereum) { setStatusMsg('STATUS: NO WALLET FOUND'); return; }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []) as string[];
      setAddress(accounts?.[0] || null);
      await refreshNetworkAndAccount();
    } catch (e) {
      setStatusMsg(`STATUS: CONNECT FAILED - ${escapeHtml((e as Error)?.message || String(e))}`);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setNetLabel('NO WALLET');
    setNetBlink(false);
    setPlayBtnText('PLAY');
    setStatusMsg('STATUS: DISCONNECTED');
  };

  // ── Switch Network ────────────────────────────────────────────────────────
  const handleSwitchNetwork = async () => {
    try {
      await switchToInjective();
      await refreshNetworkAndAccount();
    } catch (e) {
      setStatusMsg(`STATUS: SWITCH FAILED - ${escapeHtml((e as Error)?.message || String(e))}`);
    }
  };

  // ── Play ──────────────────────────────────────────────────────────────────
  const play = async () => {
    if (!window.ethereum) return;
    setPlaying(true);
    setTilesVisible(false);
    setTxHash(null);
    setTxLink(null);
    setSeed10(null);
    setCurrentRule(null);
    setResultMsg('LOADING...');
    setResultClass('result-text');

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const net = await provider.getNetwork();

      if (net.chainId !== CHAIN.chainId) {
        setStatusMsg(`STATUS: WRONG NETWORK - CLICK TO SWITCH TO ${CHAIN.name}`);
        setPlayBtnText('PLAY');
        return;
      }

      setStatusMsg('STATUS: SENDING TX...');
      const tx = await signer.sendTransaction({
        to: GAME_TO_ADDRESS,
        value: parseEther(PLAY_COST_ETH),
      });

      const link = buildExplorerTxLink(tx.hash);
      setTxHash(tx.hash);
      setTxLink(link);
      setStatusMsg('STATUS: PENDING...');

      await tx.wait();

      const s10 = tx.hash.replace(/^0x/i, '').slice(-10).toLowerCase();
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
        chainId: net.chainId.toString(),
        to: GAME_TO_ADDRESS,
        valueEth: PLAY_COST_ETH,
        txHash: tx.hash,
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

      // Update tasks
      setTasks((prev) => {
        const updated: Tasks = {
          daily: { ...prev.daily, progress: { ...prev.daily.progress } },
          weekly: { ...prev.weekly, progress: { ...prev.weekly.progress } },
        };
        updated.daily.progress.playCount++;
        updated.weekly.progress.playCount++;
        if (rule) { updated.daily.progress.winCount++; updated.weekly.progress.winCount++; }
        updated.daily.progress.totalExp += expGain;
        updated.weekly.progress.totalExp += expGain;

        let bonusExp = 0;
        for (const task of TASK_LIST) {
          const period = updated[task.type];
          if (period.completed[task.id]) continue;
          let current = 0;
          switch (task.id) {
            case 'daily_play_1':
            case 'daily_play_5':   current = updated.daily.progress.playCount; break;
            case 'daily_win_1':    current = updated.daily.progress.winCount; break;
            case 'daily_exp_100':  current = updated.daily.progress.totalExp; break;
            case 'weekly_play_20': current = updated.weekly.progress.playCount; break;
            case 'weekly_win_5':   current = updated.weekly.progress.winCount; break;
            case 'weekly_exp_500': current = updated.weekly.progress.totalExp; break;
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
      await refreshNetworkAndAccount();
    }
  };

  const playDisabled = playing || !address || !onRightChain;

  return (
    <>
      <Background />
      <div className="wrap">
        <Header totalExp={totalExp} onMenuClick={() => setModalType('menu')} />

        <div className="main-card">
          {/* Status top-left */}
          <div className="status-top-left">
            <div className="status-text">{statusMsg}</div>
          </div>

          {/* Connect buttons top-right */}
          <div className="connect-btn-top">
            <button
              className="btn"
              disabled={onRightChain}
              onClick={handleSwitchNetwork}
            >
              SWITCH NET
            </button>
            <button className="btn" onClick={address ? disconnect : connect}>
              {address ? 'DISCONNECT' : 'CONNECT'}
            </button>
          </div>

          {/* Connection Info */}
          <div className="connect-info" style={{ marginTop: '57px' }}>
            <div className="info-badge">
              <span
                className={`mono${netBlink ? ' net-name-blink' : ''}`}
                style={{ cursor: netClickable ? 'pointer' : 'default', textDecoration: netClickable ? 'underline' : 'none' }}
                onClick={netClickable ? handleSwitchNetwork : undefined}
              >
                {netLabel}
              </span>
            </div>
            <div className="info-badge">
              <span className="mono">{address ? shortAddr(address) : '—'}</span>
            </div>
            <div className="button-group">
              <div className="info-badge btn rules-btn" onClick={() => setModalType('rules')}>
                RULES
              </div>
              <div className="info-badge btn tasks-btn" onClick={() => setModalType('tasks')}>
                TASKS
              </div>
            </div>
          </div>

          {/* Hash / Tiles Display */}
          <HashDisplay
            txHash={txHash}
            txLink={txLink}
            seed10={seed10}
            rule={currentRule}
            tilesVisible={tilesVisible}
          />

          {/* Play Button */}
          <div className="play-btn-container">
            <button className="btn" disabled={playDisabled} onClick={play}>
              {playing ? 'PLAYING...' : playBtnText}
            </button>
          </div>

          {/* Result */}
          <div className="result-display">
            <div className={resultClass}>{resultMsg}</div>
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
