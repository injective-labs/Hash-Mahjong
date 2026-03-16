'use client';

import { getTotalExpForLevel, getLevelFromExp } from '@/lib/tasks';

interface HeaderProps {
  totalExp: number;
  onMenuClick: () => void;
}

export default function Header({ totalExp, onMenuClick }: HeaderProps) {
  const expLevel = getLevelFromExp(totalExp);
  const currentLevelTotalExp = getTotalExpForLevel(expLevel);
  const nextLevelTotalExp = getTotalExpForLevel(expLevel + 1);
  const expInCurrentLevel = totalExp - currentLevelTotalExp;
  const expNeededForNext = nextLevelTotalExp - totalExp;
  const expForThisLevel = nextLevelTotalExp - currentLevelTotalExp;
  const expPercent = expLevel >= 100 ? 100 : Math.min((expInCurrentLevel / expForThisLevel) * 100, 100);

  const tooltipText =
    expLevel >= 100
      ? `MAX LEVEL!\nTotal EXP: ${totalExp.toLocaleString()}`
      : `Current: ${expInCurrentLevel.toLocaleString()} / ${expForThisLevel.toLocaleString()} EXP\nNext Level: ${expNeededForNext.toLocaleString()} EXP needed`;

  return (
    <div className="header-bar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">🀄︎</span>
        <div className="brand-copy">
          <h1>
            <span className="word">Hash</span>
            <span className="word">Mahjong</span>
          </h1>
        </div>
      </div>
      <div className="exp-bar-container">
        <div className="exp-meta">
          <span className="exp-caption">Table Rank</span>
          <span className="exp-label">LV {expLevel}</span>
        </div>
        <div className="exp-actions">
          <div className="exp-bar-wrapper">
            <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
            <div className="exp-tooltip">{tooltipText}</div>
          </div>
          <button className="menu-btn" type="button" onClick={onMenuClick}>
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
