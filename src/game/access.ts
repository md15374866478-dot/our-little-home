/** Enabled only in local development or a hosting-enforced owner-private build. */
export const trioAllowed = import.meta.env.DEV || import.meta.env.VITE_OWNER_PRIVATE_PREVIEW === '1'
