import missing from '@/does-not-exist-ci-guard-test';

export default function Page() {
  return <div>{String(missing)}</div>;
}
