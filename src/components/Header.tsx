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
      <h1>
        <span className="word">HASH</span>
        <span className="word">MAHJONG</span>
      </h1>
      <div className="exp-bar-container">
        <div className="exp-bar-wrapper">
          <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
          <div className="exp-tooltip">{tooltipText}</div>
        </div>
        <span className="exp-label">LV{expLevel}</span>
        <button className="menu-btn" onClick={onMenuClick}>MENU</button>
      </div>
    </div>
  );
}
