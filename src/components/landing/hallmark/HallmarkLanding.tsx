import '@/styles/landing-hallmark.css';
import LandingNav from './LandingNav';
import LandingHero from './LandingHero';
import LandingWorkbench from './LandingWorkbench';
import LandingCapabilities from './LandingCapabilities';
import LandingWorkflow from './LandingWorkflow';
import LandingPricing from './LandingPricing';
import LandingCta from './LandingCta';
import LandingFooter from './LandingFooter';

export default function HallmarkLanding() {
  return (
    <div className="hallmark-landing" data-theme="coral">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingWorkbench />
        <LandingCapabilities />
        <LandingWorkflow />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
