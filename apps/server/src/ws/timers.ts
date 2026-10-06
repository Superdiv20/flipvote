/** Runs `task` after `ms` and returns a function that calls it off. Injected so tests control time. */
export type Schedule = (task: () => void, ms: number) => () => void;

export const realTimers: Schedule = (task, ms) => {
	const timer = setTimeout(task, ms);
	return () => clearTimeout(timer);
};
