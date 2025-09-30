"""
Xenocode Virtual Machine
Interpreter for the alien programming language used in CodeBreaker.
"""

import re
import json
from typing import Any, Dict, List, Optional, Tuple
from enum import Enum


class ExecutionError(Exception):
    """Raised when Xenocode execution fails."""
    pass


class TraceLevel(Enum):
    """Trace output verbosity levels."""
    NONE = 0
    BASIC = 1
    DETAILED = 2


class XenocodeVM:
    """Virtual machine for executing Xenocode programs."""

    def __init__(self, trace_level: TraceLevel = TraceLevel.NONE):
        self.trace_level = trace_level
        self.variables: Dict[str, Any] = {}
        self.output: List[str] = []
        self.trace: List[str] = []
        self.input_queue: List[Any] = []
        self.line_number = 0
        self.functions: Dict[str, Tuple[List[str], List[str]]] = {}  # name -> (params, body)

    def reset(self):
        """Reset VM state between executions."""
        self.variables = {}
        self.output = []
        self.trace = []
        self.line_number = 0
        self.functions = {}

    def set_input(self, inputs: List[Any]):
        """Set input queue for §receive commands."""
        self.input_queue = inputs.copy()

    def add_trace(self, message: str):
        """Add trace message if tracing enabled."""
        if self.trace_level != TraceLevel.NONE:
            self.trace.append(f"[Line {self.line_number}] {message}")

    def execute(self, code: str, inputs: Optional[List[Any]] = None) -> Dict[str, Any]:
        """
        Execute Xenocode program.

        Returns:
            Dict containing 'output', 'trace', 'variables', 'success', 'error'
        """
        self.reset()
        if inputs:
            self.set_input(inputs)

        try:
            lines = code.split('\n')
            self._execute_block(lines, 0, len(lines))

            return {
                'output': self.output,
                'trace': self.trace,
                'variables': self.variables.copy(),
                'success': True,
                'error': None
            }
        except Exception as e:
            return {
                'output': self.output,
                'trace': self.trace,
                'variables': self.variables.copy(),
                'success': False,
                'error': str(e)
            }

    def _execute_block(self, lines: List[str], start: int, end: int) -> int:
        """Execute a block of code, return next line to execute."""
        i = start
        while i < end:
            line = lines[i].strip()
            self.line_number = i + 1

            # Skip empty lines and comments
            if not line or line.startswith('#'):
                i += 1
                continue

            # Handle different statement types
            if line.startswith('§begin'):
                i += 1
                continue
            elif line.startswith('§end') and not line.startswith('§end_'):
                i += 1
                continue
            elif line.startswith('§transmit'):
                self._exec_transmit(line)
                i += 1
            elif '←' in line and '§receive' in line:
                self._exec_receive(line)
                i += 1
            elif '←' in line:
                self._exec_assignment(line)
                i += 1
            elif line.startswith('§iterate'):
                i = self._exec_iterate(lines, i, end)
            elif line.startswith('§if'):
                i = self._exec_if(lines, i, end)
            elif line.startswith('§function'):
                i = self._exec_function_def(lines, i, end)
            elif line.startswith('§call'):
                self._exec_function_call(line)
                i += 1
            else:
                i += 1

        return i

    def _exec_transmit(self, line: str):
        """Execute §transmit (output) command."""
        match = re.search(r'§transmit\s+(.+)', line)
        if match:
            expr = match.group(1).strip()
            value = self._evaluate_expression(expr)
            self.output.append(str(value))
            self.add_trace(f"Output: {value}")

    def _exec_receive(self, line: str):
        """Execute §receive (input) command."""
        match = re.search(r'(\w+)\s*←\s*§receive', line)
        if match:
            var_name = match.group(1)
            if self.input_queue:
                value = self.input_queue.pop(0)
                self.variables[var_name] = value
                self.add_trace(f"{var_name} = {value} (from input)")
            else:
                raise ExecutionError(f"No input available for §receive at line {self.line_number}")

    def _exec_assignment(self, line: str):
        """Execute variable assignment."""
        match = re.search(r'(\w+)\s*←\s*(.+)', line)
        if match:
            var_name = match.group(1)
            expr = match.group(2).strip()

            # Handle special create commands
            if expr == '§create_map':
                value = {}
            elif expr == '§create_array':
                value = []
            elif expr == '§null':
                value = None
            else:
                value = self._evaluate_expression(expr)

            self.variables[var_name] = value
            self.add_trace(f"{var_name} = {value}")

    def _exec_iterate(self, lines: List[str], start: int, end: int) -> int:
        """Execute §iterate loop."""
        line = lines[start].strip()
        match = re.search(r'§iterate\s+(\w+)\s+§in\s+(.+)', line)

        if not match:
            raise ExecutionError(f"Invalid §iterate syntax at line {self.line_number}")

        item_var = match.group(1)
        collection_expr = match.group(2).strip()
        collection = self._evaluate_expression(collection_expr)

        # Find matching §end_iterate
        loop_end = self._find_block_end(lines, start, '§iterate', '§end_iterate')

        # Execute loop body for each item
        if isinstance(collection, dict):
            items = collection.keys()
        else:
            items = collection

        for item in items:
            self.variables[item_var] = item
            self.add_trace(f"Loop: {item_var} = {item}")
            self._execute_block(lines, start + 1, loop_end)

        return loop_end + 1

    def _exec_if(self, lines: List[str], start: int, end: int) -> int:
        """Execute §if conditional."""
        line = lines[start].strip()
        match = re.search(r'§if\s+(.+)', line)

        if not match:
            raise ExecutionError(f"Invalid §if syntax at line {self.line_number}")

        condition_expr = match.group(1).strip()
        condition = self._evaluate_expression(condition_expr)

        # Find §else and §end_if
        else_line = self._find_else(lines, start)
        endif_line = self._find_block_end(lines, start, '§if', '§end_if')

        if condition:
            # Execute if block
            self.add_trace(f"Condition true: {condition_expr}")
            if else_line:
                self._execute_block(lines, start + 1, else_line)
            else:
                self._execute_block(lines, start + 1, endif_line)
        else:
            # Execute else block if exists
            self.add_trace(f"Condition false: {condition_expr}")
            if else_line:
                self._execute_block(lines, else_line + 1, endif_line)

        return endif_line + 1

    def _exec_function_def(self, lines: List[str], start: int, end: int) -> int:
        """Define a function."""
        line = lines[start].strip()
        match = re.search(r'§function\s+(\w+)\s*\(([^)]*)\)', line)

        if not match:
            raise ExecutionError(f"Invalid §function syntax at line {self.line_number}")

        func_name = match.group(1)
        params = [p.strip() for p in match.group(2).split(',') if p.strip()]

        # Find function end
        func_end = self._find_block_end(lines, start, '§function', '§end_function')

        # Store function body
        func_body = lines[start + 1:func_end]
        self.functions[func_name] = (params, func_body)
        self.add_trace(f"Defined function: {func_name}({', '.join(params)})")

        return func_end + 1

    def _exec_function_call(self, line: str):
        """Execute a function call."""
        match = re.search(r'§call\s+(\w+)\s*\(([^)]*)\)', line)

        if not match:
            raise ExecutionError(f"Invalid §call syntax at line {self.line_number}")

        func_name = match.group(1)
        args_expr = match.group(2)

        if func_name not in self.functions:
            raise ExecutionError(f"Undefined function: {func_name}")

        # Evaluate arguments
        args = []
        if args_expr.strip():
            for arg in args_expr.split(','):
                args.append(self._evaluate_expression(arg.strip()))

        # Save current variables (simple scope)
        saved_vars = self.variables.copy()

        # Bind parameters
        params, body = self.functions[func_name]
        for param, arg in zip(params, args):
            self.variables[param] = arg

        # Execute function body
        self.add_trace(f"Calling {func_name}({', '.join(map(str, args))})")
        self._execute_block(body, 0, len(body))

        # Restore variables
        self.variables = saved_vars

    def _evaluate_expression(self, expr: str) -> Any:
        """Evaluate an expression and return its value."""
        expr = expr.strip()

        # String literal
        if expr.startswith('"') and expr.endswith('"'):
            return expr[1:-1]

        # Array literal
        if expr.startswith('[') and expr.endswith(']'):
            elements = expr[1:-1].split(',')
            return [self._evaluate_expression(e.strip()) for e in elements if e.strip()]

        # Number
        try:
            if '.' in expr:
                return float(expr)
            return int(expr)
        except ValueError:
            pass

        # Boolean literals
        if expr == '§true':
            return True
        if expr == '§false':
            return False

        # Variable
        if expr in self.variables:
            return self.variables[expr]

        # Array/map access
        if '[' in expr and ']' in expr:
            match = re.match(r'(\w+)\[(.+)\]', expr)
            if match:
                var_name = match.group(1)
                index_expr = match.group(2)
                if var_name in self.variables:
                    index = self._evaluate_expression(index_expr)
                    return self.variables[var_name][index]

        # §exists check
        if expr.startswith('§exists'):
            match = re.search(r'§exists\s+(.+)', expr)
            if match:
                check_expr = match.group(1).strip()
                try:
                    # Try to evaluate, if it works, it exists
                    if '[' in check_expr:
                        var_match = re.match(r'(\w+)\[(.+)\]', check_expr)
                        if var_match:
                            var_name = var_match.group(1)
                            key = self._evaluate_expression(var_match.group(2))
                            if var_name in self.variables:
                                return key in self.variables[var_name]
                    return check_expr in self.variables
                except:
                    return False

        # Binary operations
        # Addition (⊕)
        if '⊕' in expr:
            parts = expr.split('⊕')
            if len(parts) == 2:
                left = self._evaluate_expression(parts[0].strip())
                right = self._evaluate_expression(parts[1].strip())
                return left + right

        # Subtraction (⊖)
        if '⊖' in expr:
            parts = expr.split('⊖')
            if len(parts) == 2:
                left = self._evaluate_expression(parts[0].strip())
                right = self._evaluate_expression(parts[1].strip())
                return left - right

        # Greater than (⊗)
        if '⊗' in expr:
            parts = expr.split('⊗')
            if len(parts) == 2:
                left = self._evaluate_expression(parts[0].strip())
                right = self._evaluate_expression(parts[1].strip())
                return left > right

        # Less than (⊘)
        if '⊘' in expr:
            parts = expr.split('⊘')
            if len(parts) == 2:
                left = self._evaluate_expression(parts[0].strip())
                right = self._evaluate_expression(parts[1].strip())
                return left < right

        # Equality (≈)
        if '≈' in expr:
            parts = expr.split('≈')
            if len(parts) == 2:
                left = self._evaluate_expression(parts[0].strip())
                right = self._evaluate_expression(parts[1].strip())
                return left == right

        # Logical NOT (¬)
        if expr.startswith('¬'):
            operand = self._evaluate_expression(expr[1:].strip())
            return not operand

        # If nothing matched, raise error
        raise ExecutionError(f"Cannot evaluate expression: {expr}")

    def _find_block_end(self, lines: List[str], start: int, begin_keyword: str, end_keyword: str) -> int:
        """Find the matching end statement for a block."""
        depth = 0
        for i in range(start, len(lines)):
            line = lines[i].strip()
            if begin_keyword in line and (line.startswith(begin_keyword) or line.startswith('§if') or line.startswith('§iterate') or line.startswith('§function')):
                depth += 1
            elif line.startswith(end_keyword):
                depth -= 1
                if depth == 0:
                    return i
        raise ExecutionError(f"No matching {end_keyword} found for {begin_keyword}")

    def _find_else(self, lines: List[str], if_start: int) -> Optional[int]:
        """Find §else for an §if statement."""
        depth = 0
        for i in range(if_start, len(lines)):
            line = lines[i].strip()
            if line.startswith('§if'):
                depth += 1
            elif line.startswith('§end_if'):
                depth -= 1
                if depth == 0:
                    return None
            elif line.startswith('§else') and depth == 1:
                return i
        return None