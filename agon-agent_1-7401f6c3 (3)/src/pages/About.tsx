import Card from '../components/Card';
import SectionHeading from '../components/SectionHeading';

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <SectionHeading
        title="About this GEDI screening guidance site"
        subtitle="A lightweight hub to compare screening recommendations across priority conditions."
      />

      <div className="mt-6 grid gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-zinc-900">What is included</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>Skin cancer screening considerations</li>
            <li>Cervical cancer screening (Pap test / HPV testing pathways)</li>
            <li>Colorectal cancer screening (FIT, colonoscopy, etc.)</li>
            <li>Breast cancer screening (mammography)</li>
            <li>Prostate cancer screening (PSA shared decision-making)</li>
            <li>Cardiovascular disease risk screening: Hypertension and Diabetes</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-zinc-900">How to use</h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700">
            Start in <strong>Explore</strong> to filter by age and sex. Open a topic page for resources and
            deeper details. Use this content to support team huddles, preventive-care workflows, or
            patient education.
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-zinc-900">Disclaimer</h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700">
            This website summarizes screening guidance from major sources and is intended for education and
            quality improvement. It does not replace individualized clinical assessment, shared decision-making,
            or local policy.
          </p>
        </Card>
      </div>
    </div>
  );
}
