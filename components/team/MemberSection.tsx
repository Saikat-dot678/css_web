import type { Member } from "@/types/member";
import { MemberCard } from "./MemberCard";

export function MemberSection({ kicker, title, copy, members, office = false }: { kicker: string; title: string; copy: string; members: Member[]; office?: boolean }) {
  if (!members.length) return null;
  return <section className="member-section wrap"><div className="member-section-head"><p className="kicker">{kicker}</p><div><h2>{title}</h2><p>{copy}</p></div><span>{members.length} people</span></div><div className={`member-grid ${office ? "office-grid" : ""}`}>{members.map((member) => <MemberCard member={member} office={office} key={member.id} />)}</div></section>;
}
