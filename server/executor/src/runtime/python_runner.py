#!/usr/bin/env python3
"""Sandbox runner for executing user Python code with resource limits."""

import builtins as _builtins
import contextlib
import io
import json
import os
import resource
import signal
import sys
from types import SimpleNamespace

CPU_LIMIT_SECONDS = float(os.environ.get("EXECUTOR_CPU_LIMIT", "2.0"))
MEM_LIMIT_BYTES = int(float(os.environ.get("EXECUTOR_MEM_LIMIT", str(256 * 1024 * 1024))))

ALLOWED_MODULES = set(
    json.loads(os.environ.get("EXECUTOR_ALLOWED_MODULES", "[\"math\", \"random\", \"turtle\"]"))
)

DANGEROUS_BUILTINS = {
    "open",
    "exec",
    "eval",
    "compile",
    "__import__",
    "globals",
    "locals",
    "vars",
    "input",
    "help",
    "quit",
    "exit",
}


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
        
        # Handle custom turtle module
        if name == "turtle":
            import importlib.util
            import os
            # Try multiple possible locations for turtle.py
            possible_paths = [
                os.path.join(os.path.dirname(__file__), "turtle.py"),  # Local development
                "/opt/task/turtle.py",  # Docker container
                os.path.join(os.getcwd(), "turtle.py"),  # Current working directory
            ]
            
            turtle_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    turtle_path = path
                    break
            
            if turtle_path is None:
                raise ImportError("turtle.py module not found")
                
            spec = importlib.util.spec_from_file_location("turtle", turtle_path)
            turtle_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(turtle_module)
            sys.modules["turtle"] = turtle_module
            return turtle_module
        
        return __import__(name, globals, locals, fromlist, level)


def _make_safe_builtins():
    safe = dict(_builtins.__dict__)
    for name in DANGEROUS_BUILTINS:
        safe.pop(name, None)
    safe["__import__"] = RestrictedImporter(ALLOWED_MODULES)
    return safe


def execute_user_code(source: str, stdin_payload: str):
    _apply_limits()

    import socket

    def disabled_socket(*_args, **_kwargs):
        raise OSError("Network access is disabled")

    socket.socket = disabled_socket  # type: ignore

    user_globals = {
        "__builtins__": _make_safe_builtins(),
    }

    stdin_buffer = io.StringIO(stdin_payload or "")
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()

    original_stdout = sys.stdout
    original_stderr = sys.stderr
    original_stdin = sys.stdin

    # Redirect stdout/stderr for the entire execution
    sys.stdout = stdout_buffer
    sys.stderr = stderr_buffer
    sys.stdin = stdin_buffer
    
    try:
        exec(compile(source, filename="<user_code>", mode="exec"), user_globals)
        
        # Force any atexit handlers to run while stdout is still redirected
        import atexit
        atexit._run_exitfuncs()
        
    finally:
        sys.stdin = original_stdin
        sys.stdout = original_stdout
        sys.stderr = original_stderr
        signal.alarm(0)

    return SimpleNamespace(
        stdout=stdout_buffer.getvalue(),
        stderr=stderr_buffer.getvalue(),
        usage=resource.getrusage(resource.RUSAGE_SELF),
    )


def parse_turtle_output(stdout_content):
    """Parse turtle SVG and segments output from stdout."""
    svg = None
    segments = None
    
    lines = stdout_content.split('\n')
    i = 0
    while i < len(lines):
        if lines[i] == "SVG_OUTPUT_START":
            i += 1
            svg_lines = []
            while i < len(lines) and lines[i] != "SVG_OUTPUT_END":
                svg_lines.append(lines[i])
                i += 1
            svg = '\n'.join(svg_lines)
        elif lines[i] == "SEGMENTS_OUTPUT_START":
            i += 1
            if i < len(lines) and lines[i] != "SEGMENTS_OUTPUT_END":
                try:
                    segments_data = json.loads(lines[i])
                    segments = segments_data.get("segments", [])
                except json.JSONDecodeError:
                    pass
        i += 1
    
    return svg, segments


def main():
    raw = sys.stdin.read()
    data = json.loads(raw)
    source = data.get("source", "")
    stdin_payload = data.get("stdin", "")

    try:
        result = execute_user_code(source, stdin_payload)
        
        # Parse turtle output from stdout
        svg, segments = parse_turtle_output(result.stdout)
        
        response = {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "timeout": False,
            "usage": {
                "cpu_seconds": result.usage.ru_utime + result.usage.ru_stime,
                "max_rss": result.usage.ru_maxrss,
            },
        }
        
        # Add turtle-specific outputs if found
        if svg is not None:
            response["svg"] = svg
        if segments is not None:
            response["segments"] = segments
            
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
