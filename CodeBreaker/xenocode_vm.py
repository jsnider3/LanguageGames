"""
Xenocode Virtual Machine
Interpreter for the alien programming language used in CodeBreaker.
"""

import re
from typing import Any, Dict, List, Optional, Tuple, Callable
from enum import Enum
from dataclasses import dataclass
import operator


class ExecutionError(Exception):
    """Raised when Xenocode execution fails."""
    pass


class TraceLevel(Enum):
    """Trace output verbosity levels."""
    NONE = 0
    BASIC = 1
    DETAILED = 2


@dataclass
class BinaryOperator:
    """Definition of a binary operator."""
    symbol: str
    operation: Callable[[Any, Any], Any]
    name: str


class XenocodeConstants:
    """Constants for Xenocode language constructs."""

    # Keywords
    BEGIN = '§begin'
    END = '§end'
    TRANSMIT = '§transmit'
    RECEIVE = '§receive'
    RETURN = '§return'
    ITERATE = '§iterate'
    END_ITERATE = '§end_iterate'
    IF = '§if'
    ELSE = '§else'
    END_IF = '§end_if'
    FUNCTION = '§function'
    END_FUNCTION = '§end_function'
    CALL = '§call'
    IN = '§in'

    # Special values
    CREATE_MAP = '§create_map'
    CREATE_ARRAY = '§create_array'
    NULL = '§null'
    TRUE = '§true'
    FALSE = '§false'
    EXISTS = '§exists'

    # Operators
    ASSIGN = '←'
    ADD = '⊕'
    SUBTRACT = '⊖'
    MULTIPLY = '⊛'
    GREATER_THAN = '⊗'
    LESS_THAN = '⊘'
    EQUALS = '≈'
    NOT = '¬'

    # Operator definitions
    # Binary operators in order of PRECEDENCE (lowest to highest)
    # Comparison operators are checked first (lowest precedence)
    # Arithmetic operators are checked last (highest precedence)
    BINARY_OPERATORS = [
        BinaryOperator(GREATER_THAN, operator.gt, 'greater than'),
        BinaryOperator(LESS_THAN, operator.lt, 'less than'),
        BinaryOperator(EQUALS, operator.eq, 'equality'),
        BinaryOperator(ADD, operator.add, 'addition'),
        BinaryOperator(SUBTRACT, operator.sub, 'subtraction'),
        BinaryOperator(MULTIPLY, operator.mul, 'multiplication'),
    ]


class XenocodeVM:
    """Virtual machine for executing Xenocode programs."""

    # Regex patterns compiled once for performance
    _PATTERN_TRANSMIT = re.compile(r'§transmit\s+(.+)')
    _PATTERN_RECEIVE = re.compile(r'(\w+)\s*←\s*§receive')
    _PATTERN_ARRAY_ASSIGNMENT = re.compile(r'(\w+)\[(.+?)\]\s*←\s*(.+)')
    _PATTERN_ASSIGNMENT = re.compile(r'(\w+)\s*←\s*(.+)')
    _PATTERN_ITERATE = re.compile(r'§iterate\s+(\w+)\s+§in\s+(.+)')
    _PATTERN_IF = re.compile(r'§if\s+(.+)')
    _PATTERN_FUNCTION_DEF = re.compile(r'§function\s+(\w+)\s*\(([^)]*)\)')
    _PATTERN_FUNCTION_CALL = re.compile(r'§call\s+(\w+)\s*\(([^)]*)\)')
    _PATTERN_RETURN = re.compile(r'§return\s+(.+)')
    _PATTERN_ARRAY_ACCESS = re.compile(r'(\w+)\[(.+?)\]')
    _PATTERN_EXISTS = re.compile(r'§exists\s+(.+)')
    _PATTERN_KEYWORD = re.compile(r'§\w+')

    def __init__(self, trace_level: TraceLevel = TraceLevel.NONE):
        self.trace_level = trace_level
        self._reset_state()

    def _reset_state(self):
        """Initialize/reset VM state."""
        self.variables: Dict[str, Any] = {}
        self.output: List[str] = []
        self.trace: List[str] = []
        self.input_queue: List[Any] = []
        self.line_number: int = 0
        self.functions: Dict[str, Tuple[List[str], List[str]]] = {}
        self.return_value: Optional[Any] = None
        self.should_return: bool = False

    def reset(self):
        """Reset VM state between executions."""
        self._reset_state()

    def set_input(self, inputs: List[Any]):
        """Set input queue for §receive commands."""
        if not isinstance(inputs, list):
            raise ValueError("Inputs must be a list")
        self.input_queue = inputs.copy()

    def add_trace(self, message: str):
        """Add trace message if tracing enabled."""
        if self.trace_level != TraceLevel.NONE:
            self.trace.append(f"[Line {self.line_number}] {message}")

    def execute(self, code: str, inputs: Optional[List[Any]] = None) -> Dict[str, Any]:
        """
        Execute Xenocode program.

        Args:
            code: The Xenocode program as a string
            inputs: Optional list of inputs for §receive

        Returns:
            Dict containing 'output', 'trace', 'variables', 'success', 'error'
        """
        if not isinstance(code, str):
            return self._error_result("Code must be a string")

        self.reset()
        if inputs:
            try:
                self.set_input(inputs)
            except ValueError as e:
                return self._error_result(str(e))

        try:
            lines = code.split('\n')
            self._execute_block(lines, 0, len(lines))
            return self._success_result()
        except ExecutionError as e:
            return self._error_result(str(e))
        except Exception as e:
            return self._error_result(f"Unexpected error: {type(e).__name__}: {e}")

    def _success_result(self) -> Dict[str, Any]:
        """Create a success result dictionary."""
        return {
            'output': self.output,
            'trace': self.trace,
            'variables': self.variables.copy(),
            'success': True,
            'error': None
        }

    def _error_result(self, error_message: str) -> Dict[str, Any]:
        """Create an error result dictionary."""
        return {
            'output': self.output,
            'trace': self.trace,
            'variables': self.variables.copy(),
            'success': False,
            'error': error_message
        }

    def _execute_block(self, lines: List[str], start: int, end: int) -> int:
        """Execute a block of code, return next line to execute."""
        if start < 0 or end > len(lines):
            raise ExecutionError(f"Invalid block range: {start} to {end}")

        i = start
        while i < end and not self.should_return:
            line = lines[i].strip()
            self.line_number = i + 1

            # Skip empty lines and comments
            if not line or line.startswith('#'):
                i += 1
                continue

            # Dispatch to appropriate handler
            i = self._execute_statement(line, lines, i, end)

        return i

    def _execute_statement(self, line: str, lines: List[str], current: int, end: int) -> int:
        """Execute a single statement and return next line index."""
        const = XenocodeConstants

        # Block delimiters
        if line.startswith(const.BEGIN) or (line.startswith(const.END) and not line.startswith('§end_')):
            return current + 1

        # Control flow and statements
        if line.startswith(const.RETURN):
            self._exec_return(line)
            return end  # Exit immediately
        elif line.startswith(const.TRANSMIT):
            self._exec_transmit(line)
            return current + 1
        elif const.ASSIGN in line and const.RECEIVE in line:
            self._exec_receive(line)
            return current + 1
        elif const.ASSIGN in line:
            self._exec_assignment(line)
            return current + 1
        elif line.startswith(const.ITERATE):
            return self._exec_iterate(lines, current, end)
        elif line.startswith(const.IF):
            return self._exec_if(lines, current, end)
        elif line.startswith(const.FUNCTION):
            return self._exec_function_def(lines, current, end)
        elif line.startswith(const.CALL):
            self._exec_function_call(line)
            return current + 1
        else:
            # Unknown statement - skip silently
            return current + 1

    def _exec_return(self, line: str):
        """Execute §return statement."""
        match = self._PATTERN_RETURN.search(line)
        if match:
            expr = match.group(1).strip()
            self.return_value = self._evaluate_expression(expr)
            self.add_trace(f"Return: {self.return_value}")
        else:
            self.return_value = None
            self.add_trace("Return: (no value)")
        self.should_return = True

    def _exec_transmit(self, line: str):
        """Execute §transmit (output) command."""
        match = self._PATTERN_TRANSMIT.search(line)
        if not match:
            raise ExecutionError(f"Invalid §transmit syntax at line {self.line_number}")

        expr = match.group(1).strip()
        value = self._evaluate_expression(expr)
        self.output.append(str(value))
        self.add_trace(f"Output: {value}")

    def _exec_receive(self, line: str):
        """Execute §receive (input) command."""
        match = self._PATTERN_RECEIVE.search(line)
        if not match:
            raise ExecutionError(f"Invalid §receive syntax at line {self.line_number}")

        var_name = match.group(1)
        if not self.input_queue:
            raise ExecutionError(f"No input available for §receive at line {self.line_number}")

        value = self.input_queue.pop(0)
        self.variables[var_name] = value
        self.add_trace(f"{var_name} = {value} (from input)")

    def _exec_array_assignment(self, match):
        """Execute array/dictionary element assignment (data["key"] ← value)."""
        var_name = match.group(1)
        index_expr = match.group(2).strip()
        value_expr = match.group(3).strip()

        if var_name not in self.variables:
            raise ExecutionError(f"Undefined variable: {var_name}")

        index = self._evaluate_expression(index_expr)
        value = self._evaluate_expression(value_expr)

        try:
            self.variables[var_name][index] = value
            self.add_trace(f"{var_name}[{index}] = {value}")
        except (KeyError, IndexError, TypeError) as e:
            raise ExecutionError(f"Cannot assign to {var_name}[{index}]: {e}")

    def _exec_assignment(self, line: str):
        """Execute variable assignment."""
        # Check for array/dictionary assignment first (data["key"] ← value)
        array_match = self._PATTERN_ARRAY_ASSIGNMENT.search(line)
        if array_match:
            self._exec_array_assignment(array_match)
            return

        # Regular variable assignment (x ← value)
        match = self._PATTERN_ASSIGNMENT.search(line)
        if not match:
            raise ExecutionError(f"Invalid assignment syntax at line {self.line_number}")

        var_name = match.group(1)
        expr = match.group(2).strip()

        # Handle special create commands
        const = XenocodeConstants
        if expr == const.CREATE_MAP:
            value = {}
        elif expr == const.CREATE_ARRAY:
            value = []
        elif expr == const.NULL:
            value = None
        else:
            value = self._evaluate_expression(expr)

        self.variables[var_name] = value
        self.add_trace(f"{var_name} = {value}")

    def _exec_iterate(self, lines: List[str], start: int, end: int) -> int:
        """Execute §iterate loop."""
        line = lines[start].strip()
        match = self._PATTERN_ITERATE.search(line)

        if not match:
            raise ExecutionError(f"Invalid §iterate syntax at line {self.line_number}")

        item_var = match.group(1)
        collection_expr = match.group(2).strip()
        collection = self._evaluate_expression(collection_expr)

        # Validate collection is iterable
        if not hasattr(collection, '__iter__'):
            raise ExecutionError(f"Cannot iterate over non-iterable type: {type(collection).__name__}")

        # Find matching §end_iterate
        loop_end = self._find_block_end(lines, start, XenocodeConstants.ITERATE, XenocodeConstants.END_ITERATE)

        # Execute loop body for each item
        items = collection.keys() if isinstance(collection, dict) else collection

        for item in items:
            self.variables[item_var] = item
            self.add_trace(f"Loop: {item_var} = {item}")
            self._execute_block(lines, start + 1, loop_end)

        return loop_end + 1

    def _exec_if(self, lines: List[str], start: int, end: int) -> int:
        """Execute §if conditional."""
        line = lines[start].strip()
        match = self._PATTERN_IF.search(line)

        if not match:
            raise ExecutionError(f"Invalid §if syntax at line {self.line_number}")

        condition_expr = match.group(1).strip()
        condition = self._evaluate_expression(condition_expr)

        # Find §else and §end_if
        else_line = self._find_else(lines, start)
        endif_line = self._find_block_end(lines, start, XenocodeConstants.IF, XenocodeConstants.END_IF)

        if condition:
            self.add_trace(f"Condition true: {condition_expr}")
            block_end = else_line if else_line else endif_line
            self._execute_block(lines, start + 1, block_end)
        elif else_line:
            self.add_trace(f"Condition false: {condition_expr}")
            self._execute_block(lines, else_line + 1, endif_line)

        return endif_line + 1

    def _exec_function_def(self, lines: List[str], start: int, end: int) -> int:
        """Define a function."""
        line = lines[start].strip()
        match = self._PATTERN_FUNCTION_DEF.search(line)

        if not match:
            raise ExecutionError(f"Invalid §function syntax at line {self.line_number}")

        func_name = match.group(1)
        params_str = match.group(2)
        params = [p.strip() for p in params_str.split(',') if p.strip()]

        # Find function end
        func_end = self._find_block_end(lines, start, XenocodeConstants.FUNCTION, XenocodeConstants.END_FUNCTION)

        # Store function body
        func_body = lines[start + 1:func_end]
        self.functions[func_name] = (params, func_body)
        self.add_trace(f"Defined function: {func_name}({', '.join(params)})")

        return func_end + 1

    def _exec_function_call(self, line: str) -> Optional[Any]:
        """Execute a function call and return its value."""
        match = self._PATTERN_FUNCTION_CALL.search(line)

        if not match:
            raise ExecutionError(f"Invalid §call syntax at line {self.line_number}")

        func_name = match.group(1)
        args_expr = match.group(2)

        if func_name not in self.functions:
            raise ExecutionError(f"Undefined function: {func_name}")

        # Evaluate arguments
        args = self._parse_function_arguments(args_expr)

        # Save state
        saved_vars = self.variables.copy()
        saved_return = self.should_return
        self.return_value = None
        self.should_return = False

        # Bind parameters and execute
        params, body = self.functions[func_name]
        if len(args) != len(params):
            raise ExecutionError(
                f"Function {func_name} expects {len(params)} arguments, got {len(args)}"
            )

        for param, arg in zip(params, args):
            self.variables[param] = arg

        self.add_trace(f"Calling {func_name}({', '.join(map(str, args))})")
        self._execute_block(body, 0, len(body))

        # Restore state and capture return value
        result = self.return_value
        self.variables = saved_vars
        self.should_return = saved_return
        self.return_value = None

        return result

    def _parse_function_arguments(self, args_expr: str) -> List[Any]:
        """Parse and evaluate function arguments."""
        if not args_expr.strip():
            return []
        return [self._evaluate_expression(arg.strip()) for arg in args_expr.split(',')]

    def _evaluate_expression(self, expr: str) -> Any:
        """Evaluate an expression and return its value."""
        expr = expr.strip()

        if not expr:
            raise ExecutionError("Empty expression")

        # Try different expression types in order of specificity
        # Function call
        result = self._eval_function_call(expr)
        if result is not None:
            return result

        # Literals
        result = self._eval_string_literal(expr)
        if result is not None:
            return result

        result = self._eval_array_literal(expr)
        if result is not None:
            return result

        result = self._eval_number(expr)
        if result is not None:
            return result

        result = self._eval_boolean(expr)
        if result is not None:
            return result

        # Array/map access (before variable to handle subscripting)
        result = self._eval_array_access(expr)
        if result is not None:
            return result

        # Special operations
        result = self._eval_exists(expr)
        if result is not None:
            return result

        result = self._eval_unary_not(expr)
        if result is not None:
            return result

        # Binary operators (check before variables since they may reference undefined vars)
        result = self._eval_binary_operators(expr)
        if result is not None:
            return result

        # Variable (last, since it might be None)
        if expr in self.variables:
            return self.variables[expr]

        # If nothing matched, provide helpful error
        return self._handle_eval_error(expr)

    def _eval_function_call(self, expr: str) -> Optional[Any]:
        """Evaluate function call in expression."""
        if expr.startswith(XenocodeConstants.CALL):
            return self._exec_function_call(expr)
        return None

    def _eval_string_literal(self, expr: str) -> Optional[str]:
        """Evaluate string literal."""
        if expr.startswith('"') and expr.endswith('"') and len(expr) >= 2:
            return expr[1:-1]
        return None

    def _eval_array_literal(self, expr: str) -> Optional[List]:
        """Evaluate array literal."""
        if expr.startswith('[') and expr.endswith(']'):
            inner = expr[1:-1]
            if not inner.strip():
                return []
            elements = [self._evaluate_expression(e.strip()) for e in inner.split(',') if e.strip()]
            return elements
        return None

    def _eval_number(self, expr: str) -> Optional[float]:
        """Evaluate numeric literal."""
        try:
            return float(expr) if '.' in expr else int(expr)
        except ValueError:
            return None

    def _eval_boolean(self, expr: str) -> Optional[bool]:
        """Evaluate boolean literal."""
        if expr == XenocodeConstants.TRUE:
            return True
        if expr == XenocodeConstants.FALSE:
            return False
        return None

    def _eval_variable(self, expr: str) -> Optional[Any]:
        """Evaluate variable reference."""
        if expr in self.variables:
            return self.variables[expr]
        # Return None to continue checking other evaluators
        return None

    def _eval_array_access(self, expr: str) -> Optional[Any]:
        """Evaluate array/map access, including chained access."""
        if '[' not in expr or ']' not in expr:
            return None

        match = self._PATTERN_ARRAY_ACCESS.match(expr)
        if not match:
            return None

        # Check if array access is followed by more content (operators, etc.)
        # If so, we should NOT handle it here - let binary operators split it first
        if match.end() < len(expr):
            # There's more after the array access
            # Check if it's another array access (chaining) or an operator
            rest = expr[match.end():]
            if not rest.startswith('['):
                # It's not chaining, it's an operator or something else
                # Don't handle here, let binary operators handle it
                return None

        if match:
            var_name = match.group(1)
            index_expr = match.group(2)

            if var_name not in self.variables:
                raise ExecutionError(f"Undefined variable: {var_name}")

            index = self._evaluate_expression(index_expr)

            try:
                result = self.variables[var_name][index]

                # Check for chained access (e.g., ship["crew"]["captain"])
                # After the first [], check if there's more
                rest = expr[match.end():]
                if rest.startswith('['):
                    # Build a temporary expression with the result
                    # We'll temporarily add it to variables, evaluate, then remove
                    temp_var = f"_temp_{id(result)}"
                    self.variables[temp_var] = result
                    try:
                        chained_result = self._evaluate_expression(temp_var + rest)
                        return chained_result
                    finally:
                        del self.variables[temp_var]

                return result
            except (KeyError, IndexError, TypeError) as e:
                raise ExecutionError(f"Cannot access {var_name}[{index}]: {e}")

        return None

    def _eval_exists(self, expr: str) -> Optional[bool]:
        """Evaluate §exists check."""
        if not expr.startswith(XenocodeConstants.EXISTS):
            return None

        match = self._PATTERN_EXISTS.search(expr)
        if not match:
            return None

        check_expr = match.group(1).strip()

        try:
            if '[' in check_expr:
                var_match = self._PATTERN_ARRAY_ACCESS.match(check_expr)
                if var_match:
                    var_name = var_match.group(1)
                    key_expr = var_match.group(2)

                    if var_name not in self.variables:
                        return False

                    key = self._evaluate_expression(key_expr)
                    return key in self.variables[var_name]

            return check_expr in self.variables
        except Exception:
            return False

    def _eval_unary_not(self, expr: str) -> Optional[bool]:
        """Evaluate logical NOT."""
        if expr.startswith(XenocodeConstants.NOT):
            operand = self._evaluate_expression(expr[1:].strip())
            return not operand
        return None

    def _eval_binary_operators(self, expr: str) -> Optional[Any]:
        """Evaluate binary operators."""
        for op_def in XenocodeConstants.BINARY_OPERATORS:
            if op_def.symbol in expr:
                parts = expr.split(op_def.symbol, 1)  # Split only on first occurrence
                if len(parts) == 2:
                    try:
                        left = self._evaluate_expression(parts[0].strip())
                        right = self._evaluate_expression(parts[1].strip())
                        return op_def.operation(left, right)
                    except Exception as e:
                        raise ExecutionError(
                            f"Error in {op_def.name} operation: {e}"
                        )
        return None

    def _handle_eval_error(self, expr: str) -> None:
        """Handle evaluation errors with helpful messages."""
        # Unknown keyword
        if '§' in expr:
            keywords = self._PATTERN_KEYWORD.findall(expr)
            if keywords:
                raise ExecutionError(
                    f"Unknown Xenocode keyword: {keywords[0]}\n" +
                    f"Did you mean: §transmit, §receive, §iterate, §if, §call?"
                )

        # Has operators but couldn't evaluate
        operators = [op.symbol for op in XenocodeConstants.BINARY_OPERATORS]
        operators.append(XenocodeConstants.NOT)

        if any(op in expr for op in operators):
            raise ExecutionError(
                f"Cannot evaluate expression: {expr}\n" +
                f"Check that all variables are defined."
            )

        # Generic error
        raise ExecutionError(
            f"Cannot evaluate: {expr}\n" +
            f"This might be an undefined variable or unsupported operation."
        )

    def _find_block_end(self, lines: List[str], start: int, begin_keyword: str, end_keyword: str) -> int:
        """Find the matching end statement for a block."""
        depth = 0
        block_starts = [XenocodeConstants.IF, XenocodeConstants.ITERATE, XenocodeConstants.FUNCTION]
        block_ends = [XenocodeConstants.END_IF, XenocodeConstants.END_ITERATE, XenocodeConstants.END_FUNCTION]

        for i in range(start, len(lines)):
            line = lines[i].strip()

            # Check if this line starts a new block
            if any(line.startswith(keyword) for keyword in block_starts):
                depth += 1
            # Check if this line ends any block
            elif any(line.startswith(end) for end in block_ends):
                if line.startswith(end_keyword):
                    depth -= 1
                    if depth == 0:
                        return i
                else:
                    # This is an end for a nested block, decrement depth
                    depth -= 1

        raise ExecutionError(f"No matching {end_keyword} found for {begin_keyword}")

    def _find_else(self, lines: List[str], if_start: int) -> Optional[int]:
        """Find §else for an §if statement."""
        depth = 0

        for i in range(if_start, len(lines)):
            line = lines[i].strip()

            if line.startswith(XenocodeConstants.IF):
                depth += 1
            elif line.startswith(XenocodeConstants.END_IF):
                depth -= 1
                if depth == 0:
                    return None
            elif line.startswith(XenocodeConstants.ELSE) and depth == 1:
                return i

        return None