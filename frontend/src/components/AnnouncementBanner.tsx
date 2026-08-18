'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function AnnouncementBanner() {
  const s = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const active = s.announcement_active === 'true';
    const text = s.announcement_text || '';
    if (!active || !text) return;
    const dismissed = localStorage.getItem('dismissed_announcement');
    if (dismissed !== text) setVisible(true);
  }, [s.announcement_active, s.announcement_text]);

  if (!visible) return null;

  const bg = s.announcement_bg || '#2563eb';
  const text = s.announcement_text || '';
  const link = s.announcement_link || '';
  const linkText = s.announcement_link_text || 'Learn more';

  function dismiss() {
    localStorage.setItem('dismissed_announcement', text);
    setVisible(false);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '8px 48px 8px 16px',
      fontSize: 13, fontWeight: 500,
    }}>
      <span>{text}</span>
      {link && (
        <Link href={link} style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
          {linkText}
        </Link>
      )}
      <button
        onClick={dismiss}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 4 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
