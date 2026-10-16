import { SNAPSHOT_AT } from "@/lib/oslo";
import { emptyWeek, type VerdiWeek } from "@/lib/verdi/model";

export function fixtureVerdi(now = SNAPSHOT_AT): VerdiWeek {
  return emptyWeek(now);
}
