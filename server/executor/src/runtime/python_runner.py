#!/usr/bin/env python3
"""Sandbox runner for executing user Python code with resource limits."""

import contextlib
import io
import json
import os
import resource
import signal
import sys
import textwrap
from types import SimpleNamespace

CPU_LIMIT_SECONDS = float(os.environ.get("EXECUTOR_CPU_LIMIT", "2.0"))
MEM_LIMIT_BYTES = int(float(os.environ.get("EXECUTOR_MEM_LIMIT", str(256 * 1024 * 1024))))

ALLOWED_MODULES = set(
    json.loads(os.environ.get("EXECUTOR_ALLOWED_MODULES", "[\"math\", \"random\"]"))
)


def _apply_limits():
    cpu_limit = max(1, int(CPU_LIMIT_SECONDS))
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_limit, cpu_limit))
    try:
        resource.setrlimit(resource.RLIMIT_AS, (MEM_LIMIT_BYTES, MEM_LIMIT_BYTES))
    except (ValueError, OSError):
        # Some platforms (e.g. macOS) might not support RLIMIT_AS adjustments.
        pass

    def alarm_handler(_signum, _frame):
        raise TimeoutError("Execution timed out")

    wall_clock_timeout = max(1, int(float(os.environ.get("EXECUTOR_TIMEOUT", "3.0"))))
    signal.signal(signal.SIGALRM, alarm_handler)
    signal.alarm(wall_clock_timeout)


class RestrictedImporter:
    def __init__(self, allowed_modules):
        self.allowed_modules = allowed_modules

    def __call__(self, name, globals=None, locals=None, fromlist=(), level=0):
        root = name.split(".")[0]
        if root not in self.allowed_modules:
            raise ImportError(f"Import of '{root}' is not allowed")
        return __import__(name, globals, locals, fromlist, level)


def execute_user_code(source: str, stdin_payload: str):
    _apply_limits()

    import socket

    def disabled_socket(*_args, **_kwargs):
        raise OSError("Network access is disabled")

    socket.socket = disabled_socket  # type: ignore

    user_globals = {
        "__builtins__": __builtins__,
    }
    builtins = user_globals["__builtins__"]
    if isinstance(builtins, dict):
        builtins["__import__"] = RestrictedImporter(ALLOWED_MODULES)
    else:
        setattr(builtins, "__import__", RestrictedImporter(ALLOWED_MODULES))

    stdin_buffer = io.StringIO(stdin_payload or "")
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()

    with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
        original_stdin = sys.stdin
        sys.stdin = stdin_buffer
        try:
            exec(compile(source, filename="<user_code>", mode="exec"), user_globals)
        finally:
            sys.stdin = original_stdin

    return SimpleNamespace(
        stdout=stdout_buffer.getvalue(),
        stderr=stderr_buffer.getvalue(),
    )


def main():
    raw = sys.stdin.read()
    data = json.loads(raw)
    source = data.get("source", "")
    stdin_payload = data.get("stdin", "")

    try:
        result = execute_user_code(source, stdin_payload)
        response = {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "timeout": False,
        }
    except TimeoutError as exc:
        response = {"stdout": "", "stderr": str(exc), "timeout": True}
    except Exception as exc:  # pylint: disable=broad-except
        response = {
            "stdout": "",
            "stderr": f"{type(exc).__name__}: {exc}",
            "timeout": False,
        }

    print(json.dumps(response))


if __name__ == "__main__":
    main()
