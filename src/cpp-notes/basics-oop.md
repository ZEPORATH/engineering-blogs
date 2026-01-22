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

