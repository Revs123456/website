'use client';
import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { Globe, Server, Cloud, Code, Database, Cpu, Shield, Smartphone, Check, Map } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Globe, Server, Cloud, Code, Database, Cpu, Shield, Smartphone,
};

const FALLBACK = [
  { id: 'frontend', title: 'Frontend Developer', color: '#2563eb', description: 'Go from zero to a job-ready frontend developer.',
    steps: [{ s: 'Internet Basics', d: 'DNS, HTTP, browsers' }, { s: 'HTML & CSS', d: 'Semantics, Flexbox, Grid' }, { s: 'JavaScript ES6+', d: 'DOM, async/await, modules' }, { s: 'React / Next.js', d: 'Components, hooks, App Router' }, { s: 'State Management', d: 'Zustand, Redux Toolkit' }, { s: 'Tailwind CSS', d: 'Utility-first styling' }, { s: 'API Integration', d: 'REST, GraphQL, React Query' }, { s: 'Testing & Deploy', d: 'Jest, Cypress, Vercel' }], icon: 'Globe' },
  { id: 'backend', title: 'Backend Developer', color: '#059669', description: 'Build scalable APIs and master server-side systems.',
    steps: [{ s: 'OS & Networking', d: 'Linux, TCP/IP, HTTP' }, { s: 'Node.js / Python', d: 'Server runtimes, async' }, { s: 'SQL Databases', d: 'PostgreSQL, MySQL, ORM' }, { s: 'NoSQL Databases', d: 'MongoDB, Redis' }, { s: 'REST & GraphQL', d: 'Express, NestJS, Fastify' }, { s: 'Authentication', d: 'JWT, OAuth 2.0' }, { s: 'Caching & Queues', d: 'Redis, BullMQ' }, { s: 'Docker & CI/CD', d: 'Containers, GitHub Actions' }], icon: 'Server' },
  { id: 'devops', title: 'DevOps Engineer', color: '#7c3aed', description: 'Bridge dev and ops — master cloud and automation.',
    steps: [{ s: 'Linux Fundamentals', d: 'Shell, permissions' }, { s: 'Networking', d: 'TCP/IP, DNS, proxies' }, { s: 'Git & VCS', d: 'Branching, GitHub Flow' }, { s: 'Docker', d: 'Dockerfiles, Compose' }, { s: 'CI/CD Pipelines', d: 'GitHub Actions, GitLab CI' }, { s: 'Infra as Code', d: 'Terraform, Ansible' }, { s: 'Kubernetes', d: 'Pods, services, Helm' }, { s: 'Cloud Provider', d: 'AWS / GCP / Azure' }], icon: 'Cloud' },
];

const wrap = { maxWidth: 1152, margin: '0 auto', padding: '0 24px' } as const;

function colorBg(color: string) {
  return color + '15';
}
function colorBorder(color: string) {
  return color + '40';
}

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    fetch(`${BASE}/roadmaps`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.data ?? [];
        setRoadmaps(list.length > 0 ? list : FALLBACK);
      })
      .catch(() => setRoadmaps(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const maps = loading ? FALLBACK : roadmaps;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingTop: 80, paddingBottom: 40, textAlign: 'center' }}>
        <div style={{ ...wrap, maxWidth: 640 }}>
          <span className="badge badge-cyan" style={{ marginBottom: 12, display: 'inline-flex' }}>Learning Paths</span>
          <h1 className="text-display-sm">Developer <span className="grad-blue">Roadmaps</span></h1>
          <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>Follow the steps, build projects, and get hired. Zero guesswork.</p>
        </div>
      </div>

      <div style={{ ...wrap, paddingTop: 40, paddingBottom: 80 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {maps.map((rm: any) => {
              const color = rm.color || '#2563eb';
              const bg = colorBg(color);
              const border = colorBorder(color);
              const Icon = ICON_MAP[rm.icon || 'Globe'] || Globe;
              const steps: { s: string; d: string }[] = rm.steps || [];
              return (
                <div key={rm.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: 28, background: bg, borderBottom: `1px solid ${border}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                    <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4, fontSize: 16 }}>{rm.title}</h2>
                    <p style={{ fontSize: 13, color: '#64748b' }}>{rm.description}</p>
                  </div>

                  {steps.length > 0 && (
                    <div style={{ flex: 1, padding: 28 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 20 }}>Learning Path</p>
                      <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {steps.map((step, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: bg, color, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{step.s}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8' }}>{step.d}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div style={{ padding: 20, borderTop: '1px solid #f1f5f9' }}>
                    {steps.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                        <Check size={11} style={{ color }} />{steps.length} milestones · Beginner to job-ready
                      </div>
                    )}
                    <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>View Full Roadmap</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
