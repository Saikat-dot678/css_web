import { promises as fs } from "node:fs";
import path from "node:path";
import type { DatabaseShape } from "../types/database";
import type { Event } from "../types/event";
import type { FormField, RegistrationForm } from "../types/forms";
import type { AcademicGroup, Member, PreviousCommittee } from "../types/member";

const stamp = "2026-08-07T12:00:00.000Z";
const base = (id: string) => ({ id, createdAt: stamp, updatedAt: stamp });

const field = (
  id: string,
  type: FormField["type"],
  label: string,
  order: number,
  required = false,
  options?: string[],
): FormField => ({ id, type, label, order, required, options });

const event = (
  id: string,
  value: Omit<Event, "id" | "createdAt" | "updatedAt" | "poster">,
): Event => ({ ...base(id), ...value, poster: `/api/posters/${value.slug}` });

const events: Event[] = [
  event("event-resume-rewired", {
    slug: "resume-rewired",
    title: "Resume Rewired",
    category: "Career",
    status: "registration_open",
    date: "2026-09-18",
    startTime: "18:00",
    endTime: "20:00",
    venue: "CSE Seminar Hall",
    shortDescription: "A practical review room for technical resumes.",
    fullDescription:
      "Bring a draft. Leave with clearer project bullets, a stronger hierarchy, and an honest sense of what recruiters actually read.",
    registrationOpen: true,
    registrationDeadline: "2026-09-17T23:59",
    eligibility: "All CSE students",
    entryFee: "Free",
    featured: true,
    speakers: [],
    schedule: [
      { time: "17:30", title: "Check-in" },
      { time: "18:00", title: "Resume teardown" },
      { time: "19:10", title: "Peer review" },
      { time: "19:45", title: "Closing notes" },
    ],
    registrationFormId: "form-resume-rewired",
    gallery: [],
    resources: [],
    results: [],
  }),
  event("event-build-night", {
    slug: "build-night",
    title: "Build Night",
    category: "Open source",
    status: "upcoming",
    date: "2026-10-02",
    startTime: "18:30",
    endTime: "21:30",
    venue: "CSE Labs",
    shortDescription: "Half-finished projects are welcome.",
    fullDescription:
      "A working evening for prototypes, patches, and useful experiments. Come with an idea or join someone else’s table.",
    registrationOpen: false,
    registrationDeadline: "2026-10-01T23:59",
    eligibility: "CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [
      { time: "18:30", title: "Project pitches" },
      { time: "19:00", title: "Build session" },
      { time: "21:00", title: "Demos" },
    ],
    registrationFormId: "form-build-night",
    gallery: [],
    resources: [],
    results: [],
  }),
  event("event-cse-connect", {
    slug: "cse-connect",
    title: "CSE Connect",
    category: "Community",
    status: "save_the_date",
    date: "2026-10-16",
    startTime: "17:30",
    endTime: "20:00",
    venue: "Main Auditorium",
    shortDescription: "One room, many possible paths.",
    fullDescription:
      "Students, faculty, seniors, and alumni discuss research, internships, careers, and the strange parts nobody puts in a roadmap.",
    registrationOpen: false,
    registrationDeadline: "2026-10-15T23:59",
    eligibility: "All CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [],
    registrationFormId: "form-cse-connect",
    gallery: [],
    resources: [],
    results: [],
  }),
  event("event-code-relay", {
    slug: "code-relay",
    title: "Code Relay",
    category: "Competition",
    status: "registration_open",
    date: "2026-11-06",
    startTime: "17:00",
    endTime: "20:00",
    venue: "CSE Labs",
    shortDescription: "Algorithms under pressure—without the usual solo grind.",
    fullDescription:
      "A team programming relay where every round changes the problem, the constraint, or the person at the keyboard.",
    registrationOpen: true,
    registrationDeadline: "2026-11-05T22:00",
    eligibility: "Teams of 2–4 CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [],
    registrationFormId: "form-code-relay",
    gallery: [],
    resources: [],
    results: [],
  }),
  event("event-paper-trail", {
    slug: "paper-trail",
    title: "Paper Trail",
    category: "Research",
    status: "upcoming",
    date: "2026-11-21",
    startTime: "16:30",
    endTime: "18:30",
    venue: "CSE Seminar Hall",
    shortDescription: "Read one paper properly.",
    fullDescription:
      "A faculty-guided reading room for understanding claims, methods, evidence, and what to question before accepting a result.",
    registrationOpen: false,
    registrationDeadline: "2026-11-20T20:00",
    eligibility: "All CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [],
    registrationFormId: "form-paper-trail",
    gallery: [],
    resources: [],
    results: [],
  }),
  event("event-mock-interview-lab", {
    slug: "mock-interview-lab",
    title: "Mock Interview Lab",
    category: "Placements",
    status: "registration_open",
    date: "2026-12-05",
    startTime: "10:00",
    endTime: "16:00",
    venue: "CSE Department",
    shortDescription: "Practice before the real thing.",
    fullDescription:
      "Technical and behavioural rounds with structured peer feedback, question notes, and a second attempt.",
    registrationOpen: true,
    registrationDeadline: "2026-12-03T23:59",
    eligibility: "Pre-final and final-year CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [],
    registrationFormId: "form-mock-interview-lab",
    gallery: [],
    resources: [],
    results: [],
  }),
  event("event-open-source-kickoff", {
    slug: "open-source-kickoff",
    title: "Open Source Kickoff",
    category: "Technical",
    status: "past",
    date: "2026-03-14",
    startTime: "16:00",
    endTime: "18:15",
    venue: "CSE Labs",
    shortDescription: "Your first contribution does not need to be dramatic.",
    fullDescription:
      "A beginner-friendly session on finding repositories, reading issue trackers, communicating with maintainers, and making a clean first contribution.",
    registrationOpen: false,
    registrationDeadline: "2026-03-13T23:59",
    eligibility: "All CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [
      { time: "16:00", title: "Finding a repository" },
      { time: "16:45", title: "Issues and pull requests" },
      { time: "17:30", title: "Contribution sprint" },
    ],
    recap:
      "Students worked through contribution workflows and prepared beginner pull requests in small groups.",
    attendance: "96 students",
    gallery: [],
    resources: [{ label: "Contribution checklist", url: "#" }],
    results: [],
  }),
  event("event-higher-studies-roadmap", {
    slug: "higher-studies-roadmap",
    title: "Higher Studies Roadmap",
    category: "Research",
    status: "past",
    date: "2026-02-07",
    startTime: "17:00",
    endTime: "19:00",
    venue: "CSE Seminar Hall",
    shortDescription: "MS, PhD, GATE, research—or still deciding.",
    fullDescription:
      "A discussion on graduate study routes, research preparation, applications, recommendation letters, and realistic timelines.",
    registrationOpen: false,
    registrationDeadline: "2026-02-06T23:59",
    eligibility: "All CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [],
    recap:
      "The session compared multiple higher-study routes and collected a shared resource list for future applicants.",
    attendance: "112 students",
    gallery: [],
    resources: [{ label: "Starting points", url: "#" }],
    results: [],
  }),
  event("event-alumni-connect-2025", {
    slug: "alumni-connect-2025",
    title: "CSE Alumni Connect",
    category: "Community",
    status: "past",
    date: "2025-11-15",
    startTime: "17:30",
    endTime: "20:00",
    venue: "Main Auditorium",
    shortDescription: "Paths after Durgapur, told without the polished version.",
    fullDescription:
      "Alumni spoke with students about early-career choices, graduate school, switching domains, and lessons they wished they had known earlier.",
    registrationOpen: false,
    registrationDeadline: "2025-11-14T23:59",
    eligibility: "All CSE students",
    entryFee: "Free",
    featured: false,
    speakers: [],
    schedule: [],
    recap: "An open conversation between students and alumni followed by small-group networking.",
    attendance: "124 students",
    gallery: [],
    resources: [],
    results: [],
  }),
];

const registrationForms: RegistrationForm[] = [
  {
    ...base("form-resume-rewired"),
    eventId: "event-resume-rewired",
    title: "Resume Rewired registration",
    fields: [
      field("name", "shortText", "Full name", 0, true),
      field("email", "email", "Institute email", 1, true),
      field("year", "dropdown", "Year of study", 2, true, [
        "First",
        "Second",
        "Third",
        "Fourth",
        "M.Tech",
        "PhD",
      ]),
      field("resume", "file", "Resume PDF", 3),
      field("goal", "longText", "What should this session help you fix?", 4),
      field("consent", "consent", "I consent to CSS using this response for event coordination.", 5, true),
    ],
  },
  {
    ...base("form-build-night"),
    eventId: "event-build-night",
    title: "Build Night registration",
    fields: [
      field("name", "shortText", "Full name", 0, true),
      field("email", "email", "Institute email", 1, true),
      field("idea", "longText", "What do you want to work on?", 2, true),
    ],
  },
  {
    ...base("form-cse-connect"),
    eventId: "event-cse-connect",
    title: "CSE Connect registration",
    fields: [field("name", "shortText", "Full name", 0, true), field("email", "email", "Email", 1, true)],
  },
  {
    ...base("form-code-relay"),
    eventId: "event-code-relay",
    title: "Code Relay registration",
    fields: [
      field("team", "shortText", "Team name", 0, true),
      field("lead", "email", "Team lead email", 1, true),
      field("members", "longText", "Members and roll numbers", 2, true),
    ],
  },
  {
    ...base("form-paper-trail"),
    eventId: "event-paper-trail",
    title: "Paper Trail registration",
    fields: [
      field("name", "shortText", "Full name", 0, true),
      field("area", "dropdown", "Interest area", 1, true, ["AI / ML", "Systems", "Security", "Theory", "Networks"]),
    ],
  },
  {
    ...base("form-mock-interview-lab"),
    eventId: "event-mock-interview-lab",
    title: "Mock Interview Lab registration",
    fields: [
      field("name", "shortText", "Full name", 0, true),
      field("email", "email", "Email", 1, true),
      field("track", "dropdown", "Preferred track", 2, true, ["Software", "Data / ML", "Security", "Product"]),
    ],
  },
];

const workingGroups = ["Technical", "Design", "Events", "PR & Content", "Operations"];
const officeRoles = [
  "President",
  "Vice President",
  "General Secretary",
  "Technical Secretary",
  "Design Secretary",
  "Event Secretary",
];

function memberGroup(index: number, total: number): AcademicGroup {
  if (index <= 6) return "office_bearer";
  const remaining = total - 6;
  const postgraduate = total >= 32 ? 6 : Math.max(2, Math.round(remaining * 0.18));
  const undergraduate = remaining - postgraduate;
  const thirdCount = Math.ceil(undergraduate / 2);
  if (index <= 6 + thirdCount) return "third_year";
  if (index <= 6 + undergraduate) return "second_year";
  return (index - (6 + undergraduate)) % 2 === 1 ? "mtech" : "phd";
}

function makeMembers(total: number, academicYear: string, prefix: string): Member[] {
  return Array.from({ length: total }, (_, offset) => {
    const index = offset + 1;
    const academicGroup = memberGroup(index, total);
    const isOffice = academicGroup === "office_bearer";
    const suffix = String(index).padStart(2, "0");
    const id = `${academicYear.replace("-", "")}-${suffix}`;
    const programme = ["office_bearer", "third_year", "second_year"].includes(academicGroup)
      ? "B.Tech CSE"
      : academicGroup === "mtech"
        ? "M.Tech CSE"
        : "PhD CSE";
    return {
      ...base(id),
      name: `${prefix} ${suffix}`,
      photo: `/api/avatars/${id}`,
      role: isOffice ? officeRoles[offset] : "Member",
      programme,
      academicGroup,
      workingGroup: isOffice ? "Office bearers" : workingGroups[(offset - 6) % workingGroups.length],
      academicYear,
      linkedin: "https://www.linkedin.com/",
      instagram: "https://www.instagram.com/",
      facebook: "https://www.facebook.com/",
    };
  });
}

const currentMembers = makeMembers(36, "2026-27", "Member");
const archiveMembers = [
  ...makeMembers(32, "2025-26", "Previous Member"),
  ...makeMembers(28, "2024-25", "Previous Member"),
  ...makeMembers(24, "2023-24", "Founding Member"),
];

const previousCommittees: PreviousCommittee[] = [
  ["2025-26", 32, ["Expanded peer-learning sessions", "Documented event handover notes"]],
  ["2024-25", 28, ["Strengthened the department event calendar", "Built the first shared resource index"]],
  ["2023-24", 24, ["Founded the CSE Students’ Society", "Established the first working groups"]],
].map(([academicYear, count, contributionHighlights]) => ({
  ...base(`committee-${academicYear}`),
  academicYear: String(academicYear),
  memberIds: archiveMembers
    .filter((member) => member.academicYear === academicYear)
    .slice(0, Number(count))
    .map((member) => member.id),
  contributionHighlights: contributionHighlights as string[],
}));

const database: DatabaseShape = {
  events,
  members: [...currentMembers, ...archiveMembers],
  faculty: [
    {
      ...base("faculty-1"),
      name: "Faculty Name 1",
      photo: "/api/avatars/faculty-1",
      role: "Faculty Coordinator",
      department: "Department of Computer Science & Engineering, NIT Durgapur",
      email: "faculty@nitdgp.ac.in",
      profileUrl: "#",
    },
    {
      ...base("faculty-2"),
      name: "Faculty Name 2",
      photo: "/api/avatars/faculty-2",
      role: "Faculty Mentor",
      department: "Department of Computer Science & Engineering, NIT Durgapur",
      email: "faculty@nitdgp.ac.in",
      profileUrl: "#",
    },
  ],
  projects: [
    {
      ...base("project-event-archive"),
      slug: "department-event-archive",
      title: "Department Event Archive",
      description: "A searchable record of events, posters, recaps, speakers, and post-event material.",
      status: "active",
      technologies: ["Next.js", "Archive"],
      contributors: [],
      githubUrl: "#",
      acceptingContributors: true,
      owner: "Technical Team",
      academicYear: "2026-27",
    },
    {
      ...base("project-resource-index"),
      slug: "student-resource-index",
      title: "Student Resource Index",
      description: "One practical directory for department links, internship notes, placement resources, and research guides.",
      status: "active",
      technologies: ["Content", "Search"],
      contributors: [],
      acceptingContributors: true,
      owner: "PR & Content",
      academicYear: "2026-27",
    },
    {
      ...base("project-starter-kit"),
      slug: "cse-starter-kit",
      title: "CSE Starter Kit",
      description: "A first-week guide to labs, people, tools, communities, and useful department routines.",
      status: "planning",
      technologies: ["Guide", "Design"],
      contributors: [],
      acceptingContributors: false,
      owner: "Design Team",
      academicYear: "2026-27",
    },
    {
      ...base("project-contribution-map"),
      slug: "open-source-contribution-map",
      title: "Open-source Contribution Map",
      description: "A map of student repositories, active maintainers, contribution opportunities, and beginner-friendly issues.",
      status: "planning",
      technologies: ["Open source", "Community"],
      contributors: [],
      githubUrl: "#",
      acceptingContributors: true,
      owner: "Technical Team",
      academicYear: "2026-27",
    },
  ],
  resources: [
    ["resource-1", "Summer research shortlist", "Programs, labs, and application windows relevant to undergraduate CSE students.", "internships", "Updated 2 days ago", "2026-12-31"],
    ["resource-2", "Resume and interview notes", "Department-specific preparation notes, checklists, and practice material.", "placements", "12 resources", "2027-06-30"],
    ["resource-3", "How to approach a faculty member", "A concise guide to reading a professor’s work and writing a useful first email.", "research", "5 min read", "2027-06-30"],
    ["resource-4", "Useful links for every batch", "Webmail, Moodle, academic portals, department contacts, forms, and internal references.", "department", "Open index", "2027-06-30"],
    ["resource-5", "Contest practice ladder", "A progressive practice set curated by students across batches.", "competitive_programming", "30 problems", "2027-06-30"],
    ["resource-6", "Graduate school starting points", "Foundational reading for MS, PhD, GATE, and research-focused career paths.", "higher_studies", "8 guides", "2027-06-30"],
    ["resource-7", "First contribution checklist", "How to choose a repository, communicate with maintainers, and submit a clean pull request.", "technical_resources", "Updated weekly", "2027-06-30"],
    ["resource-8", "Winter hackathon applications", "An archived opportunity retained so expired deadlines remain distinguishable.", "hackathons", "Expired", "2026-01-15"],
  ].map(([id, title, description, category, meta, expiryDate], index) => ({
    ...base(String(id)),
    title: String(title),
    description: String(description),
    category: category as DatabaseShape["resources"][number]["category"],
    url: "#",
    deadline: expiryDate,
    eligibility: "CSE students",
    featured: index === 0,
    expiryDate: String(expiryDate),
    meta: String(meta),
  })),
  achievements: [
    ["achievement-1", "2026", "New office bearers begin the 2026–27 term", "A new committee takes responsibility for the society’s next academic cycle.", "Society milestone"],
    ["achievement-2", "2026", "30+ students across six working groups", "Leadership, technical, design, events, content, and operations work in one visible structure.", "Community"],
    ["achievement-3", "2025", "Career and resume development sessions", "Practical sessions focused on applications, communication, and career readiness.", "Student support"],
    ["achievement-4", "2025", "Technical workshops and peer learning", "Student-led sessions make technical topics more approachable across batches.", "Academic"],
    ["achievement-5", "2024", "Department community initiatives expand", "Events increasingly connect students, faculty members, seniors, and alumni.", "Community"],
    ["achievement-6", "2023", "CSE Students’ Society founded", "CSS begins as the official Computer Science and Engineering society of NIT Durgapur.", "Foundation"],
  ].map(([id, year, title, description, category]) => ({
    ...base(id), year, title, description, category,
  })),
  announcements: [
    { ...base("announcement-1"), title: "Registration open", content: "Registration open for Resume Rewired", pinned: true, published: true },
    { ...base("announcement-2"), title: "Build Night", content: "Build Night project pitches are open", pinned: false, published: true },
    { ...base("announcement-3"), title: "Recruitment", content: "CSS team recruitment starts next month", pinned: false, published: true },
  ],
  registrationForms,
  registrations: [
    {
      ...base("registration-demo"),
      eventId: "event-resume-rewired",
      eventSlug: "resume-rewired",
      name: "Demo Student",
      email: "demo@student.nitdgp.ac.in",
      answers: { name: "Demo Student", email: "demo@student.nitdgp.ac.in", year: "Third", goal: "Improve project descriptions.", consent: "Yes" },
      submittedAt: stamp,
    },
  ],
  previousCommittees,
  siteContent: {
    heroHeadline: "A department society for people who make things happen.",
    heroDescription: "The CSE Students’ Society connects students with useful work: workshops, projects, representation, opportunities, and each other.",
    recruitmentText: "Join a working group, volunteer for an event, or propose something the department should have.",
    recruitmentOpen: true,
    currentAcademicYear: "2026-27",
  },
};

const output = path.join(process.cwd(), "data", "db.json");
async function main() {
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  console.info(`Seeded ${output}`);
  console.info(`${database.events.length} events, ${database.members.length} committee records, ${database.projects.length} projects.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
