export type AddDraftResult = { kind: "add"; name: string } | { kind: "close" };

export function commitAddDraft(draft: string): AddDraftResult {
  const name = draft.trim();
  if (!name) return { kind: "close" };
  return { kind: "add", name };
}
