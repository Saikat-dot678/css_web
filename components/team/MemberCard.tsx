import Image from "next/image";
import { academicGroupLabel } from "@/lib/utils";
import type { Member } from "@/types/member";

type SocialKind = "linkedin" | "instagram" | "facebook" | "github" | "email";

function SocialIcon({ kind }: { kind: SocialKind }) {
  const paths: Record<SocialKind, React.ReactNode> = {
    linkedin: <><rect x="3" y="9" width="4" height="12" /><circle cx="5" cy="5" r="2" /><path d="M11 21v-7c0-3 4-4 6-2 1 1 1 2 1 4v5h4v-7c0-6-7-8-11-4V9H7v12z" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="social-fill" /></>,
    facebook: <path d="M14 8h5V3h-5c-4 0-6 3-6 7v3H4v5h4v4h5v-4h5l1-5h-6v-3c0-1 0-2 1-2z" />,
    github: <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.8 9.7.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.2.7-1.5-2.2-.3-4.6-1.1-4.6-5a4 4 0 0 1 1.1-2.8c-.1-.3-.5-1.3.1-2.8 0 0 .9-.3 2.9 1.1a9.8 9.8 0 0 1 5.3 0C17.1 5.7 18 6 18 6c.6 1.5.2 2.5.1 2.8a4 4 0 0 1 1.1 2.8c0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2.1v2.7c0 .3.2.6.7.5 4-1.4 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2z" />,
    email: <><rect x="2.5" y="5" width="19" height="14" /><path d="m3 6 9 7 9-7" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[kind]}</svg>;
}

const socialItems = (member: Member): [string | undefined, SocialKind, string][] => [
  [member.linkedin, "linkedin", "LinkedIn"],
  [member.instagram, "instagram", "Instagram"],
  [member.facebook, "facebook", "Facebook"],
  [member.github, "github", "GitHub"],
  [member.email ? `mailto:${member.email}` : undefined, "email", "Email"],
];

export function MemberCard({ member, office = false }: { member: Member; office?: boolean }) {
  return <article className={`member-card ${office ? "office-member" : ""}`} data-domain={member.workingGroup}>
    <div className="member-photo"><Image className="image-fill" src={member.photo} alt={member.name} width={640} height={520} unoptimized={member.photo.startsWith("/api/")} /></div>
    <div className="member-card-copy"><p className="member-group">{academicGroupLabel(member.academicGroup)}</p><h3>{member.name}</h3><strong>{member.role}</strong><span>{member.programme} · {member.workingGroup}</span><nav className="member-socials" aria-label={`Social links for ${member.name}`}>{socialItems(member).map(([url, kind, label]) => url ? <a href={url} key={label} target={url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" aria-label={`${member.name} on ${label}`}><SocialIcon kind={kind} /></a> : null)}</nav></div>
  </article>;
}
