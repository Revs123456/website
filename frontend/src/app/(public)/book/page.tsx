'use client';
import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import { Calendar, Clock, User, Mail, Check, CreditCard, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

declare global { interface Window { Razorpay: any; } }

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDateLong(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function BookPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [step, setStep] = useState<'date' | 'slot' | 'details' | 'done'>('date');
  const [form, setForm] = useState({ name: '', email: '' });
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.slots.listAvailable()
      .then(setSlots)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group slots by date
  const byDate = slots.reduce((acc: Record<string, any[]>, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const dates = Object.keys(byDate).sort();
  const slotsForDate = selectedDate ? (byDate[selectedDate] || []) : [];

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setPaying(true);
    setError('');
    try {
      // Create order in DB
      const order = await api.orders.create({
        customer_name: form.name,
        customer_email: form.email,
        name: form.name,
        email: form.email,
        service_type: '1:1 Career Call',
        experience_level: 'N/A',
        message: `Slot: ${fmtDateLong(selectedSlot.date)} ${fmt12(selectedSlot.start_time)} – ${fmt12(selectedSlot.end_time)}`,
      });

      // Create Razorpay order
      const res = await fetch(`${BASE}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, amount: 500 }),
      });
      const rzpData = await res.json();
      if (!res.ok) throw new Error(rzpData.message || 'Payment initiation failed');

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway');

      const rzp = new window.Razorpay({
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'TechChampsByRev',
        description: '1:1 Career Call',
        order_id: rzpData.razorpay_order_id,
        prefill: { name: form.name, email: form.email },
        theme: { color: '#2563eb' },
        handler: async (response: any) => {
          try {
            // Verify payment
            await fetch(`${BASE}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            // Book the slot
            await api.slots.book(selectedSlot.id, { name: form.name, email: form.email, order_id: order.id });
            setStep('done');
          } catch {
            setError('Payment received but booking failed. Please contact support.');
          }
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin .8s linear infinite' }} />
    </div>
  );

  if (step === 'done') return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 48, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={28} style={{ color: '#16a34a' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Booking Confirmed!</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
          Hey <strong style={{ color: '#0f172a' }}>{form.name}</strong>, your slot is booked.
        </p>
        <div style={{ margin: '20px 0', padding: '16px 20px', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#1d4ed8', marginBottom: 4 }}>
            <Calendar size={15} /> {fmtDateLong(selectedSlot.date)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 14, color: '#2563eb' }}>
            <Clock size={15} /> {fmt12(selectedSlot.start_time)} – {fmt12(selectedSlot.end_time)}
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>We'll send the meeting link to <strong>{form.email}</strong> shortly.</p>
        <a href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>Back to Home</a>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ background: '#fff', paddingTop: 80 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}><BackButton /></div>
      </div>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', paddingBottom: 32, textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 24px 0' }}>
          <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-flex' }}>1:1 Career Call</span>
          <h1 className="text-display-sm" style={{ marginBottom: 8 }}>Book your <span className="grad-blue">session</span></h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>30-min personal call · ₹500 · Pick a time that works for you</p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {[
            { s: 'date', label: 'Pick Date' },
            { s: 'slot', label: 'Pick Time' },
            { s: 'details', label: 'Your Details' },
          ].map(({ s, label }, i) => {
            const steps = ['date', 'slot', 'details'];
            const idx = steps.indexOf(step);
            const mine = steps.indexOf(s);
            const done = mine < idx;
            const active = mine === idx;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  background: done ? '#2563eb' : active ? '#2563eb' : '#e2e8f0',
                  color: done || active ? '#fff' : '#94a3b8',
                }}>
                  {done ? <Check size={13} /> : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#0f172a' : '#94a3b8' }}>{label}</span>
                {i < 2 && <div style={{ width: 32, height: 1, background: '#e2e8f0' }} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Pick Date */}
        {step === 'date' && (
          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 20, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} style={{ color: '#2563eb' }} /> Select a Date
            </h2>
            {dates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontWeight: 600 }}>No available slots</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Check back soon — new slots are added regularly.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {dates.map(date => (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setStep('slot'); }}
                    style={{
                      padding: '14px 12px', borderRadius: 12, border: '1px solid #e2e8f0',
                      background: '#fff', cursor: 'pointer', textAlign: 'center',
                      transition: 'all .15s',
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb'; (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                  >
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{new Date(date + 'T00:00:00').getDate()}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#059669', fontWeight: 600 }}>{byDate[date].length} slot{byDate[date].length > 1 ? 's' : ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pick Time */}
        {step === 'slot' && selectedDate && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setStep('date')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <ChevronLeft size={16} /> Back
              </button>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} style={{ color: '#2563eb' }} /> {fmtDateLong(selectedDate)}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {slotsForDate.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => { setSelectedSlot(slot); setStep('details'); }}
                  style={{
                    padding: '16px', borderRadius: 12, border: '2px solid #e2e8f0',
                    background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb'; (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                >
                  <Clock size={16} style={{ color: '#2563eb', margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{fmt12(slot.start_time)}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>to {fmt12(slot.end_time)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Details + Payment */}
        {step === 'details' && selectedSlot && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setStep('slot')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <ChevronLeft size={16} /> Back
              </button>
              <h2 style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Your Details</h2>
            </div>

            {/* Selected slot summary */}
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                <Calendar size={14} /> {fmtDateLong(selectedSlot.date)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
                <Clock size={14} /> {fmt12(selectedSlot.start_time)} – {fmt12(selectedSlot.end_time)}
              </span>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>{error}</div>
            )}

            <form onSubmit={pay} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}><User size={11} /> Name</label>
                <input required name="name" value={form.name} onChange={change} className="input" placeholder="Rahul Sharma" />
              </div>
              <div>
                <label style={lbl}><Mail size={11} /> Email</label>
                <input required type="email" name="email" value={form.email} onChange={change} className="input" placeholder="you@email.com" />
              </div>
              <button
                type="submit"
                disabled={paying}
                className="btn btn-blue"
                style={{ padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: paying ? 0.7 : 1 }}
              >
                {paying ? (
                  <svg style={{ animation: 'spin .8s linear infinite', width: 20, height: 20 }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <><CreditCard size={16} /> Pay ₹500 & Confirm Booking</>}
              </button>
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>Secured by Razorpay · UPI, Cards, Net Banking accepted</p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 8 };
