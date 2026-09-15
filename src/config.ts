/**
 * ── SITE CONFIG ─────────────────────────────────────────────────────────
 * Every page reads from this file. Edit content here, not in the pages.
 *
 * SOURCING RULE: every fact below is taken from martin-richardson.com as
 * published on 2026-09-15. Nothing is added from memory or elsewhere.
 * If a fact is not on the live site and has not been supplied by Martin,
 * it does not go in. Titles marked `confirm: true` are derived from the
 * media file name and need Martin's sign-off (see README).
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Prefix a root-relative path with the deploy base ('/' in production, '/martin-website' on Pages). */
export const url = (p: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${p}`;

export const site = {
  name: 'Martin Richardson',
  role: 'Holographer · Emeritus Professor',
  url: 'https://martin-richardson.com',
  description:
    'Martin Richardson, holographer and Emeritus Professor: holographic portraits, films and publications. Over eight hundred holograms held by the Science Museum, London.',

  email: 'researchatmartin@gmail.com',

  // Contact form. Leave empty and the form opens the visitor's mail client
  // addressed to `email` (works today). Set PUBLIC_WEB3FORMS_KEY in .env to
  // deliver submissions straight to the inbox instead.
  web3formsKey: import.meta.env.PUBLIC_WEB3FORMS_KEY ?? '',

  collectionUrl: 'https://collection.sciencemuseumgroup.org.uk/',
  disclaimerPdf: url('/docs/disclaimer.pdf'),
};

export const nav = [
  { href: '/gallery/', label: 'Gallery' },
  { href: '/film/', label: 'Bowie Film' },
  { href: '/publications/', label: 'Publications' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
].map((item) => ({ ...item, href: url(item.href) }));

/** Headline figures, each stated on the live site. */
export const figures = [
  { value: '800+', label: 'holograms acquired by the Science Museum, London, in 2023' },
  { value: '1988', label: 'first PhD in Holography, Royal College of Art' },
  { value: '9', label: 'published books' },
  { value: '7', label: 'patents' },
  { value: '50+', label: 'academic papers' },
];

export const milestones = [
  { year: '1958', text: 'Born in London to a working-class family.' },
  { year: '1988', text: 'Completes the first PhD in Holography at the Royal College of Art, researching optical reduction: enlarging and reducing images of the human form through complex optical systems on silver-halide materials.' },
  { year: '—', text: 'Awarded the Millennium Fellowship, sponsored by the UK Government Commission.' },
  { year: '—', text: 'Head of the Modern Holography Group, De Montfort University, Leicester.' },
  { year: '2009', text: 'Royal Photographic Society Saxby Medal, for advancing holographic imaging and its science.' },
  { year: '2023', text: 'The Science Museum, London, acquires his entire body of work — over eight hundred holograms — for its permanent collection. Available to view on request.' },
];

export const sitters = [
  'Martin Scorsese',
  'Alan Parker',
  'Sir Peter Blake',
  'Will Self',
  'Auberon Waugh',
  'David Bowie',
];

export const quotes = {
  bowie: {
    text: 'I don’t think I’ve ever quite experienced holograms like these; they really are magnificent. They almost become part of one’s family, and a very disturbing and “otherly” family at that.',
    by: 'David Bowie',
  },
  self: {
    text: 'It’s astonishing; I’m swimming out of the blue eternal, marvellously embodied as a hologram.',
    by: 'Will Self',
    role: 'Novelist and broadcaster',
  },
  blake: {
    // Live site reads "silver sits"; corrected to "silver suits" as an evident typo.
    text: 'One always thinks of the future being out there, with people in silver suits and holograms, when it’s already here.',
    by: 'Sir Peter Blake',
    role: 'Fine artist',
  },
};

export type Work = {
  slug: string;
  title: string;
  kind: 'motion' | 'still' | 'film';
  src: string;
  poster?: string;
  width: number;
  height: number;
  duration?: string;
  alt: string;
  confirm?: boolean;
};

/** Dimensions and durations measured with ffprobe, 2026-09-15. */
const rawWorks: Work[] = [
  { slug: 'geisha-girl', title: 'Geisha Girl', kind: 'motion', src: '/media/video/geisha-girl.mp4', poster: '/media/poster/geisha-girl.jpg', width: 1920, height: 1080, duration: '0:07', alt: 'A young woman speaks in front of a night cityscape where a vast screen shows a geisha’s face.' },
  { slug: 'over-the-rainbow', title: 'Over the Rainbow', kind: 'motion', src: '/media/video/over-the-rainbow.mp4', poster: '/media/poster/over-the-rainbow.jpg', width: 640, height: 480, duration: '0:08', alt: 'A woman lifts torn, glowing fragments of imagery across her face against a painted landscape.' },
  { slug: 'electra-amy', title: 'Electra (Amy)', kind: 'motion', src: '/media/video/electra-amy.mp4', poster: '/media/poster/electra-amy.jpg', width: 640, height: 480, duration: '0:08', alt: 'Close portrait of a woman in profile holding a folded reflective form beside her eye.' },
  { slug: 'bomb-amy', title: 'Bomb (Amy)', kind: 'motion', src: '/media/video/bomb-amy.mp4', poster: '/media/poster/bomb-amy.jpg', width: 640, height: 480, duration: '0:08', alt: 'A woman in a low-backed black dress seen from behind, an Eye of Horus tattoo between her shoulders.' },
  { slug: 'chapter-6-fig-9', title: 'Chapter 6, Fig. 9', kind: 'motion', src: '/media/video/chapter-6-fig-9.mp4', poster: '/media/poster/chapter-6-fig-9.jpg', width: 640, height: 480, duration: '0:08', alt: 'A robot figure wired to a chair, layered over a man in profile holding a device.' },
  { slug: 'peter-blake', title: 'Sir Peter Blake', kind: 'motion', src: '/media/video/peter-blake.mp4', poster: '/media/poster/peter-blake.jpg', width: 248, height: 332, duration: '0:03', alt: 'Portrait of a bearded man lit from the side against black, one finger raised to his temple.' },
  { slug: 'digital-dreams-02', title: 'Digital Dreams 02', kind: 'still', src: '/media/img/digital-dreams-02.jpg', width: 390, height: 219, alt: 'A rendered head resting on a hand, lying on a receding wireframe grid.' },
  { slug: 'cast-on-pastels', title: 'Cast on Pastels', kind: 'still', src: '/media/img/still-cast-pastels.jpg', width: 390, height: 219, alt: 'A cast of an infant’s face set in a box of soft pastels, gloved hands either side.', confirm: true },
  { slug: 'colour-chart', title: 'Objects on a Colour Chart', kind: 'still', src: '/media/img/still-colour-chart.jpg', width: 390, height: 219, alt: 'A brass key, a carved figure and a pin-up card laid over a photographic colour chart.', confirm: true },
  { slug: 'studio-reel', title: 'Studio Reel', kind: 'film', src: '/media/video/studio-film.mp4', poster: '/media/poster/studio-film.jpg', width: 848, height: 478, duration: '2:13', alt: 'A woman peers through a magnifying lens over a vintage typewriter against a blue backdrop.', confirm: true },
];

export const works: Work[] = rawWorks.map((w) => ({ ...w, src: url(w.src), poster: w.poster && url(w.poster) }));

export const bowieFilm = {
  title: 'David Bowie — Holographic Portrait',
  src: url('/media/video/bowie-film-720p.mp4'),
  poster: url('/media/poster/bowie-film.jpg'),
  width: 1280,
  height: 720,
  duration: '3:54',
};

export type Publication = { title: string; kind: 'Book' | 'Article'; note?: string; href?: string };

/** Nine books and one article, as listed on the live site. */
export const publications: Publication[] = [
  { title: 'Vacant Solitudes', kind: 'Book' },
  { title: 'Space Bomb', kind: 'Book', note: 'Published 2004. A body of holographic work by Martin Richardson.' },
  { title: 'Photography Bewitched', kind: 'Book' },
  { title: '2D 3D 4D', kind: 'Book', note: 'Collected artwork, 1975–2012.' },
  { title: 'Modern Holographic', kind: 'Book' },
  { title: 'Hologram Principles', kind: 'Book' },
  { title: 'Android Heart', kind: 'Book' },
  { title: 'Techniques and Principles', kind: 'Book' },
  { title: 'Time, Space and Movement', kind: 'Book' },
  { title: 'The Most Perfect Imaging Medium Ever Made?', kind: 'Article', note: 'On the six holograms Richardson made of Martin Scorsese.', href: 'https://www.nobelprize.org/stories/holograms/' },
];
