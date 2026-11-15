import LegalPage from '@/views/LegalPage.jsx';
import { loadLegalDoc } from '@/lib/legalContent.mjs';

export default async function Page() {
  return <LegalPage content={await loadLegalDoc('terms')} />;
}
