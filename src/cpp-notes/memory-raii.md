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

