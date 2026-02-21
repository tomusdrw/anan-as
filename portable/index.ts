// Portable JS entry point for anan-as
// Imports polyfills before the AS portable runtime
import "./polyfills";
import "assemblyscript/std/portable/index.js";

export * from "../assembly/index-shared";
