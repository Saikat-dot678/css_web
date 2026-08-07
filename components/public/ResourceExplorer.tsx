"use client";

import { useMemo, useState } from "react";
import { resourceCategoryLabel } from "@/lib/utils";
import type { Resource } from "@/types/resource";

export function ResourceExplorer({ resources, today }: { resources: Resource[]; today: string }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => ["All", ...new Set(resources.map((resource) => resource.category))], [resources]);
  const filtered = resources.filter((resource) => (category === "All" || resource.category === category) && `${resource.title} ${resource.description} ${resource.category}`.toLowerCase().includes(search.toLowerCase()));
  return <><section className="resource-controls wrap"><div className="filter-group">{categories.map((item) => <button className={`filter-button ${category === item ? "active" : ""}`} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} key={item}>{item === "All" ? item : resourceCategoryLabel(item)}</button>)}</div><label className="event-search"><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Guide, category, keyword" /></label></section><section className="resource-library wrap">{filtered.map((resource, index) => { const expired = Boolean(resource.expiryDate && resource.expiryDate < today); return <a className={`resource-card reveal ${expired ? "expired-resource" : ""}`} href={resource.url} key={resource.id}><span>{String(index + 1).padStart(2, "0")}</span><em>{resourceCategoryLabel(resource.category)}</em><h2>{resource.title}</h2><p>{resource.description}</p>{expired && <strong className="expired-label">Expired</strong>}<footer><b>{resource.meta || resource.deadline || "Open resource"}</b><i>↗</i></footer></a>; })}{!filtered.length && <div className="empty-state event-card-empty"><strong>No matching resources</strong><p>Try another category or search term.</p></div>}</section></>;
}
