/**
 * State Bhulekh (land records) portal deep-links.
 *
 * Strategy: most portals are CAPTCHA-protected so programmatic API access is
 * not possible without solving CAPTCHAs.  Instead we build deep-link URLs
 * that open the correct search page in a new tab so the farmer/officer can
 * manually look up the record.
 *
 * Where a state provides a direct Khasra/Khata URL template we use it;
 * otherwise we link to the state's main bhulekh portal.
 */

export interface BhulelkhPortal {
  state: string
  portalName: string
  /** Base URL for the state bhulekh portal */
  baseUrl: string
  /** Build a direct-search URL given khasra + district; may fall back to baseUrl */
  searchUrl: (district: string, khasra?: string, khata?: string) => string
  /** Whether a proper deep-link (with params) is supported */
  hasDeepLink: boolean
}

const BHULEKH_PORTALS: BhulelkhPortal[] = [
  {
    state: 'Maharashtra',
    portalName: 'MahaBhulekh (7/12)',
    baseUrl: 'https://mahabhulekh.maharashtra.gov.in',
    searchUrl: (district) =>
      `https://mahabhulekh.maharashtra.gov.in/seven_twelve/english/selectdivision?district=${encodeURIComponent(district)}`,
    hasDeepLink: true,
  },
  {
    state: 'Uttar Pradesh',
    portalName: 'UP Bhulekh',
    baseUrl: 'https://upbhulekh.gov.in',
    searchUrl: (district, khasra) =>
      khasra
        ? `https://upbhulekh.gov.in/public/public_ror/Search_Khasra_Krshak.jsp`
        : 'https://upbhulekh.gov.in',
    hasDeepLink: false,
  },
  {
    state: 'Punjab',
    portalName: 'Punjab Land Records (Fard)',
    baseUrl: 'https://jamabandi.punjab.gov.in',
    searchUrl: (district, khasra, khata) =>
      `https://jamabandi.punjab.gov.in/default1.aspx`,
    hasDeepLink: false,
  },
  {
    state: 'Haryana',
    portalName: 'Haryana Jamabandi',
    baseUrl: 'https://jamabandi.nic.in',
    searchUrl: () => 'https://jamabandi.nic.in/land%20records/NakalRecord',
    hasDeepLink: false,
  },
  {
    state: 'Rajasthan',
    portalName: 'Apna Khata (E-Dharti)',
    baseUrl: 'https://apnakhata.rajasthan.gov.in',
    searchUrl: (district) =>
      `https://apnakhata.rajasthan.gov.in/LRCLogin.aspx`,
    hasDeepLink: false,
  },
  {
    state: 'Madhya Pradesh',
    portalName: 'MP Bhulekh',
    baseUrl: 'https://mpbhulekh.gov.in',
    searchUrl: (district, khasra) =>
      `https://mpbhulekh.gov.in/Login.do`,
    hasDeepLink: false,
  },
  {
    state: 'Karnataka',
    portalName: 'Bhoomi (RTC / Pahani)',
    baseUrl: 'https://landrecords.karnataka.gov.in',
    searchUrl: (district) =>
      `https://landrecords.karnataka.gov.in/Service3/`,
    hasDeepLink: false,
  },
  {
    state: 'Telangana',
    portalName: 'Dharani Portal',
    baseUrl: 'https://dharani.telangana.gov.in',
    searchUrl: (district, khasra) =>
      `https://dharani.telangana.gov.in/publicInterface/encumbranceCertificate`,
    hasDeepLink: false,
  },
  {
    state: 'Andhra Pradesh',
    portalName: 'Meebhoomi (AP Pahani)',
    baseUrl: 'https://meebhoomi.ap.gov.in',
    searchUrl: (district, khasra) =>
      khasra
        ? `https://meebhoomi.ap.gov.in/Meebhoomi/pahani.aspx`
        : 'https://meebhoomi.ap.gov.in',
    hasDeepLink: false,
  },
  {
    state: 'Gujarat',
    portalName: 'AnyROR Gujarat',
    baseUrl: 'https://anyror.gujarat.gov.in',
    searchUrl: () => 'https://anyror.gujarat.gov.in',
    hasDeepLink: false,
  },
  {
    state: 'Bihar',
    portalName: 'Bihar Bhumi',
    baseUrl: 'https://biharbhumi.bihar.gov.in',
    searchUrl: () => 'https://biharbhumi.bihar.gov.in/Biharbhumi/',
    hasDeepLink: false,
  },
  {
    state: 'West Bengal',
    portalName: 'Banglarbhumi',
    baseUrl: 'https://banglarbhumi.gov.in',
    searchUrl: () => 'https://banglarbhumi.gov.in',
    hasDeepLink: false,
  },
  {
    state: 'Tamil Nadu',
    portalName: 'TNELIS / Patta Chitta',
    baseUrl: 'https://eservices.tn.gov.in',
    searchUrl: () => 'https://eservices.tn.gov.in/eservicesnew/index.html',
    hasDeepLink: false,
  },
  {
    state: 'Chhattisgarh',
    portalName: 'CG Bhuiyan',
    baseUrl: 'https://bhuiyan.cg.nic.in',
    searchUrl: () => 'https://bhuiyan.cg.nic.in',
    hasDeepLink: false,
  },
  {
    state: 'Odisha',
    portalName: 'Bhulekh Odisha',
    baseUrl: 'https://bhulekh.ori.nic.in',
    searchUrl: () => 'https://bhulekh.ori.nic.in/RoRView.aspx',
    hasDeepLink: false,
  },
]

/** Look up the bhulekh portal config for a given state. */
export function getBhulelkhPortal(state: string): BhulelkhPortal | null {
  return BHULEKH_PORTALS.find(p => p.state === state) ?? null
}

/** Get a search URL for a specific state + farmer fields. */
export function getBhulelkhSearchUrl(
  state: string,
  district: string,
  khasra?: string,
  khata?: string,
): string | null {
  const portal = getBhulelkhPortal(state)
  if (!portal) return null
  return portal.searchUrl(district, khasra, khata)
}

export { BHULEKH_PORTALS }
