'use client';

import { useState, useRef, useEffect } from 'react';

interface InjPassModalProps {
  onConnect: (privateKey: string) => void;
  onClose: () => void;
  error: string;
}

export default function InjPassModal({ onConnect, onClose, error }: InjPassModalProps) {
  const [pk, setPk] = useState('');
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    const trimmed = pk.trim();
    if (!trimmed) return;
    onConnect(trimmed);
  };

  return (
    <div className="injpass-overlay" onClick={onClose}>
      <div className="injpass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="injpass-modal-header">
          <span className="injpass-logo">λ INJ PASS</span>
          <button className="injpass-close-btn" onClick={onClose}>✕</button>
        </div>

        <p className="injpass-desc">
          Enter your INJ Pass private key to play without a browser extension.
          <br /><br />
          Your key never leaves this device.
        </p>

        <div className="injpass-input-row">
          <input
            ref={inputRef}
            type={show ? 'text' : 'password'}
            value={pk}
            onChange={(e) => setPk(e.target.value)}
            placeholder="Private key (hex)"
            className="injpass-input"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="injpass-eye-btn"
            onClick={() => setShow((s) => !s)}
            title={show ? 'Hide' : 'Show'}
          >
            {show ? '🙈' : '👁'}
          </button>
        </div>

        {error && <p className="injpass-error">{error}</p>}

        <div className="injpass-btn-row">
          <button className="btn injpass-cancel-btn" onClick={onClose}>CANCEL</button>
          <button className="btn injpass-connect-btn" onClick={handleSubmit} disabled={!pk.trim()}>
            CONNECT
          </button>
        </div>

        <p className="injpass-notice">
          ⚠ Use a burner wallet. Never paste your main key into any webpage.
        </p>
      </div>
    </div>
  );
}
