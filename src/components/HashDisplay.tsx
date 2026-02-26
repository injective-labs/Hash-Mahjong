'use client';

import { Rule } from '@/lib/types';
import { TILE_MAP, getMatchingPositions } from '@/lib/rules';

interface HashDisplayProps {
  txHash: string | null;
  txLink: string | null;
  seed10: string | null;
  rule: Rule | null;
  tilesVisible: boolean;
}

function TileCard({ char, isMatch }: { char: string; isMatch: boolean }) {
  const info = TILE_MAP[char] || { emoji: '🀫', name: 'Unknown' };
  return (
    <div className={`tile${isMatch ? ' match' : ''}`}>
      <div className="tile-emoji" title={info.name}>{info.emoji}</div>
      <div className="tile-code">{char.toUpperCase()}</div>
    </div>
  );
}

function EmptyTile() {
  return (
    <div className="tile">
      <div className="tile-code">&nbsp;</div>
    </div>
  );
}

export default function HashDisplay({ txHash, txLink, seed10, rule, tilesVisible }: HashDisplayProps) {
  const seed = seed10 ?? (txHash ? txHash.replace(/^0x/i, '').slice(-10).toLowerCase() : null);
  const matches = seed && rule ? getMatchingPositions(rule, seed) : new Array(10).fill(false);

  const tiles = seed ? (
    seed.split('').map((ch, i) => (
      <TileCard key={i} char={ch} isMatch={matches[i]} />
    ))
  ) : (
    Array.from({ length: 10 }, (_, i) => <EmptyTile key={i} />)
  );

  const tilesContent = txLink ? (
    <a href={txLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'contents' }}>
      {tiles}
    </a>
  ) : tiles;

  return (
    <>
      {/* Hash Display (before play — shown as tiles in the hash-value box) */}
      {!tilesVisible && (
        <div className="hash-display">
          <div className="hash-label">TRANSACTION HASH</div>
          <div className="hash-value">
            {tilesContent}
          </div>
          {seed10 && (
            <div className="hash-seed">SEED10: {seed10.toUpperCase()}</div>
          )}
        </div>
      )}

      {/* Tiles Container (shown after play) */}
      {tilesVisible && (
        <div className="tiles-container" id="tiles">
          <span className="tiles-hash-label">TRANSACTION HASH</span>
          {seed ? (
            seed.split('').map((ch, i) => (
              <TileCard key={i} char={ch} isMatch={matches[i]} />
            ))
          ) : (
            Array.from({ length: 10 }, (_, i) => <EmptyTile key={i} />)
          )}
        </div>
      )}
    </>
  );
}
