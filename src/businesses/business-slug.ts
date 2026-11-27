export function slugifyBusinessName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "business";
}

export function nextBusinessSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) {
    return base;
  }
  let n = 2;
  while (existing.has(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}
