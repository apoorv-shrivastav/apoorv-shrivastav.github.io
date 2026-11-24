// ─────────────────────────────────────────────────────────────
//  Everything about *you* lives in this file.
//  Edit the text here; the pages pick it up automatically.
// ─────────────────────────────────────────────────────────────

export type Mode = 'professional' | 'personal';
export const MODES: Mode[] = ['professional', 'personal'];
export const DEFAULT_MODE: Mode = 'professional';

export const site = {
  name: 'Apoorv Shrivastava',
  shortName: 'Apoorv',
  // Used for <title> and link previews.
  description:
    'Senior Data Scientist & AI Engineer in the Bay Area building production AI systems, agentic workflows, and data products.',
  location: 'Bay Area, CA',
};

export const links = [
  { label: 'GitHub', href: 'https://github.com/apoorv-shrivastav' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/apoorv-shrivastava/' },
  { label: 'Email', href: 'mailto:apoorv.shrivastv@gmail.com' },
];

// What changes when someone flips the toggle.
// `photo` is a path inside /public. Drop your own image in public/images/
// (jpg/png/webp all work) and update the path. Both sides can share one photo:
// the professional side shows it in black & white, the personal side as a polaroid.
type Profile = {
  label: string;
  photo: string;
  tagline: string;
  bio: string[];
  writingTitle: string;
  focus?: string[]; // chips under the bio
  toolbox?: string[]; // the "Toolbox" row
  photoBadge?: string; // small label on the professional photo
  photoCaption?: string; // handwritten caption on the polaroid
  switchHint: string; // the little "flip to the other side" link
};

export const profiles: Record<Mode, Profile> = {
  professional: {
    label: 'Professional',
    photo: 'images/photo.jpg',
    photoBadge: 'Bay Area, CA',
    tagline: 'Senior Data Scientist & AI Engineer',
    bio: [
      'I’m a data scientist who ended up building AI systems. These days that mostly means getting LLMs to behave in production: plugging them into real data pipelines, checking their answers properly, and building agents that do something useful without falling over.',
      'I mostly work in Python and SQL, with some TypeScript when a project needs a front end. I write here about what I’m learning, mostly evals, retrieval and agents.',
    ],
    focus: ['AI systems in production', 'LLM evaluation', 'Agentic workflows', 'RAG', 'Context engineering'],
    toolbox: ['Python', 'SQL', 'TypeScript', 'React', 'LangGraph', 'OpenAI & Anthropic APIs', 'AWS'],
    switchHint: 'Off the clock? See the personal side →',
    writingTitle: 'Writing',
  },
  personal: {
    label: 'Personal',
    photo: 'images/photo.jpg',
    photoCaption: 'Golden Gate, SF',
    switchHint: '← back to the work stuff',
    tagline: 'Bay Area. Curious about most things.',
    bio: [
      // ✏️ Replace these two lines with something that sounds like you off the clock.
      'This is the personal side: what I read, where I wander, and whatever I’m thinking about when I’m not building things.',
      'Swap this paragraph for a line or two about your life outside work: hobbies, places, books, food, anything.',
    ],
    writingTitle: 'Notes',
  },
};
