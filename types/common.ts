export type EntityId = string;

export interface BaseEntity {
  id: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface LinkItem {
  label: string;
  url: string;
}
