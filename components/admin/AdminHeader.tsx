export function AdminHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <header className="admin-top"><div><p>CSS / Content Desk</p><h1>{title}</h1><span>{description}</span></div><div>{actions}</div></header>;
}
