#!/usr/bin/env python3
"""
Test runner for The Shadowed Keep.
Discovers and runs all tests, provides coverage information.
"""
import unittest
import sys
import os
import time
from io import StringIO


class TestResult(unittest.TextTestResult):
    """Custom test result class for better output."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.test_times = []
        
    def startTest(self, test):
        self._start_time = time.time()
        super().startTest(test)
        
    def stopTest(self, test):
        elapsed = time.time() - self._start_time
        self.test_times.append((test, elapsed))
        super().stopTest(test)


class ColoredTextTestRunner(unittest.TextTestRunner):
    """Test runner with colored output."""
    
    def __init__(self, *args, **kwargs):
        kwargs['resultclass'] = TestResult
        super().__init__(*args, **kwargs)
        
    def run(self, test):
        """Run tests with colored output."""
        result = super().run(test)
        
        # Print summary with colors
        if result.wasSuccessful():
            print("\n\033[92m✓ All tests passed!\033[0m")
        else:
            print("\n\033[91m✗ Some tests failed!\033[0m")
            
        # Print timing information
        if hasattr(result, 'test_times') and result.test_times:
            print("\nTest execution times:")
            for test, elapsed in sorted(result.test_times, key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {test.id()}: {elapsed:.3f}s")
                
        return result


def discover_and_run_tests():
    """Discover and run all tests in the project."""
    # Get the directory containing this script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    test_dir = os.path.join(base_dir, 'tests')
    
    # Discover tests
    loader = unittest.TestLoader()
    suite = loader.discover(test_dir, pattern='test_*.py')
    
    # Count tests
    test_count = suite.countTestCases()
    print(f"Discovered {test_count} tests\n")
    
    # Run tests
    runner = ColoredTextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Calculate coverage (basic version without external tools)
    print("\n" + "="*70)
    print("Test Coverage Summary")
    print("="*70)
    
    # List test files
    test_files = []
    for root, dirs, files in os.walk(test_dir):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                test_files.append(file)
                
    print(f"Test files found: {', '.join(test_files)}")
    
    # List source files that should have tests
    source_files = ['shadowkeep.py', 'combat_manager.py']
    tested_files = []
    untested_files = []
    
    for source in source_files:
        test_name = f"test_{source.replace('.py', '')}.py"
        if test_name in test_files:
            tested_files.append(source)
        else:
            untested_files.append(source)
            
    print(f"\nSource files with tests: {', '.join(tested_files)}")
    if untested_files:
        print(f"Source files WITHOUT tests: {', '.join(untested_files)}")
        
    # Return exit code
    return 0 if result.wasSuccessful() else 1


def run_specific_test(test_name):
    """Run a specific test by name."""
    loader = unittest.TestLoader()
    
    try:
        # Try to load the specific test
        suite = loader.loadTestsFromName(test_name)
        runner = ColoredTextTestRunner(verbosity=2)
        result = runner.run(suite)
        return 0 if result.wasSuccessful() else 1
    except Exception as e:
        print(f"Error loading test '{test_name}': {e}")
        return 1


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Run specific test
        exit_code = run_specific_test(sys.argv[1])
    else:
        # Run all tests
        exit_code = discover_and_run_tests()
        
    sys.exit(exit_code)