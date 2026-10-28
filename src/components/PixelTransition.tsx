'use client';

import React, { useRef, useEffect, useState, useCallback, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import './PixelTransition.css';

interface PixelTransitionProps {
  firstContent: React.ReactNode | string;
  secondContent: React.ReactNode | string;
  gridSize?: number;
  pixelColor?: string;
  animationStepDuration?: number;
  once?: boolean;
  autoActivate?: boolean;
  className?: string;
  style?: CSSProperties;
  aspectRatio?: string;
}

const PixelTransition: React.FC<PixelTransitionProps> = ({
  firstContent,
  secondContent,
  gridSize = 7,
  pixelColor = 'currentColor',
  animationStepDuration = 0.3,
  once = false,
  autoActivate = false,
  aspectRatio = '100%',
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pixelGridRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  /* in-flight sweep tweens — killed directly so interruption never touches
     the global tween registry lookup (killTweensOf recursed on NodeLists) */
  const animsRef = useRef<gsap.core.Tween[]>([]);
  const killAnims = useCallback((): void => {
    animsRef.current.forEach((t) => t.kill());
    animsRef.current = [];
  }, []);

  const [isActive, setIsActive] = useState<boolean>(autoActivate);

  /* SSR-safe: only evaluated in the browser during render, no state writes */
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches);

  /* stable identity so the grid effect below doesn't rebuild every render.
     NOTE: never calls setState itself — callers sync isActive separately,
     which keeps auto-activate safe to run inside an effect. */
  const animatePixels = useCallback(
    (activate: boolean): void => {
    const pixelGridEl = pixelGridRef.current;
    const activeEl = activeRef.current;
    if (!pixelGridEl || !activeEl) return;

    /* reduced motion: hard cut, no pixel storm */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      activeEl.style.display = activate ? 'block' : 'none';
      return;
    }

    const pixels = pixelGridEl.querySelectorAll<HTMLDivElement>('.pixelated-image-card__pixel');
    if (!pixels.length) return;

    killAnims();
    gsap.set(pixels, { display: 'none' });

    const totalPixels = pixels.length;
    const staggerDuration = animationStepDuration / totalPixels;

    animsRef.current.push(
      gsap.to(pixels, {
        display: 'block',
        duration: 0,
        stagger: {
          each: staggerDuration,
          from: 'random'
        }
      }),
      gsap.delayedCall(animationStepDuration, () => {
        activeEl.style.display = activate ? 'block' : 'none';
        activeEl.style.pointerEvents = activate ? 'none' : '';
      }),
      gsap.to(pixels, {
        display: 'none',
        duration: 0,
        delay: animationStepDuration,
        stagger: {
          each: staggerDuration,
          from: 'random'
        }
      }),
    );
    },
    [animationStepDuration, killAnims],
  );

  const handleEnter = (): void => {
    if (!isActive) {
      setIsActive(true);
      animatePixels(true);
    }
  };
  const handleLeave = (): void => {
    if (isActive && !once) {
      setIsActive(false);
      animatePixels(false);
    }
  };
  const handleClick = (): void => {
    if (!isActive) {
      setIsActive(true);
      animatePixels(true);
    } else if (isActive && !once) {
      setIsActive(false);
      animatePixels(false);
    }
  };

  /* build the pixel grid, then auto-run the sweep when asked (page wipes) */
  useEffect(() => {
    const pixelGridEl = pixelGridRef.current;
    if (!pixelGridEl) return;

    pixelGridEl.innerHTML = '';

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixelated-image-card__pixel');
        pixel.style.backgroundColor = pixelColor;

        const size = 100 / gridSize;
        pixel.style.width = `${size}%`;
        pixel.style.height = `${size}%`;
        pixel.style.left = `${col * size}%`;
        pixel.style.top = `${row * size}%`;
        pixelGridEl.appendChild(pixel);
      }
    }

    if (autoActivate) animatePixels(true);

    return () => {
      killAnims();
    };
  }, [gridSize, pixelColor, autoActivate, animatePixels, killAnims]);

  return (
    <div
      ref={containerRef}
      className={`pixelated-image-card ${className}`}
      style={style}
      onMouseEnter={!isTouchDevice ? handleEnter : undefined}
      onMouseLeave={!isTouchDevice ? handleLeave : undefined}
      onClick={isTouchDevice ? handleClick : undefined}
      onFocus={!isTouchDevice ? handleEnter : undefined}
      onBlur={!isTouchDevice ? handleLeave : undefined}
      tabIndex={0}
    >
      <div style={{ paddingTop: aspectRatio }} />
      <div className="pixelated-image-card__default" aria-hidden={isActive}>
        {firstContent}
      </div>
      <div className="pixelated-image-card__active" ref={activeRef} aria-hidden={!isActive}>
        {secondContent}
      </div>
      <div className="pixelated-image-card__pixels" ref={pixelGridRef} />
    </div>
  );
};

export default PixelTransition;
