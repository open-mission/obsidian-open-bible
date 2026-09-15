import bytes from "./generated/cross-refs.bin";

export function getEmbeddedCrossRefs(): Uint8Array {
	return bytes;
}
