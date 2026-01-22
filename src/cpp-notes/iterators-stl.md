## Iterators

### STL Iterators

STL iterators are objects (like pointers) used to traverse containers in the Standard Template Library (vector, list, map, etc). They provide a uniform interface for accessing elements.

- **Types:** `input_iterator`, `output_iterator`, `forward_iterator`, `bidirectional_iterator`, `random_access_iterator`.
- **Basic Usage Example:**

```cpp
#include <vector>
#include <iostream>
std::vector<int> v = {1, 2, 3};
for (std::vector<int>::iterator it = v.begin(); it != v.end(); ++it) {
    std::cout << *it << std::endl;
}
```

Or, with C++11:

```cpp
for (auto it = v.begin(); it != v.end(); ++it) {
    std::cout << *it << std::endl;
}
```

- **Reverse Iterators:** Use `rbegin()` and `rend()` for reverse traversal.
- **Const Iterators:** Use `cbegin()`, `cend()` for read-only access.

---

### Custom Iterators

You can define your own iterator for custom containers by providing basic functionality: dereferencing (`operator*`), increment (`operator++`), comparison, and traits.

**Minimal Input Iterator Example:**
```cpp
struct MyContainer {
    int data[3] = {10, 20, 30};
    struct Iterator {
        int* ptr;
        // Iterator traits
        using iterator_category = std::forward_iterator_tag;
        using value_type = int;
        using difference_type = std::ptrdiff_t;
        using pointer = int*;
        using reference = int&;
        // Core operations
        Iterator(int* p) : ptr(p) {}
        int& operator*() const { return *ptr; }
        Iterator& operator++() { ++ptr; return *this; }
        bool operator!=(const Iterator& other) const { return ptr != other.ptr; }
    };

    Iterator begin() { return Iterator(data); }
    Iterator end() { return Iterator(data + 3); }
};

// Usage
MyContainer c;
for (auto it = c.begin(); it != c.end(); ++it) {
    std::cout << *it << std::endl;
}
```

---

### Underlying Memory Allocator

STL containers allocate memory using allocators. By default, this is `std::allocator<T>`, but you can supply your own (for custom memory management).

**Example:**
```cpp
#include <vector>
#include <memory>

std::vector<int, std::allocator<int>> v;

struct MyAlloc : std::allocator<int> {
    // Custom allocation logic here
};
std::vector<int, MyAlloc> custom_alloc_vec;
```

- Custom allocators can help with memory pools, tracking, or placement new.
- Useful for embedded, performance-critical, or debug scenarios.

---

### Custom Comparator

Comparators allow custom sorting or ordering in containers (`std::sort`, `std::set`, `std::map`).

**Functor Example:**
```cpp
struct Desc {
    bool operator()(int a, int b) const {
        return a > b; // descending order
    }
};
std::set<int, Desc> s = {3,1,2}; // stored as 3,2,1
```

**Lambda Comparator with std::sort:**
```cpp
std::vector<int> v = {5,2,9};
std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; }); // descending
```

- Comparator must return `true` if the first argument should go before the second.
- Used to define ordering semantics for containers or algorithms.

---

---


## Constexprs & Compile-Time Evaluation

### constexpr

`constexpr` specifies that the value of a variable or function can be evaluated at compile time. `constexpr` variables are implicitly `const`.

Key rules and uses:
- A `constexpr` variable must be initialized with a constant expression
- A `constexpr` function can be evaluated at compile time if called with constant arguments, but can also run at runtime if needed at runtime (since C++14)
- Enables compile-time computation and static assertions

**Example:**
```cpp
constexpr int square(int x) { return x * x; }

constexpr int value = square(5);  // Computed at compile time

int runtime_val = square(10);  // Might be computed at runtime
```

**Compile-time array sizes:**
```cpp
constexpr size_t arr_size = 4;
int arr[arr_size]; // OK
```

**Limitations:**
- In C++11, `constexpr` functions can have only one return statement (relaxed in C++14+)
- No dynamic memory allocation inside C++11 `constexpr` functions

---

### consteval

`consteval` (since C++20) declares an **immediate function**: it *must* be evaluated at compile time, otherwise the code will not compile.

- Enforces compile-time computation
- Useful for code generation, checks, static interface validation

**Example:**
```cpp
consteval int cube(int x) { return x * x * x; }

// Always evaluated at compile time
constexpr int c = cube(3); // OK

// int d = cube(runtime_val); // ERROR: not a constant expression
```

**Contrast with `constexpr`:**
- `constexpr` functions *may* execute at compile or runtime depending on context
- `consteval` functions *must* execute at compile time

---

**When to use:**
- Use `constexpr` for functions/variables that generally should work at compile time, but are also allowed at runtime
- Use `consteval` for computations required at compile time (e.g., enforcing invariants, metaprogramming)

---

