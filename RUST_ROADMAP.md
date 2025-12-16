# 🦀 QuIDE Rust Backend Roadmap

This document outlines the technical roadmap for the `quide` Rust crate. While the general project roadmap focuses on features, this document focuses on the implementation details, architecture, and performance goals of the simulation engine.

## 🏗️ Architecture & Core Components

### v0.1: Foundation (Current Status)
- [x] Basic project structure.
- [x] CLI scaffolding using `clap`.
- [ ] Define `Gate` trait and `QuantumState` struct.
- [ ] Basic state vector simulation (naive implementation).
- [ ] Serialization of circuits (JSON/Serde).

### v0.2: High-Performance Numerics
- [ ] **Matrix Backend Selection**:
  - Evaluate `ndarray` vs `nalgebra` vs `faer-rs`.
  - Decision: Use `ndarray` with `ndarray-linalg` (BLAS support) for initial version.
- [ ] **Complex Number Optimization**:
  - Use `num-complex` with `f64`.
  - Explore structure-of-arrays (SoA) layout for complex vectors if performance bottlenecks arise.
- [ ] **Sparse Matrix Support**:
  - Most quantum gates are sparse. Implement a specialized sparse matrix format for gates to reduce memory usage.

### v0.3: Parallelism & SIMD
- [ ] **Data Parallelism**:
  - Use `rayon` to parallelize state vector updates across multiple threads.
  - Parallelize measurement sampling.
- [ ] **SIMD Instructions**:
  - Leverage `portable-simd` or explicit AVX2/AVX-512 intrinsics for state vector multiplication.

## 🔌 Integration & Interfaces

### v0.4: FFI & Python Bindings
- [ ] **PyO3 Integration**:
  - Expose `Circuit` and `Simulator` classes to Python.
  - Implement `__buffer__` protocol for zero-copy data sharing with NumPy.
- [ ] **C API**:
  - Expose a standard C ABI for integration with other languages (C++, Julia).

### v0.5: WebAssembly (WASM)
- [ ] **WASM Target**:
  - Ensure all dependencies are WASM-compatible (no heavy system libraries).
  - Compile `quide` to `wasm32-unknown-unknown`.
- [ ] **JS/TS Bindings**:
  - Use `wasm-bindgen` to create a JavaScript API for running simulations in the browser.

## 🧪 Testing & Quality Assurance

- [ ] **Unit Testing**: 90% coverage for gate logic.
- [ ] **Property-Based Testing**: Use `proptest` to verify circuit invariants (e.g., unitary preservation).
- [ ] **Benchmarking**:
  - Set up `criterion.rs` for regression testing.
  - Benchmark against Qiskit Aer and other Rust simulators (e.g., `qulacs`).

## 🔮 Future Research Directions

- **Tensor Network Simulation**: Explore Matrix Product States (MPS) for simulating larger (but slightly entangled) systems.
- **GPU Acceleration**: CUDA/OpenCL backend using `wgpu` or `cudarc`.
