import { Reveal } from './Reveal';

const WORKFLOW = [
  {
    num: '01',
    title: 'Create your trainer account',
    body: 'Set up your profile, notification preferences, and availability.',
  },
  {
    num: '02',
    title: 'Build and assign programs',
    body: 'Use the program builder or duplicate templates, then assign to clients.',
  },
  {
    num: '03',
    title: 'Coach through the roster',
    body: 'Message clients, review logs, and adjust programming as they progress.',
  },
];

export default function LandingWorkflow() {
  return (
    <section className="hm-dark-band">
      <div className="hm-container">
        <Reveal>
          <h2 style={{ fontSize: 'var(--text-display-s)', maxWidth: '20ch' }}>
            From signup to first client in three steps.
          </h2>
          <p style={{ maxWidth: '42ch', marginTop: 'var(--space-sm)' }}>
            No complex setup. Clients never self-register without your invitation.
          </p>
        </Reveal>
        <div className="hm-workflow">
          {WORKFLOW.map((step) => (
            <Reveal key={step.num}>
              <div className="hm-workflow__step">
                <span className="hm-workflow__num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
