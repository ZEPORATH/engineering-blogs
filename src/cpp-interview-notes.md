# C++ Interview Preparation Notes

Quick reference notes for C++ topics to help with interview preparation. This section covers fundamental to advanced C++ concepts with practical examples for professionals, so don't expect everything here. It's a helpful bookkeeping for me in both appearing or taking an interview.

---

## Basics (Revision)

### OOP Concepts (Encapsulation, Inheritance, Polymorphism)

#### Encapsulation
- Bundle data + methods together
- Control access via `private`, `protected`, `public`
- Expose behavior, hide implementation

```cpp
class A {
private:
    int x;
public:
    void set(int v) { x = v; }
    int get() const { return x; }
};
```

#### Inheritance
- Derive new class from existing one
- Reuse and extend behavior

```cpp
class Base {
public:
    void foo() {}
};

class Derived : public Base {
};
```

#### Polymorphism
- Same interface, different behavior
- Achieved via virtual functions and base-class pointers

```cpp
class Base {
public:
    virtual void f() { }
    virtual ~Base() = default;
};

class Derived : public Base {
public:
    void f() override { }
};

Base* b = new Derived();
b->f(); // calls Derived::f()
```

**Key points:**
- Use `virtual` for runtime polymorphism
- Use `override` to catch mistakes
- Always have a virtual destructor in polymorphic bases

---

## Memory Management & RAII

### RAII (Resource Acquisition Is Initialization)
RAII is a C++ programming technique which binds the life cycle of a resource (memory, file handles, sockets, etc.) to the lifetime of an object.
- **Resource Acquisition**: Occurs in the constructor.
- **Resource Release**: Occurs in the destructor (guaranteed even if exceptions are thrown).

### Smart Pointers
Modern C++ uses smart pointers to manage heap memory automatically.
- `std::unique_ptr`: Exclusive ownership (non-copyable, only movable).
- `std::shared_ptr`: Shared ownership (uses reference counting).
- `std::weak_ptr`: Non-owning reference to an object managed by `shared_ptr` (prevents cyclic dependencies).

#### Custom shared_ptr Implementation (Simplified)
A quick example to demonstrate reference counting logic:

```cpp
template <typename T>
class CustomSharedPtr {
    T* ptr;
    int* ref_count;

    void release() {
        if (ref_count && --(*ref_count) == 0) {
            delete ptr;
            delete ref_count;
            ptr = nullptr;
            ref_count = nullptr;
        }
    }

public:
    explicit CustomSharedPtr(T* p = nullptr) 
        : ptr(p), ref_count(p ? new int(1) : nullptr) {}

    // Copy Constructor: Increment reference count
    CustomSharedPtr(const CustomSharedPtr& other) 
        : ptr(other.ptr), ref_count(other.ref_count) {
        if (ref_count) (*ref_count)++;
    }

    // Move Constructor: Transfer ownership without incrementing count
    CustomSharedPtr(CustomSharedPtr&& other) noexcept 
        : ptr(other.ptr), ref_count(other.ref_count) {
        other.ptr = nullptr;
        other.ref_count = nullptr;
    }

    ~CustomSharedPtr() { release(); }

    T& operator*() const { return *ptr; }
    T* operator->() const { return ptr; }
    int use_count() const { return ref_count ? *ref_count : 0; }
};
```

---

## Move Semantics & Perfect Forwarding

### Copy Constructor vs Move Constructor

```cpp
class MyClass {
    int* data;
public:
    // Copy Constructor: Deep copy
    MyClass(const MyClass& other) : data(new int(*other.data)) {}
    
    // Move Constructor: Transfer ownership (steal resources)
    MyClass(MyClass&& other) noexcept : data(other.data) {
        other.data = nullptr; // Leave moved-from object in valid state
    }
    
    // Copy Assignment
    MyClass& operator=(const MyClass& other) {
        if (this != &other) {
            delete data;
            data = new int(*other.data);
        }
        return *this;
    }
    
    // Move Assignment
    MyClass& operator=(MyClass&& other) noexcept {
        if (this != &other) {
            delete data;
            data = other.data;
            other.data = nullptr;
        }
        return *this;
    }
    
    ~MyClass() { delete data; }
};
```

### std::move

Converts an lvalue to an rvalue reference, enabling move semantics:

```cpp
#include <utility>

MyClass obj1;
MyClass obj2 = std::move(obj1); // Calls move constructor
// obj1 is now in moved-from state (valid but unspecified)
```

**Key points:**
- `std::move` doesn't move anything—it just casts to rvalue reference
- The move constructor/assignment actually performs the move
- After move, the source object should be left in a valid but unspecified state

### std::forward

Perfect forwarding: preserves the value category (lvalue/rvalue) of function arguments:

```cpp
#include <utility>

template<typename T>
void wrapper(T&& arg) {
    // Forward preserves lvalue/rvalue nature of arg
    actual_function(std::forward<T>(arg));
}

// Usage:
int x = 10;
wrapper(x);           // T = int&, forwards as lvalue
wrapper(10);          // T = int, forwards as rvalue
wrapper(std::move(x)); // T = int, forwards as rvalue
```

### Perfect Forwarding Pattern

```cpp
template<typename T, typename... Args>
std::unique_ptr<T> make_unique(Args&&... args) {
    return std::unique_ptr<T>(
        new T(std::forward<Args>(args)...)
    );
}
```

**When to use:**
- `std::move`: When you want to transfer ownership (move semantics)
- `std::forward`: In template functions to preserve argument value category (perfect forwarding)

---

## Templates

### Variadic Templates

#### Recursive Approach

```cpp
#include <iostream>

// Base case (terminating function) for the recursion
void print() {
    std::cout << "I am the empty function and I am called at last." 
              << std::endl;
}

template<typename T, typename... Args>
void print(T firstArg, Args... restArgs) {
    std::cout << firstArg << std::endl;
    print(restArgs...); // Recursive call with the rest of the arguments
}

int main() {
    print(1, 2.5, "hello", 4);
    // This expands recursively at compile time:
    // 1. print(1, 2.5, "hello", 4) -> prints 1, calls print(2.5, "hello", 4)
    // 2. print(2.5, "hello", 4) -> prints 2.5, calls print("hello", 4)
    // 3. print("hello", 4) -> prints "hello", calls print(4)
    // 4. print(4) -> prints 4, calls print()
    // 5. print() -> calls the base case function and stops the recursion
}
```

#### C++17 Fold Expression

```cpp
#include <iostream>

template<typename... Args>
void print(Args... args) {
    ((std::cout << args << std::endl), ...);
}

int main() {
    print(1, 2.5, "hello", 4);
}
```

### Variadic Template Specialization

```cpp
template<typename... Args>
// Specialization implementation
```

### Concepts (C++20)

#### 1. Conditionally Enabled Functions

You can use concepts to define functions that are only available for types that meet certain criteria. The compiler automatically selects the most appropriate function (overload resolution) or simply ignores the function if the concept is not satisfied.

```cpp
#include <iostream>
#include <concepts>
#include <string>

// Define a concept for "printable" types that support operator<<
template <typename T>
concept Printable = requires(std::ostream& os, T v) {
    { os << v } -> std::same_as<std::ostream&>;
};

// This function is only available for Printable types
template <Printable T>
void print_value(const T& value) {
    std::cout << "Value:" << value << std::endl;
}

// This generic function acts as a fallback for non-printable types
template <typename T>
void print_value(const T& value) {
    std::cout << "Cannot print value of this type." << std::endl;
}

int main() {
    print_value(42); // Uses the Printable version
    print_value(std::string("hello")); // Uses the Printable version
    
    // Example of a custom type that might not be printable by default
    struct NonPrintableType {};
    print_value(NonPrintableType{}); // Uses the generic fallback version
}
```

#### 2. Conditionally Available Class Members

Concepts allow you to make specific member functions of a class template conditionally available, which was previously difficult with older C++ standards.

```cpp
#include <memory>
#include <concepts>

template <typename T>
class Optional {
public:
    // The copy constructor is only defined if T is copy constructible
    Optional(const Optional&) requires std::copy_constructible<T> {
        // implementation for copyable T
    }
    // ... other members
};
```

### Conditional Templates

#### if constexpr (C++17+) - Compile-time branching

```cpp
#include <iostream>
#include <type_traits>

template<typename T>
void process(T t) {
    if constexpr (std::is_integral_v<T>) {
        std::cout << "integral: " << t << '\n';
    } else {
        std::cout << "other: " << t << '\n';
    }
}
```

### Type Deduction & Decay

Type Deduction & Decay in C++ refers to the compiler automatically figuring out a variable's type (deduction, e.g., `auto`), and how certain types, especially arrays and references, transform (decay) into simpler pointer types when passed to functions or used in expressions, often dropping `const`/`volatile` qualifiers, which is crucial for generic programming with templates and `auto`.

#### How it works

- `decltype(expression)`: Gets the type of the expression, preserving qualifiers and references (e.g., `int&` becomes `int&`, `const int[4]` becomes `const int[4]`).
- `std::decay<T>`: A type trait that transforms T by:
  - Removing `const`/`volatile`
  - Converting arrays to pointers (e.g., `int[4]` → `int*`).
  - Converting function types to function pointers (e.g. `int(int)` → `int(*)(int)`).
- `std::decay_t<T>` (C++14): A convenient alias for `std::decay<T>::type`.

#### Example Usage (Checking Function Arguments)

This is useful for creating generic functions that need to know the underlying value type, like `std::thread` does.

```cpp
#include <type_traits>
#include <iostream>

template<typename T>
void process_arg(T arg) {
    // std::decay_t<T> gets the "pass-by-value" type
    using DecayedType = std::decay_t<T>;
    std::cout << "Original type (T): " << typeid(T).name() << std::endl;
    std::cout << "Decayed type: " << typeid(DecayedType).name() << std::endl;
    
    // Example: Check if it's an array decayed to a pointer
    if constexpr (std::is_array_v<T>) {
        std::cout << "Argument was an array." << std::endl;
    }
    
    // Check if the decayed type is a pointer (after array decay)
    if constexpr (std::is_pointer_v<DecayedType>) {
        std::cout << "Decayed type is a pointer." << std::endl;
    }
}

template<typename Func, typename... Args>
void wrapper_func(Func f, Args... args) {
    // Use decay to simulate how arguments are passed to a thread or similar
    // std::decay_t<Args>... gets the decayed types of all arguments
    // std::invoke(f, std::forward<Args>(args)...);
    // Standard library uses decay internally for some things
    // We can check the types before passing them
    (process_arg(args), ...); // Process each argument
}

int main() {
    int arr[] = {1, 2, 3};
    const int& const_ref = arr[0];
    
    // Passing by value (copies)
    process_arg(arr); // arr decays to int*
    process_arg(const_ref); // const_ref decays to int
    
    std::cout << "\n--- Wrapper Function ---" << std::endl;
    wrapper_func([](int, int*){}, 10, arr); // Calls process_arg(10) and process_arg(arr)
    
    return 0;
}
```

### Type Traits

```cpp
#include <type_traits>

// Common type traits
std::is_arithmetic_v<T>
std::is_integral_v<T>
std::is_floating_point_v<T>
std::is_pointer_v<T>
std::is_reference_v<T>
std::is_array_v<T>
std::is_same_v<T, U>
```

### Move Semantics (std::move, std::forward, Move/Copy Constructors)

Move semantics allow transferring resources instead of copying them, significantly improving performance by avoiding deep copies.

#### Copy vs Move Constructors
```cpp
class MyBuffer {
    int* data;
    size_t size;
public:
    MyBuffer(size_t s) : size(s), data(new int[s]) {}
    ~MyBuffer() { delete[] data; }

    // Copy Constructor: Deep copy of data
    MyBuffer(const MyBuffer& other) : size(other.size) {
        data = new int[size];
        std::copy(other.data, other.data + size, data);
    }

    // Move Constructor: Steal data and nullify original
    MyBuffer(MyBuffer&& other) noexcept : data(other.data), size(other.size) {
        other.data = nullptr;
        other.size = 0;
    }
};
```
Note: it is your responsibility to nullify the passed data in case of move constructor.

#### std::move vs std::forward
- **`std::move`**: Unconditionally casts its argument to an rvalue. It tells the compiler: "I don't need this value anymore, feel free to steal its resources."
- **`std::forward`**: Conditionally casts its argument to an rvalue only if it was originally an rvalue. Used in templates for **Perfect Forwarding**.

```cpp
// std::move example
std::string str = "Hello";
std::vector<std::string> vec;
vec.push_back(std::move(str)); // str is now in a valid but unspecified state

// std::forward example (Perfect Forwarding)
template <typename T>
void wrapper(T&& arg) {
    // If 'arg' was an lvalue, std::forward passes it as lvalue
    // If 'arg' was an rvalue, std::forward passes it as rvalue
    process(std::forward<T>(arg));
}
```

### Typesafe Methods and Function Tagging
#### Key Points

- No runtime overhead
- Errors at compile time
- Improves API correctness
- Prefer tags over bool flags

#### 1. Empty structs used only for type differentiation.
```cpp
struct FastTag {};
struct SafeTag {};

void process(int x, FastTag) {
    // fast path
}

void process(int x, SafeTag) {
    // safe path
}

process(10, FastTag{});
process(10, SafeTag{});
```
#### 2. Strong Typedefs (type safety)

- Prevent mixing logically different values.
```cpp
struct UserId {
    int value;
};

struct OrderId {
    int value;
};

void fetch(UserId);
void fetch(OrderId);

// fetch({1});           // ERROR
fetch(UserId{1});        // OK
```
#### 3. Tag Dispatch via Traits
```cpp
#include <type_traits>

template<typename T>
void foo(T t) {
    foo_impl(t, std::is_integral<T>{});
}

template<typename T>
void foo_impl(T t, std::true_type) {
    // integral version
}

template<typename T>
void foo_impl(T t, std::false_type) {
    // non-integral version
}
```
#### 4. Named Parameters via Tags
```cpp
struct Timeout { int ms; };
struct Retries { int count; };

void connect(Timeout t, Retries r) {}

connect(Timeout{100}, Retries{3}); // order-safe, type-safe
```
---

## Inheritance

### Shared/Virtual Inheritance
In C++, "shared inheritance" is not a standard term but generally refers to the use of virtual inheritance. Virtual inheritance is a technique specifically designed to solve the "diamond problem" in multiple inheritance scenarios, ensuring that a class sharing a common base class through multiple paths contains only one, shared instance of that base. 
#### Regular Inheritance vs. Virtual Inheritance
In a standard (regular) multiple inheritance setup where a class inherits from two parent classes that share a common grandparent class, the most derived class ends up with two separate copies of the grandparent's members, one from each parent. This leads to ambiguity when trying to access those members. 
**The Diamond Problem**

Consider the following hierarchy (the "diamond"):

    Class A is a base class.
    Classes B and C both inherit from A.
    Class D inherits from both B and C. 

Without virtual inheritance, an object of class D will contain two distinct A sub-objects, one via B and one via C. This causes a compilation error if you try to access a member of A directly through a D object, as the compiler doesn't know which path to use (e.g., `obj.B::show()` or `obj.C::show()`)

**The Solution: Virtual Inheritance**

To resolve this ambiguity, you use the virtual keyword when declaring the inheritance from the common base class in the intermediate classes
```cpp
#include <iostream>

class A {
public:
    void show() {
        std::cout << "Class A" << std::endl;
    }
};

// B and C virtually inherit from A
class B : virtual public A {};
class C : virtual public A {};

class D : public B, public C {};

int main() {
    D obj;
    obj.show(); // ✅ No ambiguity now! Calls the single shared instance of A::show()
    return 0;
}
```
---
## Vtable and Vptr

**`vtable`**: 
The `vtable` is a static lookup table of function pointers created by the compiler for each class that has one or more virtual functions. 
- **Per Class**: Only one vtable exists per class, shared by all objects of that class.
- **Contents**: Each entry in the vtable holds the address of the most-derived implementation of a virtual function accessible by that class.
- **Construction**: It is built at compile time

**`vptr`**: 
 `vptr` (often called `__vptr` or vtable pointer) is a hidden data member added by the compiler to every object of a class that has virtual functions. 

- **Per Object**: Each instance of a polymorphic class gets its own vptr.
- **Initialization**: When an object is constructed, its constructor automatically initializes its vptr to point to the correct vtable for its specific class.
- **Location**: The vptr is typically placed at the beginning of the object's memory layout, increasing the object's size by the size of a pointer

```cpp
struct Base {
    virtual void f();
};

struct Derived : Base {
    void f() override;
};
```
#### Memory (conceptual):
```cpp
[ vptr ] -> Base/Derived vtable
[ data ]
```
#### How virtual call works
```cpp
Base* b = new Derived();
b->f();
```
#### Steps at runtime:
- Read `b->vptr` (from the object)
- Index into `vtable` for `f`
- Call function pointer found there (`Derived::f`)

#### Why this is runtime polymorphism
The exact function to call is not known at compile time.
It depends on the dynamic type of the object, decided at runtime.

* Compiler generates indirect call:

`call [vptr + offset]`

* Compile-time polymorphism:
```cpp
template<typename T>
void f(T& t) { t.f(); }
```

- Note: Function chosen at compile time, no indirection.

#### What is “runtime” here

- Object is constructed → `vptr` set
- Call happens through pointer/reference
- Target resolved during execution, not compilation

#### Key clarifications

- `vtable` layout is compile-time
- `vptr` value is set at runtime
- Function resolution happens via runtime indirection

#### Costs
- One pointer per object
- One indirection per virtual call
- No inlining (usually)

#### Summary
- `vtable` exists at compile time
- `vptr` + `indirect call` makes dispatch runtime
- That indirection is the “runtime” in runtime polymorphism
---

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

## Functional Programming

### std::variant

`std::variant` is a type-safe union, introduced in C++17, that can hold one value out of a set of (unrelated) types at a time. It is often used to represent sum types or tagged unions in C++.

**Example:**
```cpp
#include <variant>
#include <string>
#include <iostream>

using MyVariant = std::variant<int, double, std::string>;

void print_variant(const MyVariant& v) {
    std::visit([](const auto& val) { std::cout << val << std::endl; }, v);
}

int main() {
    MyVariant v = 42;
    print_variant(v);     // prints 42

    v = 3.14;
    print_variant(v);     // prints 3.14

    v = "hello";
    print_variant(v);     // prints hello
}
```

**Key Features:**
- Enforces the active type (access with `std::get<T>` or `std::visit`)
- Throws `std::bad_variant_access` on type mismatch
- Can be used to replace a union with type-safety

---

### Templated Lambdas

Templated lambdas (generic lambdas) allow you to write lambdas with `auto` in the parameter list. Introduced in C++14, extended in C++20 with explicit template syntax.

**C++14 Example:**
```cpp
auto print = [](const auto& x) {
    std::cout << x << std::endl;
};

print(1);        // prints 1
print("hello");  // prints hello
```

**C++20 Example with explicit templates:**
```cpp
auto add = []<typename T, typename U>(T t, U u) {
    return t + u;
};

std::cout << add(3, 4.2) << std::endl; // prints 7.2
```

**Use-cases:**
- Cleaner functional transformations (with STL)
- Works nicely with algorithms taking callable objects
- Great for type deduction and generic code

---

### std::ranges (Full Understanding)

`<ranges>` (C++20) radically modernizes algorithms and views in C++. It provides composable, type-safe, lazy operations over containers.

**Key Concepts:**
- **View:** A lightweight, non-owning “window”/adapter over a sequence (container or another view)
- **Range-based algorithms:** Algorithms that work directly on ranges, not just pairs of iterators

**Common Ranges:**
- `std::views::filter`, `std::views::transform`, `std::views::take`, `std::views::drop` etc.

**Example:**
```cpp
#include <ranges>
#include <vector>
#include <iostream>

int main() {
    std::vector<int> v = {1, 2, 3, 4, 5, 6};

    // Compose pipeline: filter evens, square, take first 2
    auto result = v | std::views::filter([](int x){ return x % 2 == 0; })
                    | std::views::transform([](int x){ return x * x; })
                    | std::views::take(2);

    for (int n : result) {
        std::cout << n << ' '; // Output: 4 16
    }
    std::cout << std::endl;
}
```

**Features:**
- Ranges are lazy (do not copy underlying data)
- Enable expressive functional-style code (composable, pipeline-friendly)
- Provide compile-time type safety for sequence transformation

**Good to Know:**
- Ranges work best with modern C++ standard library and containers
- You can write your own range adaptors and compose them


---

## Concurrency

### Memory Ordering & Read-Write Consistency

**Memory ordering** controls how reads/writes to memory from multiple threads are observed. Without proper synchronization, one thread’s write may not immediately be visible to others: the CPU, compiler, or cache might reorder instructions (for speed) in ways that break thread safety.

**Key Points:**
- **Data Race:** Multiple threads access the same memory, at least one write, without synchronization → undefined behavior.
- **Sequenced Consistency:** The default in C++; operations appear to all threads in the same order.
- **Relaxed, Acquire, Release:** std::atomic lets you specify memory_order to control visibility and reordering.  
    - **memory_order_relaxed:** No guarantees
    - **memory_order_acquire:** No reads/writes before the acquire can be moved after
    - **memory_order_release:** No reads/writes after the release can be moved before
    - **memory_order_acq_rel, memory_order_seq_cst:** More/most strict

> **Use Case:** Most concurrent code is safe just using `std::mutex` or atomic with default memory order; fine-tuning is for lock-free/wait-free or ultra-low-latency code.

---

### std::atomic, Atomic Fences

Allows lock-free, thread-safe operations on single variables. No data races if all accesses are via atomic types.

```cpp
#include <atomic>
#include <thread>
#include <iostream>

std::atomic<int> flag = 0;

void writer() {
    flag.store(1, std::memory_order_release);
}

void reader() {
    while (flag.load(std::memory_order_acquire) == 0) {} // spin until flag is set
    std::cout << "Flag set!" << std::endl;
}
```
**Atomic fences** (`std::atomic_thread_fence`) provide memory barriers even when using non-atomic variables (rare outside low-level code):
```cpp
std::atomic_thread_fence(std::memory_order_acquire);
// ... order all reads/writes before or after this point
```

---

### Mutex (std::mutex, std::shared_mutex, Read-Write Mutex)

Mutexes protect critical sections, allowing only one thread to access some code/data at a time.

- **std::mutex:** Exclusive ownership. Only one thread can lock at once.
- **std::lock_guard:** RAII pattern; auto-release.
- **std::unique_lock:** More flexible; can lock/unlock/relock.
- **std::shared_mutex (C++17+):** Multiple readers or one writer at a time.

```cpp
#include <mutex>
#include <thread>

std::mutex mtx;
int shared_val = 0;

void add() {
    std::lock_guard<std::mutex> lock(mtx); // Automatically unlocks at scope exit
    shared_val++;
}
```
**Shared mutex (multiple readers, one writer):**
```cpp
#include <shared_mutex>
std::shared_mutex rw_mtx;

void reader() {
    std::shared_lock lock(rw_mtx); // Many threads can hold shared_lock
    // read shared data
}

void writer() {
    std::unique_lock lock(rw_mtx); // Only one thread holds unique_lock
    // modify shared data
}
```

---

### Thread Safety & Reentrancy

- **Thread-safe:** Can be safely called by multiple threads *at the same time* (often uses mutexes or atomics for correctness).
- **Reentrant:** Can be interrupted and called again on the same thread (e.g., via a signal/interrupt) and still work. All reentrant functions are thread-safe, but not all thread-safe functions are reentrant.

**Why is reentrancy tricky?**  
- Any use of static/non-local/local static/global variables makes code *non-reentrant* unless protected.

```cpp
// Thread-safe, not reentrant
int counter = 0;
std::mutex mtx;
void inc() { std::lock_guard<std::mutex> _(mtx); counter++; }

// Reentrant (no shared state or statics)
void foo(int x) {
    int local = x * 2;
}
```

---

### Thread-Safe Queue

A common building block for producer/consumer. Use `std::queue` + `std::mutex` + `std::condition_variable`.

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>

template<typename T>
class ThreadSafeQueue {
    std::queue<T> q;
    mutable std::mutex mtx;
    std::condition_variable cv;
public:
    void push(T value) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            q.push(std::move(value));
        }
        cv.notify_one();
    }
    T pop() {
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock, [&]{return !q.empty();});
        T val = std::move(q.front());
        q.pop();
        return val;
    }
    bool empty() const {
        std::lock_guard<std::mutex> lock(mtx);
        return q.empty();
    }
};
```
**Usage:**  
- Multiple producer/consumer threads can safely call push/pop

---

### Thread-Safe Ring Buffer

A ring buffer (circular queue) is often used for high-performance producer/consumer patterns (e.g. logging, audio, or low-latency queues).

**Thread-safe, single-producer/single-consumer example:**

```cpp
#include <vector>
#include <atomic>

template<typename T, size_t N>
class RingBuffer {
    std::vector<T> buffer;
    std::atomic<size_t> head{0}, tail{0};
public:
    RingBuffer() : buffer(N) {}
    bool push(const T& item) {
        size_t h = head.load(std::memory_order_relaxed);
        size_t t = tail.load(std::memory_order_acquire);
        if (((h + 1) % N) == t) return false; // full
        buffer[h] = item;
        head.store((h + 1) % N, std::memory_order_release);
        return true;
    }
    bool pop(T& item) {
        size_t t = tail.load(std::memory_order_relaxed);
        size_t h = head.load(std::memory_order_acquire);
        if (t == h) return false; // empty
        item = buffer[t];
        tail.store((t + 1) % N, std::memory_order_release);
        return true;
    }
};
```
- SPSC (single-producer single-consumer) fast/no locks.  
- For MPSC/MPSC, use mutex/condition_variable in a `std::vector` or consider `concurrentqueue` libraries or lock-free tricks.


---

## Low-level Utilities

### snprintf family

- **snprintf, sprintf, vsnprintf**: Functions for formatting output to strings, safer than `sprintf` (avoids buffer overflows).
  ```cpp
  char buf[100];
  snprintf(buf, sizeof(buf), "Number: %d", 42);
  ```
  **Points:**
  - Always give buffer size to prevent overflows.
  - Returns the number of characters that would have been written if enough space was available—allows truncation checks.
  - Use `snprintf` instead of `sprintf` whenever possible.
  - Handles all the format specifiers you see in printf-family.
  - Useful for C API or embedded situations.

### String Streams

- **std::ostringstream, std::istringstream, std::stringstream:** C++ streams for manipulating strings in memory.
  ```cpp
  #include <sstream>
  int n = 42; std::ostringstream oss;
  oss << "Result: " << n;
  std::string s = oss.str();
  ```
  **Points:**
  - Safer and type-safe compared to manual `sprintf`/parsing.
  - Automatic type conversions, builds up strings with `<<` operator.
  - `std::istringstream` for parsing from a string (like tokenizing).
  - Can overload `operator<<`/`operator>>` to control your class's string conversions.
  - Avoids format string bugs.

### Ordering in Streams

- **Streams maintain internal order** — Output/inputs are processed in the order streamed.
- Manipulators (like `std::setw`, `std::fixed`, etc) alter formatting:
  ```cpp
  #include <iomanip>
  std::cout << std::setw(6) << 7; // prints "     7"
  ```
- **Points:**
  - Output is ordered left-to-right as written in code.
  - Buffering can affect *when* output appears (flush with `std::endl` or `std::flush`).
  - Locale and formatting (number separators, precision, etc) can be controlled per-stream.

### Character Buffers vs Data Buffers (Efficiency)

- **Character Buffer**: Array of bytes/chars (e.g. `char buf[256]`)
- **Data Buffer**: Can be more general (raw memory, binary blobs, `std::vector<uint8_t>`)
- **Points:**
  - For *text*: prefer `std::string` or `std::ostringstream` for safety and flexibility.
  - For *binary*: use `std::vector<uint8_t>`, proper alignment and manual memory management.
  - Avoid fixed-size C arrays unless required; prefer RAII types.
  - For I/O efficiency, minimize copy and prefer direct read/write using pointers if safe.

### Argument Passing Techniques

- **Pass by Value**: Copies the argument (may be expensive for large objects).
- **Pass by Reference (&)**: No copy, can modify original.
- **Pass by Const Reference (const &)**: No copy, can’t modify.
- **Pass by Pointer (\*)**: Similar to reference, but can be nullptr (useful for optional arguments).
- **Pass by Rvalue Reference (&&)**: For move semantics.
- **Points:**
  - For small/primitive types, pass by value (int, double, etc.).
  - For large objects, pass by `const&` unless modification/move is wanted.
  - For ownership transfer, use move semantics (`&&`).
  - Avoid `const T` by value (confusing, wasteful).
  - Standard C in/out patterns use pointers (`int func(int *outval)`).

---

## System Calls & C APIs

### malloc, calloc, free

- **malloc**: Allocates raw/uninitialized memory.
- **calloc**: Allocates zero-initialized memory.
- **free**: Releases memory.
  ```c
  int* arr = (int*) malloc(10 * sizeof(int));
  free(arr);
  ```
- **Points:**
  - Returns `NULL` on allocation failure.
  - Always pair `malloc/calloc` with `free`.
  - Typecasting not needed in C, but required in C++.
  - For C++, prefer `new[]`/`delete[]` or smart pointers.

### memset, memcpy

- **memset**: Sets all bytes to a value (typically for zeroing or initialization).
  `memset(buf, 0, nbytes);`
- **memcpy**: Copies raw bytes between memory regions.
  `memcpy(dst, src, nbytes);`
- **Points:**
  - Works on raw memory; use carefully (watch for struct padding or C++ class objects).
  - Fast but not type-safe. Never use with non-trivial types or STL containers.
  - Prefer `std::fill` or `std::copy` for C++ containers.

### ioctl (Input/Output Control)

- **What is ioctl?**  
  `ioctl` is a powerful Unix/Linux system call that allows user programs to send device-specific commands to file descriptors. Unlike read/write—which transfer data—ioctl provides a generic way to control hardware or kernel objects, set options, and query or alter behavior not exposed by standard APIs.

  ```c
  #include <sys/ioctl.h>
  int ret = ioctl(int fd, unsigned long request, void *arg);
  ```

- **Key concepts and uses:**
  - Often used to control or query device drivers (network interfaces, serial ports, block devices, etc).
  - The meaning of `request` and the contents of `arg` are device-specific; you must consult the specific driver header/docs.
  - Can control low-level aspects that normal read/write operations cannot, e.g. toggling special device features.

- **Examples:**
  - **Network interfaces:** Get/set interface flags, MAC addresses, or MTU on sockets.
  - **Terminals:** Setline settings (baud rate, canonical mode) with `tcsetattr`.
  - **Embedded systems:** Control GPIO pins, such as toggling output voltage or reading pin state, e.g. on a Raspberry Pi or microcontroller Linux board.
  - **Example – Setting a GPIO pin (pseudo-code):**
    ```c
    int gpio_fd = open("/dev/gpiochip0", O_RDWR);
    struct gpiohandle_request req = { ... }; // Fill with lines & flags
    ioctl(gpio_fd, GPIO_GET_LINEHANDLE_IOCTL, &req);
    ```
    *Here, device-specific request codes and data structures are used; you must consult hardware documentation.*

- **Cautions:**
  - Return value is -1 on error, with details in `errno`.
  - Not portable across devices or OS variants—requests are specific to the kernel and hardware.
  - Where possible, prefer portable or higher-level C/C++ abstractions.

---

### mmap (Memory Mapping)

- **What is mmap?**  
  `mmap` allows mapping a file or device into the process address space, enabling direct memory access to data without explicit copying or system calls for each operation—this is vital for high-throughput I/O.

  ```c
  #include <sys/mman.h>
  void* addr = mmap(NULL, length, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
  ```

- **Significance and common uses:**
  - **Zero-copy buffers:** Use in network switches/routers to provide user space applications with direct access to huge packet buffers for wire-speed traffic processing.
  - **Shared memory:** Fast IPC (Inter-Process Communication) by mapping the same file/device into multiple processes.
  - **Memory-mapped I/O:** Directly read/write device memory (framebuffers, PCI cards), critical in embedded and hardware programming.

- **Example:**
  - **Network switch buffers:**  
    Networking code for switch ASICs often uses `mmap` to map hardware packet buffers into user space, greatly reducing copy overhead and increasing throughput (used in DPDK, netmap, etc.).
  - **Simple example – mapping a file:**
    ```c
    int fd = open("data.bin", O_RDWR);
    void* buf = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    // Now buf can be accessed like a memory array.
    ```

---

### select, poll, libevent2

- **select**: Classic system call for monitoring multiple file descriptors to see if I/O is possible (read/write/exception). It modifies user-supplied sets using macros like `FD_SET`, `FD_ZERO`. Note: Limited by fixed-size sets, usually 1024 FDs.
- **poll**: Scalable alternative, overcomes select's FD_SET size cap, uses an array of `struct pollfd` for arbitrary numbers of file descriptors.
- **libevent2**: Modern, portable user-space event loop library that wraps `select`, `poll`, and more advanced OS facilities (`epoll`/`kqueue`). Handles timers, signals, and async I/O with a unified API.

- **Use-cases and notes:**
  - All are used in event-driven servers (web servers, proxies, etc.) and network programming for handling many concurrent sockets without spinning up a thread per connection.
  - `select` and `poll` are low-level; as workloads scale, use platform-specific event loops (`epoll` on Linux, `kqueue` on BSD/macOS) or libraries like `libevent2` which abstract over them.
  - Always handle errors carefully, and understand the difference between level-triggered and edge-triggered I/O for high scalability.

---

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

