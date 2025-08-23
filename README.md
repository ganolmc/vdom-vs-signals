# React vs Solid Performance Benchmark

A comprehensive performance comparison between React (Virtual DOM) and Solid.js (Signals-based reactivity) using identical data grid implementations. This benchmark measures out-of-the-box performance without framework-specific optimizations to provide fair baseline comparisons.

## Overview

The goal of this application is to compare different frontend frameworks' performance in standardized benchmarks without optimizations. Both implementations use idiomatic, minimally optimized code to represent typical developer usage patterns rather than highly tuned edge cases.

## Test Scenarios

The benchmark includes six distinct scenarios designed to test different aspects of framework performance:

### S1_FILTER - Region Filter Change

- **Operation**: Single dropdown selection (EU region)
- **Purpose**: Measure basic filtering and re-rendering performance
- **Complexity**: Low - single state change affecting displayed data

### S2_UPDATE_1PCT - Incremental Data Updates  

- **Operation**: 50 consecutive 1% data updates with 100ms intervals
- **Purpose**: Evaluate continuous update performance and batching efficiency
- **Complexity**: High - frequent state changes over time

### S3_INSERT_1K - Bulk Data Insertion

- **Operation**: Insert 1,000 new rows into the data grid
- **Purpose**: Test large-scale data addition and list rendering performance
- **Complexity**: High - significant DOM expansion

### S4_REMOVE_1K - Bulk Data Removal

- **Operation**: Remove 1,000 existing rows from the data grid
- **Purpose**: Test large-scale data deletion and cleanup performance
- **Complexity**: High - significant DOM reduction

### S5_SORT_COL - Column Sorting Operations

- **Operation**: 5 consecutive price column sort toggles
- **Purpose**: Evaluate complex data manipulation and re-ordering performance
- **Complexity**: Very High - multiple full dataset reorganizations

### S6_IDLE_30S - Idle State Monitoring

- **Operation**: 30-second idle period after initial load
- **Purpose**: Baseline performance measurement and memory leak detection
- **Complexity**: Minimal - passive monitoring

## Measured Metrics

- **DOM Mutations**: Count of actual DOM changes via MutationObserver
- **Update Latency**: Time to complete operations (milliseconds)
- **Heap Size**: JavaScript memory consumption (MB)
- **Long Task Count**: Tasks exceeding 50ms execution time
- **Long Task Duration**: Total duration of blocking tasks

## Quickstart

```bash
pnpm bootstrap
pnpm dev:react # http://localhost:5173
pnpm dev:solid # http://localhost:5175
pnpm bench:all
pnpm report
```

## Benchmark Runs

| Date | Run ID | Results |
|------|--------|---------|
| 2025-08-22 | 2025-08-22T03-54 | [Detailed Results](./docs/results/2025-08-22.md) |

## Architecture

- **React Implementation**: Uses Virtual DOM with standard hooks (useState, useEffect)
- **Solid Implementation**: Uses fine-grained signals and reactive primitives
- **Shared Components**: Identical UI structure and styling
- **Measurement**: Puppeteer-controlled browser automation with 10 runs per scenario

> This benchmark compares idiomatic, minimally optimized implementations. The focus is on out-of-the-box performance rather than highly tuned, framework-specific optimizations.
