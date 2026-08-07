import Image from "next/image";
import type { Faculty } from "@/types/member";

export function FacultyCard({ faculty }: { faculty: Faculty }) {
  return <article className="faculty-card-new"><div className="faculty-photo"><Image className="image-fill" src={faculty.photo} alt={faculty.name} width={400} height={400} unoptimized={faculty.photo.startsWith("/api/")} /></div><div><h3>{faculty.name}</h3><strong>{faculty.role}</strong><p>{faculty.department}</p><nav>{faculty.email && <a href={`mailto:${faculty.email}`}>Email ↗</a>}{faculty.profileUrl && <a href={faculty.profileUrl}>Department profile ↗</a>}</nav></div></article>;
}
