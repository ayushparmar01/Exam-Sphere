const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type UserStats {
    testsCompleted: Int
    averageScore: Float
    accuracy: Float
    bestScore: Float
  }

  type UserProfile {
    id: ID!
    name: String!
    email: String!
    role: String!
    stats: UserStats
  }

  type DashboardResultItem {
    id: ID!
    examTitle: String!
    score: Float!
    totalMarks: Float!
    percentage: Float!
    isPassed: Boolean!
    createdAt: String!
  }

  type DashboardAnalytics {
    stats: UserStats!
    recentResults: [DashboardResultItem!]!
    upcomingExamsCount: Int!
  }

  type ExamDifficultyCount {
    difficulty: String!
    count: Int!
  }

  type ExamAnalytics {
    examId: ID!
    title: String!
    totalAttempts: Int!
    averageScore: Float!
    passPercentage: Float!
    highestScore: Float!
    lowestScore: Float!
  }

  type AdminLiveOverview {
    totalCandidates: Int!
    activeCandidates: Int!
    submittedCandidates: Int!
    timedOutCandidates: Int!
    disconnectedCandidates: Int!
    lowRiskCount: Int!
    mediumRiskCount: Int!
    highRiskCount: Int!
    cameraUnavailableCount: Int!
    micUnavailableCount: Int!
  }

  type CandidateMonitoringItem {
    attemptId: ID!
    studentId: ID!
    studentName: String!
    studentEmail: String!
    examId: ID!
    examTitle: String!
    status: String!
    remainingSeconds: Int!
    currentQuestionIndex: Int!
    totalQuestions: Int!
    answeredCount: Int!
    integrityRiskScore: Int!
    integrityRiskLevel: String!
    integrityEventCount: Int!
    isFlaggedForReview: Boolean!
    cameraStatus: String!
    microphoneStatus: String!
    connectionStatus: String!
    lastHeartbeat: String!
  }

  type IntegrityEventItem {
    id: ID!
    eventType: String!
    severity: String!
    riskPoints: Int!
    timestamp: String!
    metadata: String
  }

  type CandidateIntegrityDetail {
    attemptId: ID!
    studentName: String!
    studentEmail: String!
    examTitle: String!
    status: String!
    integrityRiskScore: Int!
    integrityRiskLevel: String!
    isFlaggedForReview: Boolean!
    startedAt: String!
    submittedAt: String
    events: [IntegrityEventItem!]!
  }

  type LeaderboardItem {
    rank: Int!
    studentId: ID!
    studentName: String!
    score: Float!
    accuracy: Float!
    timeSpentSeconds: Int!
    percentile: Float!
  }

  type NotificationItem {
    id: ID!
    title: String!
    message: String!
    type: String!
    isRead: Boolean!
    createdAt: String!
  }

  type Query {
    me: UserProfile
    dashboardAnalytics(studentId: ID): DashboardAnalytics
    examAnalytics(examId: ID!): ExamAnalytics
    adminLiveOverview(examId: ID): AdminLiveOverview
    candidateMonitoringList(examId: ID, riskLevel: String, status: String): [CandidateMonitoringItem!]!
    candidateIntegrityDetail(attemptId: ID!): CandidateIntegrityDetail
    leaderboard(examId: ID!, limit: Int): [LeaderboardItem!]!
    notifications(limit: Int): [NotificationItem!]!
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type Mutation {
    flagAttempt(attemptId: ID!, reason: String): MutationResponse!
    dismissIntegrityNotice(attemptId: ID!): MutationResponse!
  }
`);

module.exports = schema;
