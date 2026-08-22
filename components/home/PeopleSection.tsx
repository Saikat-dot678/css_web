import Image from "next/image";
import Link from "next/link";

import type { Faculty, Member } from "@/types/member";

const groupOrder = ["office_bearer", "third_year", "second_year", "mtech", "phd"] as const;
const groupNames: Record<string, string> = {
  office_bearer: "Office Bearers",
  third_year: "Third Year",
  second_year: "Second Year",
  mtech: "M.Tech",
  phd: "PhD",
};

export function PeopleSection({ members, faculty }: { members: Member[]; faculty: Faculty[] }) {
  const groups = groupOrder
    .map((key) => ({ key, label: groupNames[key], count: members.filter((member) => member.academicGroup === key).length }))
    .filter((group) => group.count > 0);
  const photoMembers = members.filter((member) => member.photo).slice(0, 4);

  return (
    <div className="people-v4-grid">
      <div className="people-number">
        {!!photoMembers.length && (
          <div className="people-photo-stack" aria-label="CSS member portraits">
            {photoMembers.map((member) => (
              <figure key={member.id}>
                <Image src={member.photo} alt={member.name} fill sizes="(max-width: 760px) 34vw, 160px" unoptimized={member.photo.startsWith("/api/") || member.photo.endsWith(".svg")} />
                <figcaption>{member.name}<span>{member.role}</span></figcaption>
              </figure>
            ))}
          </div>
        )}
        <strong>{String(members.length).padStart(2, "0")}</strong>
        <span>CURRENT MEMBERS</span>
        <p>Different batches and working groups, one shared department community.</p>
        <Link className="v4-button v4-button-light" href="/team">Meet the team ↗</Link>
      </div>

      <div className="people-groups">
        {groups.map((group, index) => (
          <Link className="people-group-row" href="/team" key={group.key}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{group.label}</strong>
            <em>{group.count} people</em>
            <b>↗</b>
          </Link>
        ))}
      </div>

      <div className="faculty-v4" id="faculty">
        <p className="faculty-v4-label">FACULTY / CONTINUITY</p>
        <div className="faculty-v4-list">
          {faculty.slice(0, 3).map((person, index) => (
            <article key={person.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{person.name}</strong>
                <p>{person.role}</p>
                <small>{person.department}</small>
              </div>
              {person.profileUrl && <a href={person.profileUrl} target="_blank" rel="noreferrer">PROFILE ↗</a>}
            </article>
          ))}
          {!faculty.length && (
            <article>
              <span>01</span>
              <div>
                <strong>Faculty coordinators</strong>
                <p>Add the real faculty records from the admin panel.</p>
                <small>Department of Computer Science and Engineering</small>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
