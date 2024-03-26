const PERIODS = {
  year: 365 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  seconds: 1000,
};

export function prettyTime(diff: number) {
  if (diff > PERIODS.day) {
    return Math.floor(diff / PERIODS.day) + "d";
  } else if (diff > PERIODS.hour) {
    return Math.floor(diff / PERIODS.hour) + "h";
  } else if (diff > PERIODS.minute) {
    return Math.floor(diff / PERIODS.minute) + "m";
  } else if (diff > PERIODS.seconds) {
    return Math.floor(diff / PERIODS.seconds) + "s";
  }

  return diff + "ms";
}

export class TaskObserver<T> {
  completed = false;
  constructor(promise: Promise<T>) {

  }

  observe(resolve: (value: T) => void, reject: (err: Error) => void) {

  }
}