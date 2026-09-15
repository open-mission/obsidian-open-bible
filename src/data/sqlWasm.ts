import sqlWasm from "sql.js/dist/sql-wasm-browser.wasm";
import { toSqlWasmBuffer } from "./sqlEngine";

/**
 * SQLite engine compiled to WebAssembly, embedded in the bundle by esbuild's
 * `binary` loader so the plugin works fully offline (desktop and mobile).
 */
export function getEmbeddedSqlWasm(): ArrayBuffer {
	return toSqlWasmBuffer(sqlWasm);
}