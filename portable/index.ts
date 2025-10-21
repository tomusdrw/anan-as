// Portable JS entry point for anan-as
// Imports the AssemblyScript portable runtime and polyfills
import "assemblyscript/std/portable";
import "./polyfills";

export * from "../assembly/index-shared";
