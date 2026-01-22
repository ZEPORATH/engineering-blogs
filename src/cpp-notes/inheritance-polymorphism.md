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

