import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatPercent(amount: number): string {
  return `${(amount * 100).toFixed(2)}%`;
}

export function secantMethod(
  f: (_x: number) => number,
  x0: number,
  x1: number,
  tol: number = 1e-6,
) {
  let x2 = x1;
  let f0 = f(x0);
  let f1 = f(x1);
  while (Math.abs(f1) > tol) {
    x2 = x1 - f1 * ((x1 - x0) / (f1 - f0));
    x0 = x1;
    f0 = f1;
    x1 = x2;
    f1 = f(x2);
  }
  return x2;
}
