export const R = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(a: T[]): T => a[(Math.random() * a.length) | 0];
