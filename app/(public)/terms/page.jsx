import LegalPage from '@/views/LegalPage.jsx';
import { loadLegalDoc } from '@/lib/legalContent.js';

export default async function Page() {
  return <LegalPage content={await loadLegalDoc('terms')} />;
}
