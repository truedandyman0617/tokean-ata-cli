import invariant from "tiny-invariant";

export const getUnixTimestamp = () => {
  return Math.floor(new Date().getTime() / 1000);
};

export async function sleep(seconds): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}


export const toBytes32Array = (b: Buffer): number[] => {
  invariant(b.length <= 32, `invalid length ${b.length}`);
  const buf = Buffer.alloc(32);
  b.copy(buf, 32 - b.length);

  return Array.from(buf);
};

export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};