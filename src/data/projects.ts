import type { Mode } from '../config';

export type Project = {
  title: string;
  description: string;
  href: string;
  // Small label in the card's corner, e.g. 'Live demo', 'Prototype', 'Acquired'.
  tag?: string;
  // Language / stack shown under the description.
  stack?: string;
  // Leave out to show on both sides; set to 'personal' for side projects only friends care about.
  mode?: Mode;
};

// Order here = order on the page. Put your favourites first.
export const projects: Project[] = [
  {
    title: 'llm-eval',
    description:
      'Python CLI and library for evaluating LLM outputs in production, with a position-bias-mitigated LLM-as-judge.',
    href: 'https://github.com/apoorv-shrivastav/llm-eval',
    stack: 'Python',
    tag: 'Open source',
  },
  {
    title: 'Pramatix',
    description:
      'Agentic experimentation platform for AI features: Designer, Analyst, Critic and Communicator agents with real statistical depth.',
    href: 'https://agentic-experimentation-platform.vercel.app',
    stack: 'Python',
    tag: 'Live demo',
  },
  {
    title: 'polycode',
    description:
      'Orchestration layer for AI coding CLIs with an enforced plan → implement → review workflow, policy controls and budgets.',
    href: 'https://github.com/apoorv-shrivastav/polycode',
    stack: 'TypeScript',
  },
  {
    title: 'Multi-Agent Workflow Platform',
    description:
      'LangGraph supervisor/worker system that routes work across domains with RBAC, human approvals and observability.',
    href: 'https://github.com/apoorv-shrivastav/multi-agent-project',
    stack: 'Python · LangGraph',
  },
  {
    title: 'agent-station',
    description:
      'Mission control for AI agents: a local-first platform with a gateway, catalog and observability.',
    href: 'https://github.com/apoorv-shrivastav/agent-station',
    stack: 'Python',
  },
  {
    title: 'rag-pipeline',
    description:
      'A production-shaped RAG pipeline with hybrid retrieval, reranking and built-in evaluation.',
    href: 'https://github.com/apoorv-shrivastav/rag-pipeline',
    stack: 'Python',
  },
  {
    title: 'GhostWriter',
    description:
      'Chrome extension that flags likely AI-generated posts in your LinkedIn feed, with probability scores and explanations.',
    href: 'https://github.com/apoorv-shrivastav/GhostWriter',
    stack: 'JavaScript',
    tag: 'Extension',
  },
  {
    title: 'AI Personal Assistant',
    description:
      'Android app that reads your notifications and turns them into concise briefings, suggested actions and usage analytics.',
    href: 'https://github.com/apoorv-shrivastav/AI_personal_assistant',
    stack: 'Kotlin',
    tag: 'Android',
  },
];
