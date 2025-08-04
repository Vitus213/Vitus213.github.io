import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Samuka007's Blog",
  EMAIL: "samuka007@dragonos.org",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 3,
  NUM_EDUCATIONS_ON_HOMEPAGE: 3,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "You'll hate me more than I'll miss you.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Where I have worked and what I have done.",
};

export const EDUCATION: Metadata = {
  TITLE: "Education",
  DESCRIPTION: "Where I have studied and what I have learned.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "A collection of my projects, with links to repositories and demos.",
};

export const SOCIALS: Socials = [
  // { 
  //   NAME: "twitter-x",
  //   HREF: "https://twitter.com/markhorn_dev",
  // },
  { 
    NAME: "GitHub",
    HREF: "https://github.com/Samuka007",
  },
  { 
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/Samuka007",
  }
];
