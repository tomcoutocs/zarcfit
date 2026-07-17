import { CalendarDays, MessageSquare, Salad, Users, Dumbbell, LineChart } from 'lucide-react';
import { Reveal } from './Reveal';

const CAPABILITIES = [
  {
    icon: Dumbbell,
    title: 'Program builder',
    description: 'Week-by-week structure with exercise library, sets, reps, and rest periods.',
    className: 'hm-cap-card--wide',
  },
  {
    icon: Users,
    title: 'Client roster',
    description: 'Invite-only onboarding, per-client notes, and activity at a glance.',
    className: 'hm-cap-card--tall',
  },
  {
    icon: MessageSquare,
    title: 'In-app messaging',
    description: 'Keep coaching conversations next to the programs you assign.',
    className: 'hm-cap-card--half',
  },
  {
    icon: Salad,
    title: 'Meal plan templates',
    description: 'Build nutrition plans on Growth and Pro tiers — assign like any program.',
    className: 'hm-cap-card--third',
  },
  {
    icon: CalendarDays,
    title: 'Schedule & sessions',
    description: 'Clients request sessions; you approve or decline from the dashboard.',
    className: 'hm-cap-card--half',
  },
  {
    icon: LineChart,
    title: 'Progress views',
    description: 'Workout logs, sleep tracking, and goals in one client profile.',
    className: 'hm-cap-card--wide',
  },
];

export default function LandingCapabilities() {
  return (
    <section className="hm-capabilities hm-container">
      <Reveal>
        <div className="hm-capabilities__head">
          <h2>Everything a solo coach needs — nothing you don&apos;t.</h2>
          <p style={{ color: 'var(--color-ink-2)' }}>
            ZarcFit is built for trainers who run their own roster, not gym chains with admin staff.
          </p>
        </div>
      </Reveal>
      <div className="hm-cap-grid">
        {CAPABILITIES.map((cap) => (
          <Reveal key={cap.title} className={`hm-cap-card ${cap.className}`}>
            <span className="hm-cap-card__icon" aria-hidden="true">
              <cap.icon size={18} />
            </span>
            <h3>{cap.title}</h3>
            <p>{cap.description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
