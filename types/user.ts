export const ROLES = [
  "super_admin",
  "administrator",
  "inventory_manager",
  "order_manager",
  "accountant",
] as const;
export type Role = (typeof ROLES)[number];

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isDemo: boolean;
}
