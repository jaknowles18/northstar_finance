import { ImportEmailBox } from "@/components/ImportEmailBox";
export default function ImportPage() { return <div className="page"><div className="eyebrow">Secure import</div><h1 className="page-title">Bring in an RBC purchase.</h1><p className="subtitle">Paste a notification or choose a .txt or .eml file. The email is parsed in memory; only the transaction fields are prepared for saving.</p><ImportEmailBox/></div> }

