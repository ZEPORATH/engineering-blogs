## Attributes & Bit Tricks

### Compiler Attributes (`[[nodiscard]]`, `[[likely]]`, `alignas`, etc.)

Modern C++ introduces attributes to tell the compiler (and readers) about intent or special handling of code. These improve code safety, help with optimizations, or suppress warnings.

- `[[nodiscard]]`
    - If a function's return value is `[[nodiscard]]`, ignoring it produces a warning/error.
    ```cpp
    [[nodiscard]] int compute();
    compute(); // warning: result unused
    ```

- `[[maybe_unused]]`
    - Suppress warnings for unused variables or functions.

    ```cpp
    [[maybe_unused]] int x = compute();
    ```

- `[[likely]]` and `[[unlikely]]` (C++20)
    - Hints to the compiler about which branch is more probable.

    ```cpp
    if (condition [[likely]]) {
        // more likely branch
    } else {
        // less likely branch
    }
    ```

- `alignas`, `alignof`
    - Specify or query memory alignment.

    ```cpp
    alignas(16) struct S { int a[4]; };
    static_assert(alignof(S) == 16);
    ```

- `__attribute__((warn_unused_result))`, `__attribute__((packed))`
    - GCC/Clang extensions for similar purposes.

### Bitwise Operations

Bitwise operators are low-level tools for manipulating data at the bit level.

| Operator     | Purpose                       |
| ------------ | ---------------------------- |
| `&`          | Bitwise AND                   |
| `|`          | Bitwise OR                    |
| `^`          | Bitwise XOR                   |
| `~`          | Bitwise NOT (complement)      |
| `<<`         | Left shift                    |
| `>>`         | Right shift (sign-propagating)|

**Examples:**

```cpp
unsigned x = 0b1010;

// Set bit 2
x |= (1 << 2); // x is now 0b1110

// Clear bit 1
x &= ~(1 << 1); // x is now 0b1100

// Toggle bit 0
x ^= (1 << 0); // x is now 0b1101

// Check if bit 1 is set
bool b = (x & (1 << 1)) != 0; // false
```

### Bit Flags / Enum Flags

Bit flags allow you to store multiple boolean options efficiently within a single integer.

#### Defining and using bit flags:

```cpp
enum Permission : unsigned {
    Read    = 1 << 0, // 0b0001
    Write   = 1 << 1, // 0b0010
    Execute = 1 << 2, // 0b0100
};

// Combine flags
unsigned mode = Read | Write;

// Check if flag is set
if (mode & Write) { /* ... */ }

// Remove a flag
mode &= ~Read;

// Toggle a flag
mode ^= Execute;
```

#### C++11: `enum class` with bitwise operators

C++ does not automatically provide bitwise operators for `enum class`. If needed, define them:

```cpp
enum class Options : uint32_t {
    None    = 0,
    Alpha   = 1 << 0,
    Beta    = 1 << 1,
    Gamma   = 1 << 2,
};

inline Options operator|(Options a, Options b) {
    return static_cast<Options>(static_cast<uint32_t>(a) | static_cast<uint32_t>(b));
}
```

---


## Optional Additions

### std::function and std::bind

- **`std::function`**: A type-erased, copyable wrapper for any callable object—functions, lambdas, bind expressions, or functors:
    ```cpp
    #include <functional>
    void foo(int x) { /* ... */ }
    std::function<void(int)> f = foo;
    f(42);

    auto lambda = [](int x) { return x + 1; };
    std::function<int(int)> g = lambda;
    int res = g(5); // 6
    ```

- **`std::bind`**: Creates callable objects with some arguments "pre-set" (partial application).
    ```cpp
    #include <functional>
    void add(int a, int b);
    auto add_five = std::bind(add, 5, std::placeholders::_1);
    add_five(7); // equivalent to add(5, 7)
    ```

- **When to use?**
    - Passing callbacks to APIs, event handlers in GUI/networking code, implementing generic function containers (like command patterns).

### Coroutine Basics (`co_yield`, `co_return`, `co_await`)

Coroutines (C++20) enable asynchronous and lazy computations by allowing functions to suspend/resume.

**Examples:**

```cpp
#include <coroutine>
#include <iostream>

struct Generator {
    struct promise_type {
        int current_value;
        auto get_return_object() { return Generator{Handle::from_promise(*this)}; }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(int value) { current_value = value; return {}; }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using Handle = std::coroutine_handle<promise_type>;
    Handle h;

    Generator(Handle h): h(h) {}
    ~Generator() { if (h) h.destroy(); }

    bool next() {
        if (!h.done()) h.resume();
        return !h.done();
    }
    int value() const { return h.promise().current_value; }
};

Generator numbers() {
    for (int i = 0; i < 3; ++i)
        co_yield i;
}

int main() {
    auto g = numbers();
    while (g.next())
        std::cout << g.value() << std::endl;
}
```

- `co_yield`: produces a value, suspends coroutine, resumes later.
- `co_return`: completes the coroutine, can return a value.
- `co_await`: suspends until an awaited operation completes (used for async IO, etc.).

### RAII and Scope Guards

**RAII (Resource Acquisition Is Initialization):**
- C++ idiom—resources are tied to object lifetimes.
- Constructor acquires resource, destructor releases.

**Example:**

```cpp
class FileGuard {
    FILE* f;
public:
    FileGuard(const char* fname) : f(fopen(fname, "r")) {}
    ~FileGuard() { if (f) fclose(f); }
    FILE* get() const { return f; }
};

void read_something() {
    FileGuard guard("data.txt");
    // Use guard.get()
    // File is auto-closed at scope exit, even on exceptions.
}
```

**Scope Guards** (C++17): Use lambdas or utilities (`std::unique_ptr` with custom deleter, `boost::scope_exit`, etc.) for cleanup code on scope exit.

```cpp
#include <iostream>
#include <functional>

void f() {
    auto cleanup = []{ std::cout << "Done!\n"; };
    // ... code ...
    cleanup();
}
```
Or, with C++14/C++17:
```cpp
auto guard = std::unique_ptr<void, decltype([](void*){ cleanup(); })>(
    nullptr, [](void*){ cleanup(); });
```

### PImpl Idiom (Pointer to Implementation)

**PImpl (Private Implementation) idiom** hides implementation details and reduces compile-time dependencies.

**Example:**

```cpp
// In header:
class MyClass {
    struct Impl;
    std::unique_ptr<Impl> impl;
public:
    MyClass();
    ~MyClass();
    void foo();
};
```
```cpp
// In source:
struct MyClass::Impl {
    // data, methods
};
MyClass::MyClass() : impl(new Impl) {}
MyClass::~MyClass() = default;
void MyClass::foo() { /* impl->... */ }
```
- Changes to `Impl` don't force recompilation of code including the header.
- Reduces header bloat, speeds up builds.

### C++ Modules (C++20+)

**C++20 Modules** provide a new way to organize code for better reuse and compilation speed (instead of textual `#include`s).

**Basic module usage:**

```cpp
// math.ixx
export module math;
export int add(int a, int b) { return a + b; }
```
```cpp
// use.cpp
import math;
#include <iostream>
int main() {
    std::cout << add(3, 4) << std::endl; // prints 7
}
```
- `export module <name>;` declares a module.
- `export` exposes functions/types to importers.
- Use `import <name>;` instead of `#include`.
- Faster builds, no ODR problems, can better encapsulate private/internal details.


