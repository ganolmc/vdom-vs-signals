export interface Rng {
  next(): number;
}

function mulberry32(a: number): () => number {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createSeededRng(seed: string | number): Rng {
  const s = typeof seed === "number" ? seed : Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  const fn = mulberry32(s);
  return { next: () => fn() };
}

export type Region = "US" | "EU" | "APAC";
export interface Row {
  id: number;
  product: string;
  region: Region;
  price: number;
  qty: number;
  updatedAt: number;
}

export function generateRows(count: number, rng: Rng): Row[] {
  const regions: Region[] = ["US", "EU", "APAC"];
  const rows: Row[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i,
      product: `Product ${i}`,
      region: regions[Math.floor(rng.next() * regions.length)],
      price: Math.floor(rng.next() * 1000) / 10,
      qty: Math.floor(rng.next() * 1000),
      updatedAt: Date.now()
    });
  }
  return rows;
}

export function mutateRowsFraction(rows: Row[], fraction: number, rng: Rng): void {
  const count = Math.floor(rows.length * fraction);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng.next() * rows.length);
    const row = rows[idx];
    row.price = Math.floor(rng.next() * 1000) / 10;
    row.qty = Math.floor(rng.next() * 1000);
    row.updatedAt = Date.now();
  }
}
