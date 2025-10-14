const en = ({
  overview: {
    title: false,
    'total-pages': false,
    'draft-pages': false,
    'total-users': false
  },
  'recently-updated-pages': {
    title: false,
    edited: false,
    'no-pages-found': false
  },
  'recently-created-pages': {
    title: false,
    created: false,
    'no-pages-found': false
  },
  'recently-signed-up-users': {
    title: false
  }
} as const);
export default en;