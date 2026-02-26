'use client';

import { useEffect } from 'react';
import { RULES, generateExampleForRule, getMatchingPositions } from '@/lib/rules';
import { TASK_LIST, getTaskCurrent } from '@/lib/tasks';
import { PlayRecord, Tasks } from '@/lib/types';

export type ModalType = 'menu' | 'rules' | 'history' | 'tasks' | 'about' | null;

interface ModalProps {
  type: ModalType;
  history: PlayRecord[];
  tasks: Tasks;
  onClose: () => void;
  onOpen: (type: ModalType) => void;
}

function RulesContent() {
  return (
    <>
      {RULES.map((r) => {
        const exampleSeed = generateExampleForRule(r.id);
        const matches = getMatchingPositions(r, exampleSeed);
        return (
          <div key={r.id} style={{ margin: '15px 0', padding: '16px', background: 'var(--cloud)', border: '3px solid var(--border)', borderRadius: 0, boxShadow: '0 4px 0 var(--mario-brown-dark), 0 4px 0 var(--border), 4px 4px 0 var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <b style={{ color: 'var(--mario-red)', textShadow: '1px 1px 0 var(--border)' }}>
                  #{r.id} {r.name}
                </b>{' '}
                <span style={{ color: 'var(--mario-blue)' }}>({r.payout})</span>
                <br />
                <span style={{ color: 'var(--text)', fontSize: '8px' }}>{r.desc}</span>
              </div>
              <span style={{ color: 'var(--mario-green)', fontSize: '16px', marginLeft: '10px', textShadow: '1px 1px 0 var(--border)' }}>✓</span>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Example:</span>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {exampleSeed.split('').map((ch, i) => {
                  const isMatch = matches[i];
                  return isMatch ? (
                    <span key={i} className="hash-char seed" style={{ display: 'inline-block', width: '22px', height: '29px', lineHeight: '29px', textAlign: 'center', border: '2px solid var(--border)', background: 'linear-gradient(180deg, var(--mario-green) 0%, #2d9f4a 100%)', color: '#fff', fontSize: '16.5px', margin: '0 2px' }}>
                      {ch.toUpperCase()}
                    </span>
                  ) : (
                    <span key={i} className="hash-char prefix" style={{ display: 'inline-block', width: '22px', height: '29px', lineHeight: '29px', textAlign: 'center', border: '2px solid var(--border)', background: 'linear-gradient(180deg, #d0d0d0 0%, #a0a0a0 100%)', color: '#505050', fontSize: '16.5px', margin: '0 2px' }}>
                      {ch.toUpperCase()}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function HistoryContent({ history }: { history: PlayRecord[] }) {
  if (history.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text)' }}>NO RECORDS YET</p>;
  }
  return (
    <>
      {history.slice().reverse().map((item, idx) => {
        const date = new Date(item.timestamp);
        return (
          <div key={idx} className="history-item">
            <div className="history-item-header">
              <span>#{history.length - idx}</span>
              <span>{date.toLocaleString()}</span>
            </div>
            <div className="history-hash">{item.txHash}</div>
            <div style={{ marginTop: '8px', color: 'var(--text)' }}>
              SEED10: {item.seed10.toUpperCase()}
              {item.rule ? (
                <><br /><span style={{ color: 'var(--mario-green)', textShadow: '1px 1px 0 var(--border)' }}>WIN: {item.rule.name} ({item.rule.payout})</span></>
              ) : (
                <><br /><span style={{ color: 'var(--mario-red)', textShadow: '1px 1px 0 var(--border)' }}>NO WIN</span></>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function TasksContent({ tasks }: { tasks: Tasks }) {
  const dailyTasks = TASK_LIST.filter((t) => t.type === 'daily');
  const weeklyTasks = TASK_LIST.filter((t) => t.type === 'weekly');

  const renderTask = (task: typeof TASK_LIST[0], completed: boolean, current: number) => {
    const progressPercent = Math.min((current / task.target) * 100, 100);
    return (
      <div key={task.id} style={{ margin: '10px 0', padding: '12px', background: 'var(--cloud)', border: '3px solid var(--border)', borderRadius: 0, boxShadow: '0 4px 0 var(--mario-brown-dark), 0 4px 0 var(--border), 4px 4px 0 var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <b style={{ color: 'var(--mario-red)', textShadow: '1px 1px 0 var(--border)' }}>{task.name}</b>
          {completed
            ? <span style={{ color: 'var(--mario-green)' }}>✓ COMPLETED</span>
            : <span style={{ color: 'var(--mario-blue)' }}>+{task.reward} EXP</span>
          }
        </div>
        <div style={{ color: 'var(--text)', fontSize: '7px', marginBottom: '6px' }}>{task.desc}</div>
        <div style={{ background: 'var(--mario-brown)', height: '8px', border: '2px solid var(--border)', position: 'relative' }}>
          <div style={{ background: completed ? 'var(--mario-green)' : 'var(--mario-blue)', height: '100%', width: `${progressPercent}%`, transition: 'width 0.3s' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--cloud)', fontSize: '6px', textShadow: '1px 1px 0 var(--border)' }}>
            {current}/{task.target}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--mario-blue)', textShadow: '1px 1px 0 var(--border)', marginBottom: '10px' }}>DAILY TASKS</h3>
        {dailyTasks.map((task) => {
          const current = getTaskCurrent(task.id, tasks);
          const completed = tasks.daily.completed[task.id] || false;
          return renderTask(task, completed, current);
        })}
      </div>
      <div>
        <h3 style={{ color: 'var(--mario-green)', textShadow: '1px 1px 0 var(--border)', marginBottom: '10px' }}>WEEKLY TASKS</h3>
        {weeklyTasks.map((task) => {
          const current = getTaskCurrent(task.id, tasks);
          const completed = tasks.weekly.completed[task.id] || false;
          return renderTask(task, completed, current);
        })}
      </div>
    </>
  );
}

function AboutContent() {
  return (
    <div style={{ lineHeight: 2 }}>
      <p><b style={{ color: 'var(--mario-red)', textShadow: '2px 2px 0 var(--border)' }}>HASH MAHJONG</b> IS A BLOCKCHAIN-BASED MAHJONG GAME.</p>
      <p style={{ marginTop: '15px' }}><b>HOW TO PLAY:</b></p>
      <ol style={{ marginLeft: '20px', marginTop: '10px', lineHeight: 2 }}>
        <li>SEND 0.000001 INJ TO GAME ADDRESS</li>
        <li>USE LAST 10 HEX OF TX HASH</li>
        <li>EACH HEX MAPS TO A MAHJONG TILE</li>
        <li>CHECK 18 WINNING RULES</li>
      </ol>
      <p style={{ marginTop: '15px', color: 'var(--text-muted)', fontSize: '8px' }}>
        ⚠️ ALWAYS VERIFY ADDRESS &amp; NETWORK<br />
        GAS FEES MAY VARY
      </p>
    </div>
  );
}

const MODAL_TITLES: Record<NonNullable<ModalType>, string> = {
  menu: 'MENU',
  rules: 'GAME RULES (18)',
  history: 'HISTORY',
  tasks: 'TASKS',
  about: 'ABOUT',
};

export default function Modal({ type, history, tasks, onClose, onOpen }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!type) return null;

  const title = MODAL_TITLES[type];

  let content;
  switch (type) {
    case 'menu':
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn" onClick={() => onOpen('history')} style={{ width: '100%' }}>HISTORY</button>
          <button className="btn" onClick={() => onOpen('about')} style={{ width: '100%' }}>ABOUT</button>
        </div>
      );
      break;
    case 'rules':
      content = <RulesContent />;
      break;
    case 'history':
      content = <HistoryContent history={history} />;
      break;
    case 'tasks':
      content = <TasksContent tasks={tasks} />;
      break;
    case 'about':
      content = <AboutContent />;
      break;
  }

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">{content}</div>
      </div>
    </div>
  );
}
