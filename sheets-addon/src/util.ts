export function findInArray<T>(arr: T[], predicate: (value: T) => boolean): T | undefined {
  // tslint:disable-next-line: prefer-for-of
  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i];
    if (predicate(value)) {
      return value;
    }
  }
  return undefined;
}
