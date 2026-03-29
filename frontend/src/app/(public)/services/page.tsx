'use client';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { Star, Clock, Users, Award, Check, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const FAQS = [
  { q: 'How long does delivery take?',  a: 'Basic: 3 days · ATS Pro: 2 days · Premium: 24 hours. Rush available on request.' },
  { q: "What if I'm not satisfied?",   a: "We offer free revisions within your plan's rounds. Still not happy? Full refund, no questions asked." },
  { q: 'Do you work with freshers?',    a: 'Absolutely. We specialize in crafting standout resumes for candidates with 0–1 years of experience.' },
  { q: 'How do I submit my info?',      a: "After ordering you'll receive a detailed questionnaire. Our experts build your resume based on your inputs." },
];

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

function safeJson(val: any): string[] {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || '[]'); } catch { return []; }
}

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    api.services.list().then(setServices).catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Back button strip */}
      <div style={{ background: '#fff', paddingTop: 80 }}>
        <div style={{ ...wrap }}><BackButton /></div>
      </div>

      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingBottom: 40, textAlign: 'center' }}>
        <div style={{ ...wrap, maxWidth: 600 }}>
          <span className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>Career Services</span>
          <h1 className="text-display-sm">Everything you need to <span className="grad-blue">get hired</span></h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>
            Expert-crafted services to help you land your dream tech job faster.
          </p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 48, paddingBottom: 80 }}>

        {/* Services grid */}
        {services.length > 0 && (
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 32 }}>Our Services</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
              {services.map(svc => {
                const features = safeJson(svc.included_features);
                return (
                  <div key={svc.id} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 4 }}>
                        {svc.price}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{svc.name}</div>
                      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{svc.description}</p>
                    </div>
                    {features.length > 0 && (
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                        {features.map((f: string) => (
                          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569' }}>
                            <Check size={14} style={{ color: '#2563eb', marginTop: 1, flexShrink: 0 }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={svc.name === '1:1 Career Call' ? '/book' : `/order?service=${svc.id}`}
                      className="btn btn-blue"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'auto' }}
                    >
                      {svc.name === '1:1 Career Call' ? 'Book a Slot' : 'Get Started'} <ArrowRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Proof strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 16, marginBottom: 64 }}>
          {[
            { icon: Award, val: '1,200+', label: 'Resumes delivered', c: '#2563eb' },
            { icon: Star,  val: '98%',    label: 'Satisfied clients',  c: '#f59e0b' },
            { icon: Clock, val: '48hrs',  label: 'Average delivery',   c: '#059669' },
            { icon: Users, val: '500+',   label: 'Jobs landed',        c: '#7c3aed' },
          ].map(({ icon: Icon, val, label, c }) => (
            <div key={label} className="card" style={{ padding: 20, textAlign: 'center' }}>
              <Icon size={18} style={{ color: c, margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 2 }}>{val}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 32 }}>Common questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map(({ q, a }) => (
              <div key={q} className="card" style={{ padding: 20 }}>
                <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, marginBottom: 8 }}>{q}</p>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
