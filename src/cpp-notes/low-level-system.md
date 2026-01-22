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

