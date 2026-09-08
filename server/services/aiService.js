/**
 * AI Service for ExamSphere
 * Provides:
 * - Gemini Mode: when GEMINI_API_KEY is configured
 * - Fallback Mode: Rule-Based Recommendation Engine when key is absent or API unavailable
 */

const https = require('https');

const callGeminiAPI = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(body);
              const text = parsed.candidates[0].content.parts[0].text;
              resolve(JSON.parse(text));
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      }
    );

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.write(data);
    req.end();
  });
};

/**
 * Generate Questions: AI (Gemini) or Rule-Based Fallback
 */
const generateQuestions = async ({ subject, topic, difficulty = 'Medium', count = 3 }) => {
  const safeCount = Math.min(Math.max(1, parseInt(count, 10) || 3), 10);

  // 1. Try Gemini Mode if API Key is available
  if (process.env.GEMINI_API_KEY) {
    const prompt = `Generate ${safeCount} multiple-choice questions for subject "${subject}", topic "${topic}", and difficulty level "${difficulty}".
Output ONLY a valid JSON array of objects with fields:
- questionText (string)
- options: array of 4 objects with "id" ('A', 'B', 'C', 'D') and "text" (string)
- correctAnswer ('A', 'B', 'C', or 'D')
- explanation (detailed string explaining why the answer is correct and why other options are wrong)
- difficulty ('${difficulty}')
- subject ('${subject}')
- topic ('${topic}')`;

    try {
      const geminiResult = await callGeminiAPI(prompt);
      if (Array.isArray(geminiResult) && geminiResult.length > 0) {
        return {
          mode: 'GEMINI',
          questions: geminiResult.map((q) => ({
            ...q,
            marks: difficulty === 'Hard' ? 2 : 1,
            negativeMarks: 0.25,
            status: 'Pending Review',
            aiGenerated: true,
          })),
        };
      }
    } catch (e) {
      console.warn('[AI Service] Gemini call failed, falling back to Rule-Based Engine');
    }
  }

  // 2. Fallback Mode: Rule-Based Recommendation Engine
  // Generates structured domain-specific assessment items
  const fallbackTemplates = [
    {
      template: (s, t) => `Which of the following statements accurately characterizes the fundamental operating principle of ${t} in ${s}?`,
      opts: [
        'It enforces strict mathematical determinism and minimizes worst-case space-time bounds under optimal constraints.',
        'It always utilizes linear search paradigms regardless of input entropy or auxiliary indexes.',
        'It requires external asynchronous interrupts to ensure atomic state transitions.',
        'It eliminates cache locality by randomly dispersing pointers across the virtual memory stack.',
      ],
      correct: 'A',
      explanation: (s, t) => `In ${s}, ${t} is designed to enforce structural determinism and optimize asymptotic complexity while maintaining computational integrity.`,
    },
    {
      template: (s, t) => `When analyzing the architectural trade-offs of ${t} in ${s}, what represents the primary bottleneck under high load?`,
      opts: [
        'Sub-optimal memory cache utilization and pointer dereference latency during deep traversal.',
        'Zero CPU cycles consumed due to hardware-level speculative execution.',
        'Automatic serialization of all concurrent threads by default operating system firmware.',
        'Complete absence of secondary memory read buffers.',
      ],
      correct: 'A',
      explanation: (s, t) => `Under heavy computational workloads in ${s}, ${t} frequently incurs overhead from memory latency and non-contiguous memory access patterns.`,
    },
    {
      template: (s, t) => `In modern systems utilizing ${s}, what constitutes a critical best-practice when deploying ${t}?`,
      opts: [
        'Implementing strict idempotency, validating edge invariants, and profiling algorithmic bounds.',
        'Bypassing thread safety mechanisms to maximize raw processing velocity without locks.',
        'Hardcoding all dynamic thresholds directly into the physical microcode layer.',
        'Ignoring transaction isolation semantics and relying purely on eventual user feedback.',
      ],
      correct: 'A',
      explanation: (s, t) => `Applying invariants, validating input boundaries, and observing idempotency ensures robust execution of ${t} in production ${s} environments.`,
    },
    {
      template: (s, t) => `What is the expected asymptotic behavior when performing updates on ${t} within ${s} under balanced conditions?`,
      opts: [
        'Logarithmic O(log n) time complexity with constant auxiliary factor.',
        'Quadratic O(n^2) scaling for every atomic modification.',
        'Exponential O(2^n) search space expansion.',
        'Unbounded nondeterministic timing depending on network latency.',
      ],
      correct: 'A',
      explanation: (s, t) => `Balanced structures in ${s} preserve O(log n) upper bounds through structural re-balancing or logarithmic index partitioning.`,
    },
  ];

  const generatedQuestions = [];
  for (let i = 0; i < safeCount; i++) {
    const tmpl = fallbackTemplates[i % fallbackTemplates.length];
    generatedQuestions.push({
      questionText: tmpl.template(subject, topic),
      options: [
        { id: 'A', text: tmpl.opts[0] },
        { id: 'B', text: tmpl.opts[1] },
        { id: 'C', text: tmpl.opts[2] },
        { id: 'D', text: tmpl.opts[3] },
      ],
      correctAnswer: tmpl.correct,
      explanation: tmpl.explanation(subject, topic),
      subject,
      topic,
      difficulty,
      marks: difficulty === 'Hard' ? 2 : 1,
      negativeMarks: 0.25,
      status: 'Pending Review',
      aiGenerated: true,
    });
  }

  return {
    mode: 'RULE_BASED',
    questions: generatedQuestions,
  };
};

/**
 * Analyze Performance: AI or Rule-Based Recommendation Engine
 */
const analyzePerformance = async ({ result, exam }) => {
  const topics = result.topicPerformance || [];
  const weakTopics = topics.filter((t) => t.accuracy < 60).map((t) => t.topic);
  const strongTopics = topics.filter((t) => t.accuracy >= 75).map((t) => t.topic);

  // 1. Try Gemini AI Mode
  if (process.env.GEMINI_API_KEY) {
    const prompt = `Analyze this student exam result for "${exam.title} (${exam.subject})":
Score: ${result.score}/${result.totalMarks} (${result.percentage}%)
Accuracy: ${result.accuracy}%
Weak Topics: ${weakTopics.join(', ') || 'None'}
Strong Topics: ${strongTopics.join(', ') || 'General'}
Provide a JSON object with:
- summary: concise 2-sentence assessment of their readiness
- strengths: array of 2-3 specific mastery statements
- weakAreas: array of 2-3 specific conceptual gaps
- studyPlan: array of 3 actionable next steps for improvement`;

    try {
      const geminiAnalysis = await callGeminiAPI(prompt);
      if (geminiAnalysis && geminiAnalysis.summary) {
        return {
          mode: 'GEMINI',
          summary: geminiAnalysis.summary,
          strengths: geminiAnalysis.strengths || strongTopics,
          weakAreas: geminiAnalysis.weakAreas || weakTopics,
          studyPlan: geminiAnalysis.studyPlan || [],
        };
      }
    } catch (e) {
      console.warn('[AI Service] Gemini performance analysis failed, using Rule-Based Engine');
    }
  }

  // 2. Fallback Mode: Rule-Based Recommendation Engine
  let summary = '';
  const studyPlan = [];

  if (result.percentage >= 80) {
    summary = `Exceptional performance on ${exam.title}! You demonstrated high conceptual accuracy of ${result.accuracy}% with comprehensive domain mastery.`;
    studyPlan.push(`Take advanced timed challenges to maintain peak problem-solving speed.`);
    studyPlan.push(`Practice multi-topic integration questions across ${exam.subject}.`);
  } else if (result.percentage >= 60) {
    summary = `Solid foundational knowledge on ${exam.title}. You passed the examination threshold with ${result.accuracy}% accuracy, with specific high-yield topics requiring targeted review.`;
    if (weakTopics.length > 0) {
      studyPlan.push(`Prioritize revising core principles in ${weakTopics.slice(0, 2).join(' and ')}.`);
    }
    studyPlan.push(`Re-attempt incorrect questions in the Mistake Analysis portal.`);
    studyPlan.push(`Schedule a follow-up assessment in 3 days to test retention.`);
  } else {
    summary = `Performance on ${exam.title} indicates key conceptual gaps across primary topics. Focused revision of core theory is recommended before re-attempting.`;
    if (weakTopics.length > 0) {
      studyPlan.push(`Dedicate focused study sessions to: ${weakTopics.join(', ')}.`);
    }
    studyPlan.push(`Review step-by-step explanations for all missed questions in your Mistake Review.`);
    studyPlan.push(`Work through fundamental practice problems before entering another timed exam.`);
  }

  return {
    mode: 'RULE_BASED',
    summary,
    strengths: strongTopics.length > 0 ? strongTopics : ['General problem engagement'],
    weakAreas: weakTopics.length > 0 ? weakTopics : ['Edge-case analysis'],
    studyPlan,
  };
};

module.exports = {
  generateQuestions,
  analyzePerformance,
};
