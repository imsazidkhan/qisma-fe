export type GroupActivityPerson = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
};

/** Server may add new snake_case event types over time — treat as opaque string. */
export type GroupActivityType = string;

export type GroupActivityItem = {
  id: string;
  type: GroupActivityType;
  createdAt: string;
  actor: GroupActivityPerson | null;
  subject: GroupActivityPerson | null;
  payload?: unknown;
};
