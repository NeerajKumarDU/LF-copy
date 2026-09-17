// Page-size constants shared between server pages (SSR queries) and the
// client pager components that fetch subsequent pages. Deliberately NOT in a
// "use client" file: every export of a client-directive module becomes an
// opaque client reference to Server Components, even a plain number — passing
// one into a real value slot (e.g. a pg query param) throws at runtime.
export const EDITORIAL_PAGE_SIZE = 10;
export const CATEGORY_PAGE_SIZE = 10;
