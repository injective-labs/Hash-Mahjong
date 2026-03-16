'use client';

import { useEffect, type ReactNode } from 'react';
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
    <div className="modal-stack">
      {RULES.map((rule) => {
        const exampleSeed = generateExampleForRule(rule.id);
        const matches = getMatchingPositions(rule, exampleSeed);

        return (
          <article key={rule.id} className="rule-card">
            <div className="rule-card-header">
              <div className="rule-card-copy">
                <span className="rule-card-index">Rule #{rule.id}</span>
                <h3 className="rule-card-title">{rule.name}</h3>
                <p className="rule-card-desc">{rule.desc}</p>
              </div>
              <span className="rule-card-payout">{rule.payout}</span>
            </div>

            <div className="rule-card-example">
              <span className="rule-card-label">Example Hand</span>
              <div className="rule-card-seed">
                {exampleSeed.split('').map((char, index) => (
                  <span key={index} className={`modal-char${matches[index] ? ' match' : ''}`}>
                    {char.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function HistoryContent({ history }: { history: PlayRecord[] }) {
  if (history.length === 0) {
    return <p className="empty-state">No records yet. Your played hands will appear here.</p>;
  }

  return (
    <div className="modal-stack">
      {history.slice().reverse().map((item, index) => {
        const date = new Date(item.timestamp);

        return (
          <article key={`${item.txHash}-${item.timestamp}`} className="history-item">
            <div className="history-item-header">
              <span className="history-index">#{history.length - index}</span>
              <span className="history-time">{date.toLocaleString()}</span>
            </div>

            <div className="history-hash">{item.txHash}</div>

            <div className="history-meta">
              <span>Seed 10: {item.seed10.toUpperCase()}</span>
              {item.rule ? (
                <span className="history-win">
                  Win: {item.rule.name} ({item.rule.payout})
                </span>
              ) : (
                <span className="history-loss">No Win</span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TasksContent({ tasks }: { tasks: Tasks }) {
  const dailyTasks = TASK_LIST.filter((task) => task.type === 'daily');
  const weeklyTasks = TASK_LIST.filter((task) => task.type === 'weekly');

  const renderTask = (task: typeof TASK_LIST[0], completed: boolean, current: number) => {
    const progressPercent = Math.min((current / task.target) * 100, 100);

    return (
      <article key={task.id} className="task-card">
        <div className="task-card-header">
          <b className="task-card-title">{task.name}</b>
          {completed ? (
            <span className="task-card-state is-complete">Completed</span>
          ) : (
            <span className="task-card-state">+{task.reward} EXP</span>
          )}
        </div>

        <div className="task-card-desc">{task.desc}</div>

        <div className="task-progress">
          <div
            className={`task-progress-fill${completed ? ' is-complete' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
          <div className="task-progress-label">{current}/{task.target}</div>
        </div>
      </article>
    );
  };

  return (
    <div className="task-groups">
      <div className="task-group">
        <h3 className="task-group-title">Daily Tasks</h3>
        {dailyTasks.map((task) => {
          const current = getTaskCurrent(task.id, tasks);
          const completed = tasks.daily.completed[task.id] || false;
          return renderTask(task, completed, current);
        })}
      </div>

      <div className="task-group">
        <h3 className="task-group-title">Weekly Tasks</h3>
        {weeklyTasks.map((task) => {
          const current = getTaskCurrent(task.id, tasks);
          const completed = tasks.weekly.completed[task.id] || false;
          return renderTask(task, completed, current);
        })}
      </div>
    </div>
  );
}

function AboutContent() {
  return (
    <div className="about-content">
      <p>
        <b>Hash Mahjong</b> turns the last 10 hex characters of your transaction hash into
        a mahjong hand on Injective EVM.
      </p>

      <div className="about-block">
        <h3>How To Play</h3>
        <ol className="about-list">
          <li>Send 0.000001 INJ to the game address.</li>
          <li>Take the last 10 hex characters from the transaction hash.</li>
          <li>Map each character into a mahjong tile.</li>
          <li>Check the result against the 18 winning rules.</li>
        </ol>
      </div>

      <p className="about-note">
        Always verify the wallet address and Injective network before sending a
        transaction. Gas fees can vary.
      </p>
    </div>
  );
}

const MODAL_TITLES: Record<NonNullable<ModalType>, string> = {
  menu: 'Menu',
  rules: 'Rulebook',
  history: 'History',
  tasks: 'Quest Log',
  about: 'About',
};

export default function Modal({ type, history, tasks, onClose, onOpen }: ModalProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!type) return null;

  let content: ReactNode = null;

  switch (type) {
    case 'menu':
      content = (
        <div className="modal-menu">
          <button className="btn modal-menu-btn" type="button" onClick={() => onOpen('rules')}>
            Rulebook
          </button>
          <button className="btn modal-menu-btn" type="button" onClick={() => onOpen('tasks')}>
            Quest Log
          </button>
          <button className="btn modal-menu-btn" type="button" onClick={() => onOpen('history')}>
            History
          </button>
          <button className="btn modal-menu-btn" type="button" onClick={() => onOpen('about')}>
            About
          </button>
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
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div>
            <span className="modal-kicker">Hash Mahjong</span>
            <h2 id="modal-title">{MODAL_TITLES[type]}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-content">{content}</div>
      </div>
    </div>
  );
}
