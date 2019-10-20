export function findInArray<T>(arr: ReadonlyArray<T>, predicate: (value: T) => boolean): T | undefined {
  // tslint:disable-next-line: prefer-for-of
  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i];
    if (predicate(value)) {
      return value;
    }
  }
  return undefined;
}

function findDuplicatesOrUniqueValues<T>(arr: ReadonlyArray<T>, isFindDuplicates: boolean): T[] {
  const seenUnique: T[] = [];
  const dupes: T[] = [];

  arr.forEach(v => {
    if (seenUnique.indexOf(v) !== -1) {
      if (dupes.indexOf(v) === -1) {
        dupes.push(v);
      }
    } else {
      seenUnique.push(v);
    }
  });

  return (isFindDuplicates ? dupes : seenUnique);
}

export function findDuplicates<T>(arr: ReadonlyArray<T>): T[] {
  return findDuplicatesOrUniqueValues(arr, /*isFindDuplicates=*/true);
}

export function uniqueValues<T>(arr: ReadonlyArray<T>): T[] {
  return findDuplicatesOrUniqueValues(arr, /*isFindDuplicates=*/false);
}

// export function forEachReverse<T>(arr: ReadonlyArray<T>, func: (value: T) => void) {
//   // tslint:disable-next-line: prefer-for-of
//   for (let i = arr.length - 1; i >= 0; --i) {
//     func(arr[i]);
//   }
// }
