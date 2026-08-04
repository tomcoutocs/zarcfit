import { Reveal } from './Reveal';

function MacrosPreview() {
  return (
    <figure className="hm-panel">
      <div className="hm-panel__header">
        <p className="hm-panel__title">Nutrition mode</p>
        <span className="hm-panel__meta">Flexible dieting</span>
      </div>
      <div className="hm-panel__body">
        <div className="hm-mock-rows">
          <div className="hm-mock-row">
            <div>
              <p className="hm-mock-row__label">Daily target</p>
              <p className="hm-mock-row__sub">2,400 kcal · client logs any food that fits</p>
            </div>
            <span className="hm-mock-badge hm-mock-badge--live">On track</span>
          </div>
          <div className="hm-mock-row">
            <div>
              <p className="hm-mock-row__label">Protein · Carbs · Fat</p>
              <p className="hm-mock-row__sub">180g · 260g · 70g target split</p>
            </div>
            <span className="hm-mock-badge">Macros</span>
          </div>
          <div className="hm-mock-bars" aria-hidden="true">
            <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '82%' }} />
            <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '68%' }} />
            <div className="hm-mock-bar" style={{ height: '90%' }} />
            <div className="hm-mock-bar hm-mock-bar--accent" style={{ height: '55%' }} />
            <div className="hm-mock-bar" style={{ height: '74%' }} />
          </div>
          <div className="hm-mock-row">
            <div>
              <p className="hm-mock-row__label">Or assign a full meal plan</p>
              <p className="hm-mock-row__sub">Specific foods, portions, and swaps</p>
            </div>
            <span className="hm-mock-badge">Meal plan</span>
          </div>
        </div>
      </div>
    </figure>
  );
}

export default function LandingNutrition() {
  return (
    <section className="hm-container hm-section--tight" aria-label="Nutrition approach">
      <Reveal>
        <article className="hm-workbench-step">
          <div className="hm-workbench-step__copy">
            <h2>Flexible dieting, not a nutrition tax.</h2>
            <p>
              Most coaching platforms sell meal planning as a $30–45/mo add-on. ZarcFit bundles both approaches
              into Growth and Pro plans: build detailed meal plans when a client needs structure, or set
              macro targets and let them log whatever fits — flexible dieting, done properly, with a real
              food diary behind it.
            </p>
          </div>
          <div className="hm-workbench-step__panel">
            <MacrosPreview />
          </div>
        </article>
      </Reveal>
    </section>
  );
}
