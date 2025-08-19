# Methodology

Scenarios:
- S1_FILTER
- S2_UPDATE_1PCT
- S3_INSERT_1K
- S4_REMOVE_1K
- S5_SORT_COL
- S6_IDLE_30S

Each scenario runs 10 times after a warmup. Metrics include performance marks, long tasks, heap usage and DOM mutations. Runs use a fixed seed and 4x CPU throttling.

External reference: [JS Framework Benchmark](https://github.com/krausest/js-framework-benchmark) and its [results](https://krausest.github.io/js-framework-benchmark/).
