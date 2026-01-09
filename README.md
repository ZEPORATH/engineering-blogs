# 👋 Shashank's Engineering Blog

This repository contains my engineering blog, now powered by [mdBook](https://rust-lang.github.io/mdBook/)!

## 🚀 About This Blog

I'm Shashank Shekhar — a backend/system dev who's been building stuff in the wild for almost a decade.
My roots are in C++ (Qt, radios, embedded-ish chaos), but I've been branching out into distributed systems, Rust, Go, and whatever else helps ship better software.

No corporate fluff here — just practical engineering notes, experiments, and honest takes.

## 📖 Reading the Blog

This blog is built with mdBook. You can:

- **Read online**: The book is automatically built and hosted (link coming soon)
- **Build locally**: See instructions below
- **Contribute**: Submit issues or pull requests with new content

## 🛠️ Building Locally

### Prerequisites
- [Rust](https://rustup.rs/) (for mdBook)
- mdBook (install with `cargo install mdbook`)

### Build and Serve
```bash
# Install mdBook if you haven't already
cargo install mdbook

# Build the book (includes static assets like images)
./build.sh

# Or build manually:
mdbook build && cp static/*.png book/

# Serve locally for development
mdbook serve
```

## 📂 Project Structure

- **src/**: mdBook source files (chapters in Markdown)
- **book/**: Generated HTML output (after building)
- **book.toml**: mdBook configuration
- **static/**: Static assets like images and screenshots
- **build.sh**: Custom build script for assets

---

## 🦀 Rust Journey (One Chapter)

Rust isn’t the whole story — but it’s definitely a fun one.

I’m tracking:
- Migrating from C++ → Rust mindset
- Unsafe Rust & FFI playgrounds
- System-level problem-solving
- Design patterns, idiomatic takes, and anti-patterns
- Real issues I hit + how I fixed them
- When Rust shines vs when I just reach for Go instead

If you’re curious about Rust from a systems perspective, you’ll probably vibe.

---

## 🧠 Why I’m Doing This

Simple:  
I learn best when I explain.  
And I’m tired of keeping notebooks full of notes that no one else ever sees.

So this blog is:
- My tech brain dump
- A journal of experiments
- A place to share mistakes (so you don’t repeat them)
- Somewhere to rant when a compiler ruins my day

If any of that sounds like your jam, stick around.

---

## 🧩 Who This Blog Is For

- Engineers who like low-level work
- C++ folks looking sideways at Rust
- Go devs breaking into systems
- Anyone building large, high-perf services
- Curious people who love learning from real-world examples

If you care about clarity, correctness, and craft — you’ll fit in.

---

## 📬 Hit Me Up

Questions, ideas, corrections, or just want to chat?  
Drop an issue, DM, or carrier pigeon — whatever works.

Let’s build cool stuff and not stress-eat in production.

— Shashank(shekhar.jaigaon@gmail.com)
