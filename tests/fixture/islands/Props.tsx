import { useEffect, useState } from "preact/hooks";

interface Props {
  u8: { single: Uint8Array; array: Uint8Array[] };
}

export default function Props({ u8 }: Props) {
  const [u8SingleByteLength, setU8SingleByteLength] = useState(0);
  const [u8ArrayByteLength, setU8ArrayByteLength] = useState(0);

  useEffect(() => {
    setU8SingleByteLength(u8.single.byteLength);
    setU8ArrayByteLength(u8.array.reduce((sum, u8) => sum + u8.byteLength, 0));
  }, []);

  return (
    <div>
      <div id="u8-single-bytelength">{u8SingleByteLength}</div>
      <div id="u8-array-bytelength">{u8ArrayByteLength}</div>
    </div>
  );
}
