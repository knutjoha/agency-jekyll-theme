import type { CSSProperties, ReactNode } from "react";
import type { AppPath } from "@/components/shell/navPaths";

const PEOPLE = ["--p-amelia", "--p-hedda", "--p-maja", "--p-knut", "--p-ulla"] as const;
const DAUGHTERS = ["--p-amelia", "--p-hedda", "--p-maja"] as const;

function Bone({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`sk-bone ${className}`.trim()} style={style} />;
}

function Avatar({ token, size }: { token: string; size: number }) {
  return (
    <div
      className="sk-avatar"
      style={{ width: size, height: size, background: `var(${token})` }}
    />
  );
}

function HallwayHeaderBones() {
  return (
    <div className="sk-header-wide">
      <div className="sk-header-copy">
        <Bone style={{ width: 148, height: 12 }} />
        <Bone style={{ width: 280, height: 36, borderRadius: 10 }} />
        <div className="sk-row" style={{ gap: 10 }}>
          <Bone style={{ width: 21, height: 21, borderRadius: "var(--r-full)" }} />
          <Bone style={{ width: 48, height: 18 }} />
          <Bone style={{ width: 120, height: 16 }} />
        </div>
      </div>
      <Bone style={{ width: 72, height: 36, borderRadius: "var(--r-full)" }} />
    </div>
  );
}

function PhoneHeaderBones() {
  return (
    <div className="sk-header-phone">
      <Bone style={{ width: 118, height: 11 }} />
      <Bone style={{ width: 210, height: 26, borderRadius: 8 }} />
      <div className="sk-row" style={{ gap: 8 }}>
        <Bone style={{ width: 16, height: 16, borderRadius: "var(--r-full)" }} />
        <Bone style={{ width: 40, height: 15 }} />
        <Bone style={{ width: 140, height: 13 }} />
      </div>
    </div>
  );
}

function HjemWideSkeleton() {
  return (
    <div className="sk-hjem-wide">
      <div className="sk-hjem-left">
        <div className="sk-tile sk-today">
          <div className="sk-row sk-between">
            <Bone style={{ width: 88, height: 22 }} />
            <Bone style={{ width: 72, height: 14 }} />
          </div>
          {PEOPLE.map((token) => (
            <div key={token} className="sk-person-row">
              <Avatar token={token} size={36} />
              <div className="sk-stack" style={{ flex: 1 }}>
                <Bone style={{ width: "38%", height: 14 }} />
                <Bone style={{ width: "72%", height: 12 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="sk-tile sk-weather">
          <div className="sk-row sk-between">
            <Bone style={{ width: 128, height: 18 }} />
            <Bone style={{ width: 88, height: 12 }} />
          </div>
          <div className="sk-row" style={{ gap: 10 }}>
            <Bone style={{ flex: 1, height: 96, borderRadius: 12 }} />
            <Bone style={{ flex: 1, height: 96, borderRadius: 12 }} />
            <Bone style={{ flex: 1, height: 96, borderRadius: 12 }} />
            <Bone style={{ flex: 1, height: 96, borderRadius: 12 }} />
          </div>
        </div>
      </div>
      <div className="sk-hjem-right">
        <div className="sk-tile sk-dinner">
          <Bone style={{ width: 110, height: 12 }} />
          <Bone style={{ width: "70%", height: 24 }} />
          <Bone style={{ width: "46%", height: 14 }} />
        </div>
        <div className="sk-tile sk-soon">
          <Bone style={{ width: 72, height: 18 }} />
          {[0, 1, 2].map((key) => (
            <div key={key} className="sk-row" style={{ gap: 14 }}>
              <Bone style={{ width: 10, height: 10, borderRadius: "var(--r-full)" }} />
              <Bone style={{ width: 58, height: 14 }} />
              <Bone style={{ flex: 1, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HjemPhoneSkeleton() {
  return (
    <div className="sk-phone">
      <PhoneHeaderBones />
      <div className="sk-row sk-between">
        <Bone style={{ width: 64, height: 18 }} />
        <Bone style={{ width: 72, height: 13 }} />
      </div>
      {PEOPLE.map((token) => (
        <div key={token} className="sk-tile sk-person-card">
          <Avatar token={token} size={38} />
          <div className="sk-stack" style={{ flex: 1 }}>
            <Bone style={{ width: "42%", height: 14 }} />
            <Bone style={{ width: "78%", height: 12 }} />
          </div>
        </div>
      ))}
      <div className="sk-tile sk-weather" style={{ minHeight: 200, padding: 16, gap: 10 }}>
        <div className="sk-row sk-between">
          <Bone style={{ width: 110, height: 16 }} />
          <Bone style={{ width: 72, height: 12 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Bone style={{ height: 88, borderRadius: 12 }} />
          <Bone style={{ height: 88, borderRadius: 12 }} />
          <Bone style={{ height: 88, borderRadius: 12 }} />
          <Bone style={{ height: 88, borderRadius: 12 }} />
        </div>
      </div>
      <div className="sk-tile sk-soon">
        <Bone style={{ width: 64, height: 16 }} />
        {[0, 1, 2].map((key) => (
          <div key={key} className="sk-row" style={{ gap: 14 }}>
            <Bone style={{ width: 10, height: 10, borderRadius: "var(--r-full)" }} />
            <Bone style={{ width: 52, height: 13 }} />
            <Bone style={{ flex: 1, height: 13 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function KalenderWideSkeleton() {
  return (
    <div className="sk-tile sk-calendar">
      <div className="sk-row sk-between">
        <div className="sk-row" style={{ gap: 14 }}>
          <Bone style={{ width: 92, height: 22 }} />
          <Bone style={{ width: 148, height: 14 }} />
        </div>
        <div className="sk-row" style={{ gap: 8 }}>
          <Bone style={{ width: 36, height: 36, borderRadius: "var(--r-nested)" }} />
          <Bone style={{ width: 36, height: 36, borderRadius: "var(--r-nested)" }} />
        </div>
      </div>
      <div className="sk-week-head">
        <div className="sk-lane-label" />
        {Array.from({ length: 7 }, (_, index) => (
          <Bone key={index} style={{ flex: 1, height: 44, borderRadius: "var(--r-nested)" }} />
        ))}
      </div>
      {PEOPLE.map((token) => (
        <div key={token} className="sk-week-row">
          <div className="sk-lane-label sk-person-row" style={{ padding: "0 12px" }}>
            <Avatar token={token} size={28} />
            <Bone style={{ width: 64, height: 12 }} />
          </div>
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="sk-day-slot">
              {index % 3 === 1 ? <Bone style={{ width: "78%", height: 18 }} /> : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function KalenderPhoneSkeleton() {
  return (
    <div className="sk-phone">
      <PhoneHeaderBones />
      <div className="sk-row" style={{ gap: 6 }}>
        {Array.from({ length: 7 }, (_, index) => (
          <Bone key={index} style={{ flex: 1, height: 54, borderRadius: "var(--r-nested)" }} />
        ))}
      </div>
      <div className="sk-row sk-between">
        <Bone style={{ width: 160, height: 18 }} />
        <Bone style={{ width: 88, height: 12 }} />
      </div>
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="sk-tile sk-person-card">
          <Bone style={{ width: 44, height: 14 }} />
          <div className="sk-stack" style={{ flex: 1 }}>
            <Bone style={{ width: "62%", height: 14 }} />
            <Bone style={{ width: "40%", height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TodoWideSkeleton() {
  return (
    <div className="sk-todo-wide">
      <div className="sk-row sk-between">
        <div className="sk-row" style={{ gap: 14 }}>
          <Bone style={{ width: 118, height: 22 }} />
          <Bone style={{ width: 160, height: 14 }} />
        </div>
        <div className="sk-row" style={{ gap: 8 }}>
          <Bone style={{ width: 64, height: 32, borderRadius: "var(--r-full)" }} />
          <Bone style={{ width: 88, height: 32, borderRadius: "var(--r-full)" }} />
          <Bone style={{ width: 92, height: 32, borderRadius: "var(--r-full)" }} />
        </div>
      </div>
      <div className="sk-todo-lanes">
        {PEOPLE.map((token) => (
          <div key={token} className="sk-tile sk-todo-lane">
            <div className="sk-person-row">
              <Avatar token={token} size={30} />
              <div className="sk-stack" style={{ flex: 1 }}>
                <Bone style={{ width: "70%", height: 14 }} />
                <Bone style={{ width: "40%", height: 10 }} />
              </div>
            </div>
            {[0, 1, 2].map((key) => (
              <Bone key={key} style={{ width: "100%", height: 52, borderRadius: 12 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TodoPhoneSkeleton() {
  return (
    <div className="sk-phone">
      <PhoneHeaderBones />
      <div className="sk-row" style={{ gap: 8 }}>
        {PEOPLE.map((token) => (
          <div key={token} className="sk-stack" style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <Avatar token={token} size={42} />
            <Bone style={{ width: 36, height: 10 }} />
          </div>
        ))}
      </div>
      <div className="sk-row sk-between">
        <Bone style={{ width: 140, height: 18 }} />
        <Bone style={{ width: 52, height: 12 }} />
      </div>
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="sk-tile sk-person-card">
          <Bone style={{ width: 22, height: 22, borderRadius: 6 }} />
          <div className="sk-stack" style={{ flex: 1 }}>
            <Bone style={{ width: "68%", height: 14 }} />
            <Bone style={{ width: "34%", height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiddagWideSkeleton() {
  return (
    <div className="sk-middag-wide">
      <div className="sk-tile sk-menu">
        <div className="sk-row" style={{ gap: 14 }}>
          <Bone style={{ width: 110, height: 22 }} />
          <Bone style={{ width: 150, height: 14 }} />
        </div>
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="sk-meal-row">
            <Bone style={{ width: 36, height: 12 }} />
            <Bone style={{ flex: 1, height: 16 }} />
            <Bone style={{ width: 48, height: 12 }} />
          </div>
        ))}
      </div>
      <div className="sk-tile sk-list">
        <Bone style={{ width: 120, height: 22 }} />
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div key={key} className="sk-row" style={{ gap: 10 }}>
            <Bone style={{ width: 18, height: 18, borderRadius: 4 }} />
            <Bone style={{ flex: 1, height: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MiddagPhoneSkeleton() {
  return (
    <div className="sk-phone">
      <PhoneHeaderBones />
      <div className="sk-row sk-between">
        <Bone style={{ width: 96, height: 20 }} />
        <Bone style={{ width: 120, height: 13 }} />
      </div>
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="sk-tile sk-meal-row" style={{ height: 55, padding: "0 10px" }}>
          <Bone style={{ width: 32, height: 12 }} />
          <Bone style={{ flex: 1, height: 14 }} />
        </div>
      ))}
      <div className="sk-tile sk-person-card">
        <Bone style={{ width: 19, height: 19, borderRadius: 6 }} />
        <div className="sk-stack" style={{ flex: 1 }}>
          <Bone style={{ width: "48%", height: 14 }} />
          <Bone style={{ width: "62%", height: 11 }} />
        </div>
      </div>
    </div>
  );
}

function VerdiWideSkeleton() {
  return (
    <div className="sk-todo-wide">
      <div className="sk-row sk-between">
        <div className="sk-row" style={{ gap: 14 }}>
          <Bone style={{ width: 88, height: 22 }} />
          <Bone style={{ width: 160, height: 14 }} />
        </div>
        <Bone style={{ width: 112, height: 36, borderRadius: "var(--r-full)" }} />
      </div>
      <div className="sk-todo-lanes">
        {DAUGHTERS.map((token) => (
          <div key={token} className="sk-tile sk-todo-lane">
            <div className="sk-person-row">
              <Avatar token={token} size={30} />
              <div className="sk-stack" style={{ flex: 1 }}>
                <Bone style={{ width: "70%", height: 14 }} />
              </div>
              <Bone style={{ width: 48, height: 14 }} />
            </div>
            {[0, 1, 2, 3].map((key) => (
              <Bone key={key} style={{ width: "100%", height: 40, borderRadius: 12 }} />
            ))}
            <Bone style={{ width: "100%", height: 46, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VerdiPhoneSkeleton() {
  return (
    <div className="sk-phone">
      <PhoneHeaderBones />
      <div className="sk-row sk-between">
        <Bone style={{ width: 140, height: 20 }} />
        <Bone style={{ width: 112, height: 32, borderRadius: "var(--r-full)" }} />
      </div>
      <div className="sk-row" style={{ gap: 8 }}>
        {DAUGHTERS.map((token) => (
          <div key={token} className="sk-stack" style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <Avatar token={token} size={42} />
            <Bone style={{ width: 44, height: 10 }} />
          </div>
        ))}
      </div>
      <div className="sk-row sk-between">
        <Bone style={{ width: 88, height: 18 }} />
        <Bone style={{ width: 52, height: 14 }} />
      </div>
      {[0, 1, 2, 3].map((key) => (
        <Bone key={key} style={{ width: "100%", height: 44, borderRadius: 12 }} />
      ))}
    </div>
  );
}

const WIDE: Record<AppPath, () => ReactNode> = {
  "/": HjemWideSkeleton,
  "/kalender": KalenderWideSkeleton,
  "/todo": TodoWideSkeleton,
  "/middag": MiddagWideSkeleton,
  "/verdi": VerdiWideSkeleton,
};

const PHONE: Record<AppPath, () => ReactNode> = {
  "/": HjemPhoneSkeleton,
  "/kalender": KalenderPhoneSkeleton,
  "/todo": TodoPhoneSkeleton,
  "/middag": MiddagPhoneSkeleton,
  "/verdi": VerdiPhoneSkeleton,
};

export function RouteSkeleton({ route }: { route: AppPath }) {
  const Wide = WIDE[route];
  const Phone = PHONE[route];
  return (
    <div className="route-skeleton hallway-page has-phone" aria-hidden="true">
      <div className="only-wide">
        <HallwayHeaderBones />
        <Wide />
      </div>
      <div className="only-phone">
        <Phone />
      </div>
    </div>
  );
}
