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

