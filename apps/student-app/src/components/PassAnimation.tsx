import { useEffect, useState } from 'react';

export interface PassAnimationProps {
  visible: boolean;
  level: number;
  xpAwarded: number;
  newlyUnlockedBadges: string[];
  petLabel: string;
  onClose: () => void;
}

export function PassAnimation({
  visible,
  level,
  xpAwarded,
  newlyUnlockedBadges,
  petLabel,
  onClose,
}: PassAnimationProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
    if (visible) {
      const timer = window.setTimeout(() => {
        setShow(false);
        onClose();
      }, 2200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [visible, onClose]);

  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 200,
        background: 'radial-gradient(circle at center, rgba(15,23,42,0.45), rgba(15,23,42,0.82))',
        animation: 'fadeOut 0.6s ease forwards',
        animationDelay: '1.6s',
      }}
    >
      <div
        style={{
          padding: '28px 32px',
          borderRadius: 20,
          background: 'rgba(15, 23, 42, 0.88)',
          border: '1px solid rgba(93, 168, 255, 0.4)',
          boxShadow: '0 18px 60px rgba(15, 23, 42, 0.55)',
          color: '#fff',
          textAlign: 'center',
          transform: 'translateY(0)',
          animation: 'popIn 0.45s ease',
        }}
      >
        <div style={{ fontSize: 42, marginBottom: 12 }}>🎉</div>
        <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>通关成功！</h3>
        <p style={{ marginTop: 8, fontSize: 16 }}>你获得了 +{xpAwarded} XP</p>
        <p style={{ marginTop: 4, fontSize: 14, color: 'var(--text-secondary)' }}>
          当前等级：Lv.{level}
        </p>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {newlyUnlockedBadges.length > 0 && (
            <div style={{ fontSize: 13 }}>
              🏅 新徽章：
              {newlyUnlockedBadges.map((badge) => (
                <span key={badge} style={{ marginLeft: 6, fontWeight: 600 }}>
                  {badge}
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 13 }}>宠物心情：{petLabel}</div>
        </div>
      </div>

      <style>
        {`
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; }
        }
      `}
      </style>
    </div>
  );
}
