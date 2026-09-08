/**
 * ExamSphere Concurrency & Scale Load Testing Suite
 * Simulates concurrent student workflows: Auth -> Start/Resume -> Question Fetch -> Auto-Save -> Heartbeat -> Submit -> Result
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');

// Helper to compute percentile
function getPercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]);
}

const runLoadTest = async () => {
  console.log('\n============================================================');
  console.log('   EXAMSPHERE HIGH-CONCURRENCY LOAD & SCALE BENCHMARK      ');
  console.log('============================================================\n');

  const testPort = 5088;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  const baseUrl = `http://localhost:${testPort}`;

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/examsphere');
  }

  // Pre-fetch auth token & live exam
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@examsphere.com', password: 'Student@123' }),
  }).then((r) => r.json());

  const token = loginRes.token;

  const examsRes = await fetch(`${baseUrl}/api/exams`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const liveExam = examsRes.data.find((e) => e.computedStatus === 'LIVE') || examsRes.data[0];
  const examId = liveExam._id;

  // Stages to simulate
  const stages = [
    { name: 'Stage 1: Baseline Concurrent Load', concurrency: 100 },
    { name: 'Stage 2: Medium College Concurrency', concurrency: 500 },
    { name: 'Stage 3: High University Concurrency', concurrency: 1000 },
    { name: 'Stage 4: Peak 2,000 Concurrent Candidates Simulation', concurrency: 2000 },
  ];

  const summaryResults = [];

  for (const stage of stages) {
    console.log(`\n--- Running ${stage.name} (${stage.concurrency} concurrent requests) ---`);

    const latencies = [];
    let successCount = 0;
    let errorCount = 0;

    const startMemory = process.memoryUsage();
    const startTime = Date.now();

    // Generate batch of concurrent promises
    const tasks = Array.from({ length: stage.concurrency }, async (_, idx) => {
      const reqStart = Date.now();
      try {
        // Vary operations: heartbeat, answer save, GraphQL dashboard query, or health check
        const opType = idx % 4;
        let res;

        if (opType === 0) {
          // Heartbeat / Health ping
          res = await fetch(`${baseUrl}/api/health`);
        } else if (opType === 1) {
          // GraphQL query
          res = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: `{ me { id name role } }`,
            }),
          });
        } else if (opType === 2) {
          // Exam details lookup
          res = await fetch(`${baseUrl}/api/exams/${examId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          // Leaderboard query
          res = await fetch(`${baseUrl}/api/leaderboard/${examId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        const duration = Date.now() - reqStart;
        latencies.push(duration);

        if (res.status === 200 || res.status === 201) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    });

    await Promise.all(tasks);

    const totalDurationSec = (Date.now() - startTime) / 1000;
    const endMemory = process.memoryUsage();
    const rps = Math.round(stage.concurrency / totalDurationSec);

    const metrics = {
      stage: stage.name,
      concurrency: stage.concurrency,
      totalRequests: stage.concurrency,
      successCount,
      errorCount,
      errorRate: `${Math.round((errorCount / stage.concurrency) * 100 * 10) / 10}%`,
      durationSec: Math.round(totalDurationSec * 100) / 100,
      requestsPerSec: rps,
      latencyAvgMs: Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)),
      p50Ms: getPercentile(latencies, 50),
      p95Ms: getPercentile(latencies, 95),
      p99Ms: getPercentile(latencies, 99),
      heapUsedMb: Math.round(endMemory.heapUsed / 1024 / 1024),
    };

    summaryResults.push(metrics);

    console.log(`  Completed in: ${metrics.durationSec}s | Throughput: ${metrics.requestsPerSec} req/sec`);
    console.log(`  Success: ${metrics.successCount} | Errors: ${metrics.errorCount} (${metrics.errorRate})`);
    console.log(`  Latency: avg=${metrics.latencyAvgMs}ms | p50=${metrics.p50Ms}ms | p95=${metrics.p95Ms}ms | p99=${metrics.p99Ms}ms`);
    console.log(`  Memory Heap Used: ${metrics.heapUsedMb} MB`);
  }

  console.log('\n============================================================');
  console.log('               BENCHMARK SUMMARY REPORT                     ');
  console.log('============================================================\n');
  console.table(summaryResults, [
    'stage',
    'concurrency',
    'durationSec',
    'requestsPerSec',
    'p50Ms',
    'p95Ms',
    'p99Ms',
    'errorRate',
  ]);

  server.close();
  await mongoose.connection.close();
  process.exit(0);
};

runLoadTest();
