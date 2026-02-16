---
name: python-coder
description: Writes, refactors, and reviews Python code following strict organization guidelines (PEP 8, Type Hints, Vectorization). Use when writing Python code, refactoring existing modules, or performing code reviews.
---

# Python Coder

Enforces mandatory coding standards for all Python development. Focuses on scalability, readability, and performance.

## Quick Start

When writing or modifying Python code, ALWAYS:

1.  **Type Hint** every function and attribute (`typing` or built-ins).
2.  **Vectorize** math operations (NumPy/Pandas).
3.  **Use Generators** for large datasets.
4.  **Handle Errors** explicitly (no bare `except`).
5.  **Limit Functions** to 20-30 lines.

## Core Standards

### 1. Style & Naming (PEP 8)

- **Variables/Functions**: `snake_case` (e.g., `user_id`, `calculate_metric()`)
- **Classes**: `PascalCase` (e.g., `DataProcessor`)
- **Constants**: `UPPER_CASE` (e.g., `MAX_RETRIES`)
- **Private Members**: Prefix with `_` (e.g., `_internal_cache`)

### 2. Type Safety (Mandatory)

- Must use type hints for **all** signatures.
- Use `Optional` for nullable values.
- Use `List`, `Dict`, `Tuple`, `Iterable`, `Iterator` from `typing`.

```python
from typing import List, Dict, Optional

def fetch_metadata(user_ids: List[int]) -> Dict[int, str]:
    result: Dict[int, str] = {}
    return result
```

### 3. Error Handling

- **NEVER** use bare `except:`.
- Catch specific exceptions (`ValueError`, `FileNotFoundError`).
- Log errors using `utils.logger.get_logger()`.
- **Re-raise** if recovery is impossible.

```python
from utils.logger import get_logger

log = get_logger()
try:
    data = load_json()
except (ValueError, FileNotFoundError) as e:
    log.error(f"Failed to load: {e}")
    raise
```

## Performance & Efficiency

### 1. Membership Checking

- **Rule**: Use `set` for lookups, never `list`.
  - BAD: `if x in [1, 2, ...]:` (O(n))
  - GOOD: `if x in {1, 2, ...}:` (O(1))

### 2. Generators

- **Rule**: Use `yield` for large streams. Do not materialize large lists.

```python
from typing import Iterator

def stream_logs() -> Iterator[str]:
    with open("huge.log") as f:
        for line in f:
            yield line
```

### 3. Vectorization

- **Rule**: Avoid Python loops for math. Use NumPy/Pandas.

```python
import numpy as np

# BAD
squared = [x ** 2 for x in data]

# GOOD
arr = np.array(data)
squared = arr ** 2
```

## Architecture & Modularity

- **Single Responsibility Principle (SRP)**: Functions must do ONE thing.
- **Line Limit**: Functions must be **20-30 lines** maximum. Refactor if longer.
- **No God Classes**: Split excessive logic into specialized classes (`EmailService`, `PaymentProcessor`).
- **Dependency Injection**: Depend on abstractions.

## Refactoring Checklist

When reviewing or modifying existing code:

1.  [ ] **Break up** functions > 30 lines.
2.  [ ] **Add type hints** to all untyped functions.
3.  [ ] **Replace** list lookups with set lookups.
4.  [ ] **Replace** loops with vectorized operations where possible.
5.  [ ] **Remove** bare `except:` blocks; replace with specific catches + logging.
6.  [ ] **Rename** variables/classes to match PEP 8.
