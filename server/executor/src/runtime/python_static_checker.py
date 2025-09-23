#!/usr/bin/env python3
"""Simple static analysis to reject dangerous Python constructs."""

import ast
import json
import sys

DANGEROUS_BUILTINS = {
    "eval",
    "exec",
    "compile",
    "open",
    "__import__",
    "input",
    "globals",
    "locals",
    "vars",
}

DANGEROUS_ATTRS = {
    "__dict__",
    "__class__",
    "__subclasses__",
}

DANGEROUS_MODULES = {
    "os",
    "sys",
    "subprocess",
    "socket",
    "pathlib",
    "inspect",
    "importlib",
    "ctypes",
    "multiprocessing",
    "threading",
    "shutil",
    "resource",
    "signal",
}


def analyze(source: str, allowed_modules: set[str]) -> list[str]:
    issues: list[str] = []
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:  # pragma: no cover - surfaced to caller
        issues.append(f"SyntaxError: {exc}")
        return issues

    class Visitor(ast.NodeVisitor):
        def visit_Import(self, node: ast.Import) -> None:  # noqa: N802
            for alias in node.names:
                root = alias.name.split(".")[0]
                if root not in allowed_modules:
                    issues.append(f"Import of module '{root}' is not allowed")
                if root in DANGEROUS_MODULES:
                    issues.append(f"Dangerous module '{root}' cannot be imported")
            self.generic_visit(node)

        def visit_ImportFrom(self, node: ast.ImportFrom) -> None:  # noqa: N802
            if node.module is None:
                return
            root = node.module.split(".")[0]
            if root not in allowed_modules:
                issues.append(f"Import from module '{root}' is not allowed")
            if root in DANGEROUS_MODULES:
                issues.append(f"Dangerous module '{root}' cannot be imported")
            self.generic_visit(node)

        def visit_Call(self, node: ast.Call) -> None:  # noqa: N802
            func = node.func
            if isinstance(func, ast.Name):
                name = func.id
                if name in DANGEROUS_BUILTINS:
                    issues.append(f"Use of builtin '{name}' is not allowed")
            elif isinstance(func, ast.Attribute):
                if isinstance(func.attr, str) and func.attr in DANGEROUS_ATTRS:
                    issues.append("Access to special attribute is not allowed")
                value = func.value
                if isinstance(value, ast.Name) and value.id in DANGEROUS_MODULES:
                    issues.append(f"Access on dangerous module '{value.id}' is not allowed")
            self.generic_visit(node)

        def visit_Attribute(self, node: ast.Attribute) -> None:  # noqa: N802
            if isinstance(node.attr, str) and node.attr in DANGEROUS_ATTRS:
                issues.append("Access to special attribute is not allowed")
            self.generic_visit(node)

    Visitor().visit(tree)
    return issues


def main() -> None:
    raw = sys.stdin.read()
    payload = json.loads(raw or "{}")
    source = payload.get("source", "")
    allowed_modules = set(payload.get("allowedModules", []))

    issues = analyze(source, allowed_modules)
    print(json.dumps({"ok": not issues, "issues": issues}))


if __name__ == "__main__":
    main()
