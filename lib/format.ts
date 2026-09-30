const f = new Intl.NumberFormat("id-ID");
export const rp = (n: number) => "Rp" + f.format(n);