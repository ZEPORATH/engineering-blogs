# Setting Up mdBook for Personal Blogging

## Why Switch from Jekyll to mdBook?

If you're coming from Jekyll like I did, you know the local development pain points:

### Jekyll's Local Development Issues:
- **Ruby dependency hell**: Managing Ruby versions, gems, and Bundler conflicts
- **Slow rebuilds**: Every file change triggers a full site rebuild
- **Complex setup**: Installing Ruby, Jekyll, and dealing with platform-specific issues
- **Theme complications**: Remote themes and plugin dependencies
- **Windows struggles**: Jekyll was notoriously difficult on Windows

### mdBook Advantages:
- **Rust-based**: Single binary, no runtime dependencies
- **Instant rebuilds**: Live reload during development
- **Simple setup**: Download and run - that's it!
- **Cross-platform**: Works identically on Windows, macOS, and Linux
- **Fast**: Written in Rust, compiles to native code
- **GitHub Pages ready**: Static HTML output works perfectly

## Installation

### Prerequisites
You only need [Rust](https://rustup.rs/) installed on your system.

```bash
# Install Rust (if you haven't already)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Install mdBook
```bash
# Install mdBook globally
cargo install mdbook

# Verify installation
mdbook --version
```

That's it! No Ruby, no Bundler, no gem conflicts.

## Project Setup

### Initialize a New mdBook
```bash
# Create a new directory for your blog
mkdir my-engineering-blog
cd my-engineering-blog

# Initialize mdBook
mdbook init
```

This creates:
- `src/` - Your Markdown source files
- `book.toml` - Configuration file
- `src/SUMMARY.md` - Table of contents
- `src/chapter_1.md` - Sample chapter

### Basic Configuration

Edit `book.toml`:

```toml
[book]
title = "Your Engineering Blog"
authors = ["Your Name"]
description = "Your blog description"
language = "en"

[output.html]
# Optional: customize theme, add CSS, etc.
```

## Project Structure

A typical mdBook blog structure:

```
your-blog/
├── book.toml              # Configuration
├── src/                   # Source Markdown files
│   ├── SUMMARY.md         # Table of contents
│   ├── introduction.md    # Welcome/About page
│   ├── post1.md          # Your blog posts
│   ├── post2.md
│   └── static/           # Static assets (images, etc.)
│       └── images/
├── static/               # Static assets for build
│   └── *.png             # Images, screenshots, etc.
├── book/                 # Generated HTML (auto-created)
└── build.sh             # Custom build script (see below)
```

## Writing Content

### Basic Markdown
mdBook uses standard Markdown with some extensions:

```markdown
# Chapter Title

## Section

Normal **bold** and *italic* text.

- Bullet lists
- Work great

1. Numbered lists
2. Also work

```rust
// Code blocks with syntax highlighting
fn main() {
    println!("Hello, world!");
}
```

> Blockquotes for important notes

[Links work normally](https://example.com)
```

### Frontmatter? Nope!
Unlike Jekyll, mdBook doesn't use frontmatter. Just write your content directly in Markdown. No YAML headers needed!

### Images and Assets
Place images in the `static/` directory:

```markdown
![Alt text](image-name.png)
```

**Important**: If mdBook doesn't copy static assets automatically (like in our case), create a `build.sh` script:

```bash
#!/bin/bash
mdbook build
cp static/*.png book/  # Copy images manually
```

## Local Development

### Serve Locally
```bash
# Basic serving
mdbook serve

# Or with custom port
mdbook serve --port 3001

# Or open browser automatically
mdbook serve --open
```

### Live Reload
mdBook automatically rebuilds when you save files. Just edit your Markdown in `src/` and refresh your browser!

### Custom Build Script
For blogs with images, use our custom build script:

```bash
#!/bin/bash

# Build the mdBook
mdbook build

# Copy static assets to the built book directory
cp static/*.png book/

echo "Book built successfully with static assets!"
```

Make it executable:
```bash
chmod +x build.sh
./build.sh
```

## Publishing Options

### GitHub Pages
1. Build your book: `./build.sh`
2. Push the `book/` directory to `gh-pages` branch
3. Enable GitHub Pages for that branch

Or use GitHub Actions for automatic deployment.

### Netlify/Vercel
1. Build locally: `./build.sh`
2. Deploy the `book/` directory
3. Set build command to `./build.sh` if using CI

### Self-Hosting
Just upload the `book/` directory to any web server!

## Tips for Bloggers

### Organizing Content
- Use `SUMMARY.md` to organize chapters
- Group related posts in sections
- Keep introduction/welcome as first chapter

### Search and Navigation
mdBook includes:
- Built-in search
- Table of contents sidebar
- Previous/Next navigation
- Printable version

### Custom Styling
Add custom CSS in `book.toml`:

```toml
[output.html]
additional-css = ["custom.css"]
```

### Themes
mdBook has built-in themes:
- Light (default)
- Rust theme
- Coal (dark)
- Ayu (dark with syntax highlighting)

## Migration from Jekyll

### Content Conversion
1. Copy Markdown posts to `src/`
2. Remove Jekyll frontmatter
3. Update image paths
4. Update internal links

### What Changes
- No `_posts/` directory needed
- No `_config.yml`
- No `Gemfile`
- No theme plugins
- Simpler structure

### What Stays the Same
- Markdown content
- Image assets
- GitHub Pages deployment
- RSS feed capability (with plugins)

## Performance Comparison

| Aspect | Jekyll | mdBook |
|--------|--------|--------|
| Install Time | 5-15 minutes | < 1 minute |
| Build Time | 10-30 seconds | < 1 second |
| Dependencies | Ruby + gems | None |
| Local Server | Slow rebuilds | Instant updates |
| Windows Support | Poor | Excellent |

## Common Issues & Solutions

### Images Not Showing
**Problem**: Images in `static/` don't appear
**Solution**: Use the custom `build.sh` script to manually copy assets

### Links Broken
**Problem**: Internal links don't work
**Solution**: Use relative paths or root-relative paths

### Theme Customization
**Problem**: Want custom styling
**Solution**: Add `additional-css` in `book.toml`

## Conclusion

mdBook makes blogging simple again. No more fighting with Ruby dependencies, slow rebuilds, or complex configurations. Just write Markdown and publish.

The local development experience is dramatically better - instant rebuilds, no setup hassles, and works everywhere.

If you're tired of Jekyll's local development pain, give mdBook a try. You won't look back!