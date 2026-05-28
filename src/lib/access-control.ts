export type AccessRole = "owner" | "manager" | "cashier";

export type Permission =
  | "pos.sell"
  | "pos.refund"
  | "inventory.view"
  | "inventory.adjust"
  | "operations.manage"
  | "reports.view"
  | "settings.manage"
  | "staff.manage";

export const roleLabels: Record<AccessRole, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
};

export const roleDescriptions: Record<AccessRole, string> = {
  owner: "Full business control, billing, staff, settings, reports, and all approvals.",
  manager: "Runs daily operations, approves refunds/transfers, manages inventory and shifts.",
  cashier: "Can sell, scan products, print receipts, and manage their own open shift.",
};

export const rolePermissions: Record<AccessRole, Permission[]> = {
  owner: [
    "pos.sell",
    "pos.refund",
    "inventory.view",
    "inventory.adjust",
    "operations.manage",
    "reports.view",
    "settings.manage",
    "staff.manage",
  ],
  manager: [
    "pos.sell",
    "pos.refund",
    "inventory.view",
    "inventory.adjust",
    "operations.manage",
    "reports.view",
  ],
  cashier: ["pos.sell", "inventory.view"],
};

export function can(role: AccessRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
