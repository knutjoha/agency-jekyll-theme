import type { PersonId, TodoLane, TodoTask } from "../../data/types";

export type DoneTodo = {
  task: TodoTask;
  personId: PersonId;
  index: number;
};

export function collectDone(lanes: TodoLane[]): DoneTodo[] {
  const done: DoneTodo[] = [];
  for (const lane of lanes) {
    lane.tasks.forEach((task, index) => {
      if (!task.done) return;
      done.push({
        personId: lane.personId,
        index,
        task: { ...task, editing: false },
      });
    });
  }
  return done;
}

export function withoutDone(lanes: TodoLane[]): TodoLane[] {
  return lanes.map((lane) => ({
    ...lane,
    tasks: lane.tasks.filter((task) => !task.done),
  }));
}
