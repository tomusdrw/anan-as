// Portable JS entry point for anan-as
// Imports portable runtime glue before the AS portable runtime.
import "./bootstrap";
import "../assembly/portable";
import "assemblyscript/std/portable/index.js";

export * from "../assembly/index-shared";
