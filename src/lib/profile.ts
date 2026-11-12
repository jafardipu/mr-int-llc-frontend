export function profileInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "U";
}

export function profileRoleLabel(role: string) {
  if (role === "retail") return "Retail";
  if (role === "wholesale") return "Wholesale";
  if (role === "admin") return "Admin";
  if (role === "supper_admin") return "Super Admin";
  return role;
}
