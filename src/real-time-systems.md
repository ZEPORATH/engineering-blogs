# Real-Time vs Non-Real-Time Systems: Breaking Down the Key Concepts

As software developers, we often encounter the term "real-time." But what does it truly mean from a software perspective, particularly when working with C++ in a Linux environment? What one domain considers "real-time" might not be fast enough for another.

We can categorize the real-time behavior of software into a few key areas:

- **Hard Real-Time (e.g., Airbag Deployment Systems):** In these systems, missing a deadline is catastrophic. Failure to meet timing constraints can lead to severe consequences.
- **Soft Real-Time (e.g., Sensor Data Readings for Speed):** Here, missing a deadline is tolerable, although it may degrade performance or user experience.
- **Non-Real-Time (e.g., Video Streaming Over a Dashboard):** The primary focus is on minimizing latency and maximizing throughput, rather than strict adherence to deadlines.

Ultimately, the classification of a system as hard, soft, or non-real-time depends on its criticality and the design choices made during development.

## What is REAL TIME

Real-time does not mean fast. It means predictable and guaranteed response times.
They are everywhere, from embedded devices (robot arms) to specialized servers (stock trading engines).

So if we can characterize the real-time and non-real time tasks as:

| Aspect            | Real-time Threads                                     | Non-real-time Threads               |
| ----------------- | ----------------------------------------------------- | ----------------------------------- |
| Scheduling        | Priority-based, often fixed-priority (e.g., FIFO, RR) | Fairness-based (e.g., CFS in Linux) |
| Timing Guarantees | Must meet deadlines                                   | Best-effort, no timing guarantee    |
| Preemption        | High priority to preempt lower                        | May not preempt immediately         |
| Examples          | Motor control, medical devices                        | Web servers, user applications      |

## Who enables/gives REAL TIME

It's your code where you specify for a thread to be a real-time or not. And the OS while executing will honor your demands, provided its capable of doing so.

Roles of CPU Execution vs Kernel Scheduling in real-time executions:

- CPU simply executes instructions.
- It's the OS (kernel scheduler) that determines who runs when.
- Real-time OS or Linux with real-time extensions ensures deadlines by:
  - Priority-based preemptive scheduling (`SCHED_FIFO`, `SCHED_RR`, `SCHED_DEADLINE`).
  - Avoiding blocking I/O.
  - Locking memory into RAM (`mlockall`) etc.

## Can a process on Linux have both real-time and non-real-time threads?

YES.

In Linux, each thread has its own scheduling policy (`SCHED_OTHER`, `SCHED_FIFO`, `SCHED_RR`, etc.).

So, one process can absolutely have:

- Some threads running real-time (e.g., `SCHED_FIFO` policy).
- Some threads running normal (e.g., `SCHED_OTHER` policy).

In fact, it's common to design this way:
**Real-time thread**: handles sensor readings, motor control, etc.
**Non-real-time thread**: logs data to disk, handles user input, sends reports over network

## Demo Code

Let's look at a practical example demonstrating real-time vs non-real-time threads:

```cpp
#include <iostream>
#include <thread>
#include <vector>
#include <queue>
#include <chrono>
#include <cmath>
#include <mutex>
#include <condition_variable>
#include <complex>
#include <cstring>
#include <pthread.h>
#include <sched.h>
#include <unistd.h>

using namespace std::chrono_literals;

// Shared data queue
std::queue<std::vector<double>> dataQueue;
std::mutex queueMutex;
std::condition_variable dataCond;
bool finished = false;

constexpr int DATA_SIZE = 1024;
constexpr int DEADLINE_US = 220; // Real-time deadline

// Dummy FFT function (simulate work)
void dummyFFT(const std::vector<double>& input, std::vector<std::complex<double>>& output) {
    for (size_t i = 0; i < input.size(); ++i) {
        output[i] = std::complex<double>(std::sin(input[i]), std::cos(input[i]));
    }
}

// Set CPU affinity
void set_cpu_affinity(int cpu_id) {
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(cpu_id, &cpuset);

    int result = pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    if (result != 0) {
        std::cerr << "Error setting CPU affinity: " << strerror(result) << std::endl;
    }
}

// Set real-time scheduling
void set_realtime_scheduling(int priority = 90) {
    sched_param param;
    param.sched_priority = priority;

    int result = pthread_setschedparam(pthread_self(), SCHED_FIFO, &param);
    if (result != 0) {
        std::cerr << "Error setting real-time scheduling: " << strerror(result) << std::endl;
    }

    // Lock memory
    result = mlockall(MCL_CURRENT | MCL_FUTURE);
    if (result != 0) {
        std::cerr << "Error locking memory: " << strerror(result) << std::endl;
    }
}

// Data producer (non-real-time)
void dataProducer() {
    set_cpu_affinity(1); // Run on CPU 1

    for (int i = 0; i < 100; ++i) {
        std::vector<double> data(DATA_SIZE);
        for (int j = 0; j < DATA_SIZE; ++j) {
            data[j] = static_cast<double>(rand()) / RAND_MAX * 2.0 * M_PI;
        }

        {
            std::unique_lock<std::mutex> lock(queueMutex);
            dataQueue.push(data);
        }
        dataCond.notify_one();

        std::this_thread::sleep_for(1ms); // Simulate data arrival rate
    }

    finished = true;
    dataCond.notify_all();
}

// Real-time data processor
void realTimeProcessor() {
    set_cpu_affinity(0); // Run on CPU 0
    set_realtime_scheduling(90);

    while (!finished || !dataQueue.empty()) {
        std::vector<double> data;
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            dataCond.wait(lock, [] { return !dataQueue.empty() || finished; });
            if (dataQueue.empty() && finished) break;
            data = std::move(dataQueue.front());
            dataQueue.pop();
        }

        // Measure processing time
        auto start = std::chrono::high_resolution_clock::now();

        // Process data (FFT simulation)
        std::vector<std::complex<double>> output(DATA_SIZE);
        dummyFFT(data, output);

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

        // Check deadline
        if (duration.count() <= DEADLINE_US) {
            std::cout << "[RealTimeThread] Processing Time: " << duration.count() << " us -- OK" << std::endl;
        } else {
            std::cout << "[RealTimeThread] Processing Time: " << duration.count() << " us -- MISSED DEADLINE!" << std::endl;
        }

        // Small delay to simulate processing rate
        std::this_thread::sleep_for(500us);
    }
}

// Non-real-time data processor
void nonRealTimeProcessor() {
    set_cpu_affinity(1); // Run on CPU 1

    while (!finished || !dataQueue.empty()) {
        std::vector<double> data;
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            dataCond.wait(lock, [] { return !dataQueue.empty() || finished; });
            if (dataQueue.empty() && finished) break;
            data = std::move(dataQueue.front());
            dataQueue.pop();
        }

        // Measure processing time
        auto start = std::chrono::high_resolution_clock::now();

        // Process data (FFT simulation)
        std::vector<std::complex<double>> output(DATA_SIZE);
        dummyFFT(data, output);

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);

        std::cout << "[NonRealTimeThread] Processed a frame. Processing Time: " << duration.count() << " us" << std::endl;

        // Small delay to simulate processing rate
        std::this_thread::sleep_for(500us);
    }
}

int main() {
    std::cout << "Starting real-time vs non-real-time demo..." << std::endl;

    // Start threads
    std::thread producer(dataProducer);
    std::thread rtProcessor(realTimeProcessor);
    std::thread nrtProcessor(nonRealTimeProcessor);

    // Wait for completion
    producer.join();
    rtProcessor.join();
    nrtProcessor.join();

    std::cout << "All done!" << std::endl;
    return 0;
}
```

## What Actually Happens in Real-Time Execution

### The CPU:
- Is always dumb — it just fetches and executes instructions, cycle-by-cycle.
- It doesn't "know" about real-time or non-real-time.

### The Kernel (OS Scheduler):
- Controls which thread gets to run next on the CPU.
- When you ask for real-time (`SCHED_FIFO`, `SCHED_RR`, etc.), you're telling the kernel:
  - "Hey, always prioritize this thread over others!"

### The Real-Time Priority:
- High priority real-time threads preempt low-priority threads immediately.
- Even inside the kernel itself (with `PREEMPT_RT` patches).
- So if you're running at `SCHED_FIFO` priority 90, and a logger at 10, the logger won't disturb you.

### Memory locking (`mlockall`):
- Prevents page faults.
- In normal Linux, if your code touches new memory, the kernel might say, "Wait, let me fetch this page from disk..."
- That "disk fetch" = hundreds of microseconds → instant death for real-time.
- `mlockall(MCL_CURRENT | MCL_FUTURE);` keeps all your current and future allocations in RAM.

### Lockless programming:
- In RT, you want to never block on locks, semaphores, etc.
- Use lock-free data structures, atomics, or message queues designed for RT.

## Key Takeaways

- **Real-time ≠ Fast**: It's about predictability and guaranteed response times
- **Thread-Level Control**: Individual threads can have different scheduling policies
- **Hardware Matters**: CPU affinity, memory locking, and kernel patches all play crucial roles
- **Design Choices**: The criticality of your system determines hard vs soft vs non-real-time classification

This demonstrates how real-time systems ensure deterministic behavior through careful scheduling, memory management, and priority handling. The code example shows both real-time and non-real-time threads working together in the same process, highlighting the flexibility Linux provides for mixed-criticality systems.

*Originally published on [DEV.to](https://dev.to/zeporath/real-time-vs-non-real-time-systems-concepts-myths-2l4i)*