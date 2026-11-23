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
// (jpg/png/webp all work) and update the path.
export const profiles: Record<
  Mode,
  { label: string; photo: string; tagline: string; bio: string[]; writingTitle: string }
> = {
  professional: {
    label: 'Professional',
    photo: 'images/professional.svg',
    tagline: 'Senior Data Scientist & AI Engineer',
    bio: [
      'I build at the intersection of data, AI systems, and workflow automation, helping teams move beyond AI demos to systems that hold up in production.',
      'Lately that means integrating LLMs into real data pipelines, evaluating model outputs rigorously, and designing agentic systems that are useful and reliable. I care less about any single tool and more about making sound judgment calls and shipping.',
    ],
    writingTitle: 'Writing',
  },
  personal: {
    label: 'Personal',
    photo: 'images/personal.jpg',
    tagline: 'Bay Area. Curious about most things.',
    bio: [
      // ✏️ Replace these two lines with something that sounds like you off the clock.
      'This is the personal side: what I read, where I wander, and whatever I’m thinking about when I’m not building things.',
      'Swap this paragraph for a line or two about your life outside work: hobbies, places, books, food, anything.',
    ],
    writingTitle: 'Notes',
  },
};
