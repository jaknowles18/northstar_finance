import { PageHeader } from "@/components/ProductUI";
import { ImportEmailBox } from "@/components/ImportEmailBox";

export default function ImportPage() {
  return <div className="page"><PageHeader eyebrow="Manual import" title="Bring in RBC purchases." description="Paste one alert or a batch of forwarded emails, review the recognized purchases, then save them together." /><ImportEmailBox /></div>;
}
