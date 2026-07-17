import { Reveal } from './Reveal';

const STEPS = [
  {
    title: 'Build programs in the builder',
    body: 'Drag exercises into weeks, set reps and rest, save templates, and assign the same program to multiple clients.',
    flip: false,
    panel: (
      <figure className="hm-panel">
        <div className="hm-panel__header">
          <p className="hm-panel__title">Program builder</p>
          <span className="hm-panel__meta">Week 3 · Push day</span>
        </div>
        <div className="hm-panel__body">
          <div className="hm-mock-rows">
            {['Barbell bench press', 'Incline dumbbell press', 'Cable flye', 'Tricep pushdown'].map((exercise, i) => (
              <div key={exercise} className="hm-mock-row">
                <div>
                  <p className="hm-mock-row__label">{exercise}</p>
                  <p className="hm-mock-row__sub">{i === 0 ? '4 × 8 · 90s rest' : '3 × 10 · 60s rest'}</p>
                </div>
                <span className="hm-mock-badge">{i === 0 ? 'A1' : `A${i + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      </figure>
    ),
  },
  {
    title: 'Invite clients and message in-app',
    body: 'Send invitation links, approve session requests, and keep coaching conversations tied to each client record.',
    flip: true,
    panel: (
      <figure className="hm-panel">
        <div className="hm-panel__header">
          <p className="hm-panel__title">Messages</p>
          <span className="hm-panel__meta">2 unread</span>
        </div>
        <div className="hm-panel__body">
          <div className="hm-mock-rows">
            <div className="hm-mock-row">
              <div>
                <p className="hm-mock-row__label">Alex Chen</p>
                <p className="hm-mock-row__sub">Can we move Thursday to Friday morning?</p>
              </div>
              <span className="hm-mock-badge hm-mock-badge--live">New</span>
            </div>
            <div className="hm-mock-row">
              <div>
                <p className="hm-mock-row__label">Jordan Lee</p>
                <p className="hm-mock-row__sub">Logged today&apos;s workout — felt heavy on squats</p>
              </div>
              <span className="hm-mock-badge">Read</span>
            </div>
            <div className="hm-mock-row">
              <div>
                <p className="hm-mock-row__label">Pending invitation</p>
                <p className="hm-mock-row__sub">sam@email.com · expires in 5 days</p>
              </div>
              <span className="hm-mock-badge">Invite</span>
            </div>
          </div>
        </div>
      </figure>
    ),
  },
  {
    title: 'See progress without chasing updates',
    body: 'Workout logs, sleep entries, and goal tracking roll up into client profiles so you know who needs a check-in.',
    flip: false,
    panel: (
      <figure className="hm-panel">
        <div className="hm-panel__header">
          <p className="hm-panel__title">Client progress</p>
          <span className="hm-panel__meta">Jordan Lee</span>
        </div>
        <div className="hm-panel__body">
          <div className="hm-mock-rows">
            <div className="hm-mock-row">
              <div>
                <p className="hm-mock-row__label">Workouts this week</p>
                <p className="hm-mock-row__sub">4 of 4 planned sessions completed</p>
              </div>
              <span className="hm-mock-badge hm-mock-badge--live">On track</span>
            </div>
            <div className="hm-mock-bars" aria-hidden="true">
              <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '55%' }} />
              <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '70%' }} />
              <div className="hm-mock-bar" style={{ height: '40%' }} />
              <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '80%' }} />
              <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '65%' }} />
            </div>
            <div className="hm-mock-row">
              <div>
                <p className="hm-mock-row__label">Sleep average</p>
                <p className="hm-mock-row__sub">Last 7 nights logged</p>
              </div>
              <span className="hm-mock-badge">Recovery</span>
            </div>
          </div>
        </div>
      </figure>
    ),
  },
];

export default function LandingWorkbench() {
  return (
    <section className="hm-container hm-section--tight" aria-label="Product tour">
      {STEPS.map((step) => (
        <Reveal key={step.title}>
          <article className={`hm-workbench-step${step.flip ? ' hm-workbench-step--flip' : ''}`}>
            <div className="hm-workbench-step__copy">
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
            <div className="hm-workbench-step__panel">{step.panel}</div>
          </article>
        </Reveal>
      ))}
    </section>
  );
}
