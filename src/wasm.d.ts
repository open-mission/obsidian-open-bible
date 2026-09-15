declare module "*.wasm" {
	const bytes: Uint8Array;
	export default bytes;
}

declare module "*.bin" {
	const bytes: Uint8Array;
	export default bytes;
}