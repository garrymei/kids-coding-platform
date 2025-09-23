import React, { useState, useEffect } from 'react';

interface PrivacyBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
  showDecline?: boolean;
  className?: string;
}

export function PrivacyBanner({ 
  onAccept, 
  onDecline, 
  showDecline = true, 
  className = '' 
}: PrivacyBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    // 检查是否已经接受过隐私政策
    const hasAccepted = localStorage.getItem('privacy-policy-accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy-policy-accepted', 'true');
    localStorage.setItem('privacy-policy-accepted-date', new Date().toISOString());
    setIsAccepted(true);
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    setIsVisible(false);
    onDecline?.();
  };

  if (!isVisible || isAccepted) {
    return null;
  }

  return (
    <div className={`privacy-banner ${className}`}>
      <div className="privacy-banner__content">
        <div className="privacy-banner__icon">🔒</div>
        <div className="privacy-banner__text">
          <h4>隐私保护提醒</h4>
          <p>
            我们严格保护您的隐私和个人信息。使用本平台即表示您同意我们的
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">隐私政策</a>
            和
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer">服务条款</a>。
          </p>
          <p className="privacy-banner__highlight">
            特别提醒：本平台面向儿童用户，我们遵循严格的儿童隐私保护标准。
          </p>
        </div>
      </div>
      
      <div className="privacy-banner__actions">
        {showDecline && (
          <button
            className="privacy-banner__button privacy-banner__button--decline"
            onClick={handleDecline}
          >
            不同意
          </button>
        )}
        <button
          className="privacy-banner__button privacy-banner__button--accept"
          onClick={handleAccept}
        >
          我同意
        </button>
      </div>
      
      <div className="privacy-banner__links">
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer">
          隐私政策
        </a>
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer">
          服务条款
        </a>
        <a href="/legal/children-privacy" target="_blank" rel="noopener noreferrer">
          儿童隐私保护
        </a>
        <a href="/legal/contact" target="_blank" rel="noopener noreferrer">
          联系我们
        </a>
      </div>
    </div>
  );
}
