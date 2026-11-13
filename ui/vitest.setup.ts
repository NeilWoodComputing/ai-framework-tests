import { configure } from '@testing-library/react';

// Components render data-tid (same attribute Playwright uses), not data-testid.
configure({ testIdAttribute: 'data-tid' });
