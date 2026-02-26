'use client';

import { useEffect, useRef } from 'react';

export default function Background() {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      container.appendChild(particle);
    }
    return () => { container.innerHTML = ''; };
  }, []);

  return (
    <>
      <div className="bg-pixel-grid" />
      <div className="bg-animated" />
      <div className="bg-particles" ref={particlesRef} />
    </>
  );
}
