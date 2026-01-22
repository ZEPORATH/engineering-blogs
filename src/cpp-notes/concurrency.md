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

