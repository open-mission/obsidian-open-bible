import initSqlJs from "sql.js";

/** Copies the embedded asset into a standalone ArrayBuffer (sql.js requires one). */
export function toSqlWasmBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Boots the SQLite engine from an in-memory WebAssembly binary (no network/file access). */
export function createSqlEngine(wasmBinary: ArrayBuffer) {
	return initSqlJs({ wasmBinary });
}