# 🦀 QuIDE (Rust Version) — Quantum Integrated Development Environment

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Rust](https://img.shields.io/badge/Rust-Quantum-blue)
![Status](https://img.shields.io/badge/status-active-success)

QuIDE (Quantum Integrated Development Environment) is a high-performance quantum circuit simulator and educational toolkit written in Rust. This version is designed for speed, correctness, and extensibility — and is the foundation for future CLI tools, GUIs, and WASM-based interfaces.

---

## ✨ Features

- ⚛️ **Quantum Circuit Simulator** — with custom gates and state vector simulation
- 🧠 **Pure Rust Implementation** — high-performance numeric code using `ndarray`
- 📦 **Modular Design** — easy to extend or swap components
- 📋 **Command-Line Interface (CLI)** — powered by `clap`
- 📡 **Future-Proof** — designed for eventual WASM, Python bindings, and hardware backends

---

## 📁 Project Structure

quide-rust/
├── Cargo.toml # Project metadata & dependencies
├── Makefile # CLI build & test automation
├── src/
│ ├── main.rs # CLI entrypoint
│ ├── lib.rs # Library exports
│ ├── gates.rs # Quantum gate definitions
│ ├── state.rs # Quantum state representation
│ ├── circuit.rs # Circuit structure and gate sequence
│ ├── simulator.rs # Core engine for applying gates
│ ├── measurement.rs # State collapse and output
│ └── cli.rs # Command-line interface
└── tests/
└── test_*.rs # Unit tests


---

## ⚙️ Getting Started

### 🔧 Requirements

- Rust (latest stable) — [Install Rust](https://www.rust-lang.org/tools/install)
- Cargo (comes with Rust)

---

### 🚀 Build & Run

```bash
# Clone the repo and switch to Rust version
git clone https://github.com/DontaRuffin/QuIDE.git
cd QuIDE
git checkout rust

# Build the project
cargo build

# Run the CLI
cargo run -- help
