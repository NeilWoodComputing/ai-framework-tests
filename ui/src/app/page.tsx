import { H1, P, PageLayout } from '@design-system';
import { SiteNav } from '@shell/components/SiteNav';

export default function HomePage() {
  return (
    <PageLayout
      header={<SiteNav />}
      tid="page-layout"
    >
      <H1>Fish</H1>
      <P>
        Welcome to the Fish test app. The Fish list page, grid and form are added in later
        tickets. Use the Fish link in the navigation when that page is ready.
      </P>
    </PageLayout>
  );
}
