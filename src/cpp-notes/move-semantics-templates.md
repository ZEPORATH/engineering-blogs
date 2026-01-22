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

