import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL connection pool
const pool = new Pool({ connectionString });

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize PrismaClient with the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.sessionAnswer.deleteMany({});
  await prisma.practiceSession.deleteMany({});
  await prisma.userTopicStat.deleteMany({});
  await prisma.userQuestionStat.deleteMany({});
  await prisma.streakLog.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.questionSet.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✓ Cleaned up existing data');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      id: 'f7d17e8c-14e9-4ae5-b016-dfa1102cde2f',
      email: 'user@example.com',
      phone: '0901234567',
      name: 'Nguyen Van A',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  console.log('✓ Created test user:', user.email);

  // Create question set
  const questionSet = await prisma.questionSet.create({
    data: {
      title: 'CompTIA Security+ Exam',
      description: 'Comprehensive guide to CompTIA Security+ certification',
      visibility: 'private',
      sourceType: 'manual',
      aiParseStatus: 'done',
      owner: { connect: { id: user.id } },
    },
  });

  console.log('✓ Created question set:', questionSet.title);

  // Create topics
  const cryptographyTopic = await prisma.topic.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      name: 'Cryptography',
      confirmedByUser: true,
      sortOrder: 0,
    },
  });

  const networkSecurityTopic = await prisma.topic.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      name: 'Network Security',
      confirmedByUser: true,
      sortOrder: 1,
    },
  });

  const accessControlTopic = await prisma.topic.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      name: 'Access Control',
      confirmedByUser: true,
      sortOrder: 2,
    },
  });

  const applicationSecurityTopic = await prisma.topic.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      name: 'Application Security',
      confirmedByUser: true,
      sortOrder: 3,
    },
  });

  console.log('✓ Created 4 topics');

  // Create questions for Cryptography topic
  const q1 = await prisma.question.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      topic: { connect: { id: cryptographyTopic.id } },
      content: 'What is the primary purpose of encryption?',
      contentVi: 'Mục đích chính của mã hóa là gì?',
      choices: JSON.parse(
        JSON.stringify([
          { key: 'A', content: 'To compress data', contentVi: 'Nén dữ liệu', isCorrect: false },
          { key: 'B', content: 'To protect confidentiality', contentVi: 'Bảo vệ bí mật', isCorrect: true },
          { key: 'C', content: 'To speed up transmission', contentVi: 'Tăng tốc độ truyền', isCorrect: false },
          { key: 'D', content: 'To reduce file size', contentVi: 'Giảm kích thước tệp', isCorrect: false },
        ])
      ),
      explanation: {
        content: 'Encryption protects confidentiality by converting plaintext into ciphertext that can only be read with the correct key.',
        source: 'ai',
        isVerified: true,
      },
      difficulty: 'easy',
      status: 'active',
      questionType: 'single_choice',
      confidenceScore: 0.95,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      topic: { connect: { id: cryptographyTopic.id } },
      content: 'Which of the following are characteristics of RSA encryption?',
      contentVi: 'Những đặc điểm nào của mã hóa RSA?',
      choices: JSON.parse(
        JSON.stringify([
          { key: 'A', content: 'Symmetric encryption', contentVi: 'Mã hóa đối xứng', isCorrect: false },
          { key: 'B', content: 'Uses public and private keys', contentVi: 'Sử dụng khóa công khai và riêng tư', isCorrect: true },
          { key: 'C', content: 'Stream cipher', contentVi: 'Cipher dòng', isCorrect: false },
          { key: 'D', content: 'Fixed block size of 64 bits', contentVi: 'Kích thước khối cố định 64 bit', isCorrect: false },
        ])
      ),
      explanation: {
        content: 'RSA is an asymmetric encryption algorithm that uses a pair of public and private keys.',
        source: 'ai',
        isVerified: true,
      },
      difficulty: 'medium',
      status: 'active',
      questionType: 'single_choice',
      confidenceScore: 0.92,
    },
  });

  const q3 = await prisma.question.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      topic: { connect: { id: cryptographyTopic.id } },
      content: 'What is the hash output size of SHA-256?',
      contentVi: 'Kích thước đầu ra hash của SHA-256 là bao nhiêu?',
      choices: JSON.parse(
        JSON.stringify([
          { key: 'A', content: '128 bits', contentVi: '128 bit', isCorrect: false },
          { key: 'B', content: '256 bits', contentVi: '256 bit', isCorrect: true },
          { key: 'C', content: '512 bits', contentVi: '512 bit', isCorrect: false },
          { key: 'D', content: '1024 bits', contentVi: '1024 bit', isCorrect: false },
        ])
      ),
      explanation: {
        content: 'SHA-256 produces a 256-bit (32-byte) hash value, regardless of input size.',
        source: 'ai',
        isVerified: true,
      },
      difficulty: 'easy',
      status: 'active',
      questionType: 'single_choice',
      confidenceScore: 0.98,
    },
  });

  // Create questions for Network Security topic
  const q4 = await prisma.question.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      topic: { connect: { id: networkSecurityTopic.id } },
      content: 'Which protocol operates at Layer 3 of the OSI model?',
      contentVi: 'Giao thức nào hoạt động ở Lớp 3 của mô hình OSI?',
      choices: JSON.parse(
        JSON.stringify([
          { key: 'A', content: 'HTTP', contentVi: 'HTTP', isCorrect: false },
          { key: 'B', content: 'TCP', contentVi: 'TCP', isCorrect: false },
          { key: 'C', content: 'IP', contentVi: 'IP', isCorrect: true },
          { key: 'D', content: 'Ethernet', contentVi: 'Ethernet', isCorrect: false },
        ])
      ),
      explanation: {
        content: 'IP (Internet Protocol) is a Layer 3 protocol responsible for logical addressing and routing.',
        source: 'ai',
        isVerified: true,
      },
      difficulty: 'medium',
      status: 'active',
      questionType: 'single_choice',
      confidenceScore: 0.89,
    },
  });

  const q5 = await prisma.question.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      topic: { connect: { id: networkSecurityTopic.id } },
      content: 'What is the purpose of a firewall?',
      contentVi: 'Mục đích của tường lửa là gì?',
      choices: JSON.parse(
        JSON.stringify([
          { key: 'A', content: 'To encrypt traffic', contentVi: 'Mã hóa lưu lượng', isCorrect: false },
          { key: 'B', content: 'To filter and monitor network traffic', contentVi: 'Lọc và giám sát lưu lượng mạng', isCorrect: true },
          { key: 'C', content: 'To increase bandwidth', contentVi: 'Tăng băng thông', isCorrect: false },
          { key: 'D', content: 'To replace routers', contentVi: 'Thay thế router', isCorrect: false },
        ])
      ),
      explanation: {
        content: 'A firewall is a security device that monitors and filters incoming and outgoing traffic based on predetermined rules.',
        source: 'ai',
        isVerified: true,
      },
      difficulty: 'easy',
      status: 'active',
      questionType: 'single_choice',
      confidenceScore: 0.96,
    },
  });

  // Create questions for Access Control topic
  const q6 = await prisma.question.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      topic: { connect: { id: accessControlTopic.id } },
      content: 'What does RBAC stand for?',
      contentVi: 'RBAC là viết tắt của cái gì?',
      choices: JSON.parse(
        JSON.stringify([
          { key: 'A', content: 'Role-Based Access Control', contentVi: 'Kiểm soát truy cập dựa trên vai trò', isCorrect: true },
          { key: 'B', content: 'Resource-Based Access Control', contentVi: 'Kiểm soát truy cập dựa trên tài nguyên', isCorrect: false },
          { key: 'C', content: 'Rule-Based Access Control', contentVi: 'Kiểm soát truy cập dựa trên quy tắc', isCorrect: false },
          { key: 'D', content: 'Request-Based Access Control', contentVi: 'Kiểm soát truy cập dựa trên yêu cầu', isCorrect: false },
        ])
      ),
      explanation: {
        content: 'RBAC is an access control method where permissions are assigned based on user roles within an organization.',
        source: 'ai',
        isVerified: true,
      },
      difficulty: 'easy',
      status: 'active',
      questionType: 'single_choice',
      confidenceScore: 0.99,
    },
  });

  const q7 = await prisma.question.create({
    data: {
      questionSet: { connect: { id: questionSet.id } },
      topic: { connect: { id: accessControlTopic.id } },
      content: 'What is the difference between authentication and authorization?',
      contentVi: 'Sự khác biệt giữa xác thực và uỷ quyền là gì?',
      choices: JSON.parse(
        JSON.stringify([
          { key: 'A', content: 'Authentication verifies identity, authorization grants permissions', contentVi: 'Xác thực xác minh danh tính, uỷ quyền cấp quyền', isCorrect: true },
          { key: 'B', content: 'They are the same thing', contentVi: 'Chúng là một', isCorrect: false },
          { key: 'C', content: 'Authorization comes before authentication', contentVi: 'Uỷ quyền trước xác thực', isCorrect: false },
          { key: 'D', content: 'Authentication is for passwords', contentVi: 'Xác thực dành cho mật khẩu', isCorrect: false },
        ])
      ),
      explanation: {
        content: 'Authentication is the process of verifying a user\'s identity, while authorization determines what authenticated users can access.',
        source: 'ai',
        isVerified: true,
      },
      difficulty: 'medium',
      status: 'active',
      questionType: 'single_choice',
      confidenceScore: 0.94,
    },
  });

  console.log('✓ Created 7 questions');

  // Create practice sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Session 1 - 5 days ago
  const session1Date = new Date(today);
  session1Date.setDate(session1Date.getDate() - 5);

  const session1 = await prisma.practiceSession.create({
    data: {
      user: { connect: { id: user.id } },
      questionSet: { connect: { id: questionSet.id } },
      mode: 'quick',
      totalQuestions: 20,
      answered: 18,
      correct: 16,
      durationSeconds: 900,
      status: 'completed',
      startedAt: session1Date,
      endedAt: new Date(session1Date.getTime() + 900000),
    },
  });

  // Session 2 - 4 days ago
  const session2Date = new Date(today);
  session2Date.setDate(session2Date.getDate() - 4);

  const session2 = await prisma.practiceSession.create({
    data: {
      user: { connect: { id: user.id } },
      questionSet: { connect: { id: questionSet.id } },
      mode: 'deep',
      totalQuestions: 50,
      answered: 45,
      correct: 38,
      durationSeconds: 2700,
      status: 'completed',
      startedAt: session2Date,
      endedAt: new Date(session2Date.getTime() + 2700000),
    },
  });

  // Session 3 - 3 days ago
  const session3Date = new Date(today);
  session3Date.setDate(session3Date.getDate() - 3);

  const session3 = await prisma.practiceSession.create({
    data: {
      user: { connect: { id: user.id } },
      questionSet: { connect: { id: questionSet.id } },
      mode: 'exam',
      totalQuestions: 100,
      answered: 95,
      correct: 82,
      durationSeconds: 5400,
      status: 'completed',
      startedAt: session3Date,
      endedAt: new Date(session3Date.getTime() + 5400000),
    },
  });

  // Session 4 - 2 days ago
  const session4Date = new Date(today);
  session4Date.setDate(session4Date.getDate() - 2);

  const session4 = await prisma.practiceSession.create({
    data: {
      user: { connect: { id: user.id } },
      questionSet: { connect: { id: questionSet.id } },
      mode: 'quick',
      totalQuestions: 25,
      answered: 22,
      correct: 19,
      durationSeconds: 1200,
      status: 'completed',
      startedAt: session4Date,
      endedAt: new Date(session4Date.getTime() + 1200000),
    },
  });

  // Session 5 - Today
  const session5Date = new Date(today);
  session5Date.setHours(10, 0, 0, 0);

  const session5 = await prisma.practiceSession.create({
    data: {
      user: { connect: { id: user.id } },
      questionSet: { connect: { id: questionSet.id } },
      mode: 'quick',
      totalQuestions: 30,
      answered: 28,
      correct: 25,
      durationSeconds: 1500,
      status: 'completed',
      startedAt: session5Date,
      endedAt: new Date(session5Date.getTime() + 1500000),
    },
  });

  console.log('✓ Created 5 practice sessions');

  // Create session answers for session 1
  const answers1 = [
    {
      sessionId: session1.id,
      questionId: q1.id,
      selectedChoiceKeys: JSON.stringify(['B']),
      isCorrect: true,
      timeSpentMs: 30000,
      aiExplanationViewed: false,
      seqOrder: 0,
    },
    {
      sessionId: session1.id,
      questionId: q2.id,
      selectedChoiceKeys: JSON.stringify(['B']),
      isCorrect: true,
      timeSpentMs: 45000,
      aiExplanationViewed: true,
      seqOrder: 1,
    },
    {
      sessionId: session1.id,
      questionId: q3.id,
      selectedChoiceKeys: JSON.stringify(['C']),
      isCorrect: false,
      timeSpentMs: 25000,
      aiExplanationViewed: false,
      seqOrder: 2,
    },
    {
      sessionId: session1.id,
      questionId: q4.id,
      selectedChoiceKeys: JSON.stringify(['C']),
      isCorrect: true,
      timeSpentMs: 40000,
      aiExplanationViewed: false,
      seqOrder: 3,
    },
  ];

  for (const answer of answers1) {
    await prisma.sessionAnswer.create({ data: answer });
  }

  // Create session answers for session 2
  const answers2 = [
    {
      sessionId: session2.id,
      questionId: q1.id,
      selectedChoiceKeys: JSON.stringify(['B']),
      isCorrect: true,
      timeSpentMs: 25000,
      aiExplanationViewed: false,
      seqOrder: 0,
    },
    {
      sessionId: session2.id,
      questionId: q2.id,
      selectedChoiceKeys: JSON.stringify(['A']),
      isCorrect: false,
      timeSpentMs: 50000,
      aiExplanationViewed: true,
      seqOrder: 1,
    },
    {
      sessionId: session2.id,
      questionId: q3.id,
      selectedChoiceKeys: JSON.stringify(['B']),
      isCorrect: true,
      timeSpentMs: 30000,
      aiExplanationViewed: false,
      seqOrder: 2,
    },
    {
      sessionId: session2.id,
      questionId: q4.id,
      selectedChoiceKeys: JSON.stringify(['C']),
      isCorrect: true,
      timeSpentMs: 35000,
      aiExplanationViewed: false,
      seqOrder: 3,
    },
    {
      sessionId: session2.id,
      questionId: q5.id,
      selectedChoiceKeys: JSON.stringify(['B']),
      isCorrect: true,
      timeSpentMs: 28000,
      aiExplanationViewed: false,
      seqOrder: 4,
    },
  ];

  for (const answer of answers2) {
    await prisma.sessionAnswer.create({ data: answer });
  }

  // Create user stats
  await prisma.userQuestionStat.create({
    data: {
      userId: user.id,
      questionId: q1.id,
      attemptCount: 3,
      correctCount: 3,
      incorrectStreak: 0,
      lastAttemptedAt: today,
    },
  });

  await prisma.userQuestionStat.create({
    data: {
      userId: user.id,
      questionId: q2.id,
      attemptCount: 2,
      correctCount: 1,
      incorrectStreak: 1,
      lastAttemptedAt: today,
    },
  });

  await prisma.userQuestionStat.create({
    data: {
      userId: user.id,
      questionId: q3.id,
      attemptCount: 4,
      correctCount: 2,
      incorrectStreak: 2,
      lastAttemptedAt: today,
    },
  });

  await prisma.userQuestionStat.create({
    data: {
      userId: user.id,
      questionId: q4.id,
      attemptCount: 2,
      correctCount: 2,
      incorrectStreak: 0,
      lastAttemptedAt: today,
    },
  });

  await prisma.userQuestionStat.create({
    data: {
      userId: user.id,
      questionId: q5.id,
      attemptCount: 1,
      correctCount: 1,
      incorrectStreak: 0,
      lastAttemptedAt: today,
    },
  });

  console.log('✓ Created user question stats');

  // Create topic stats
  await prisma.userTopicStat.create({
    data: {
      userId: user.id,
      topicId: cryptographyTopic.id,
      totalAttempted: 9,
      totalCorrect: 6,
      accuracy: 66.67,
      lastPracticedAt: today,
    },
  });

  await prisma.userTopicStat.create({
    data: {
      userId: user.id,
      topicId: networkSecurityTopic.id,
      totalAttempted: 3,
      totalCorrect: 2,
      accuracy: 66.67,
      lastPracticedAt: today,
    },
  });

  console.log('✓ Created user topic stats');

  // Create streak logs
  const streakLogDate1 = new Date(today);
  streakLogDate1.setDate(streakLogDate1.getDate() - 5);

  await prisma.streakLog.create({
    data: {
      userId: user.id,
      logDate: streakLogDate1,
      questionsDone: 18,
      isStreakDay: true,
    },
  });

  const streakLogDate2 = new Date(today);
  streakLogDate2.setDate(streakLogDate2.getDate() - 4);

  await prisma.streakLog.create({
    data: {
      userId: user.id,
      logDate: streakLogDate2,
      questionsDone: 45,
      isStreakDay: true,
    },
  });

  const streakLogDate3 = new Date(today);
  streakLogDate3.setDate(streakLogDate3.getDate() - 3);

  await prisma.streakLog.create({
    data: {
      userId: user.id,
      logDate: streakLogDate3,
      questionsDone: 95,
      isStreakDay: true,
    },
  });

  const streakLogDate4 = new Date(today);
  streakLogDate4.setDate(streakLogDate4.getDate() - 2);

  await prisma.streakLog.create({
    data: {
      userId: user.id,
      logDate: streakLogDate4,
      questionsDone: 22,
      isStreakDay: true,
    },
  });

  await prisma.streakLog.create({
    data: {
      userId: user.id,
      logDate: today,
      questionsDone: 28,
      isStreakDay: true,
    },
  });

  console.log('✓ Created streak logs (5 day streak!)');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Seeded Data Summary:');
  console.log('  - 1 User (user@example.com)');
  console.log('  - 1 Question Set (CompTIA Security+)');
  console.log('  - 4 Topics');
  console.log('  - 7 Questions');
  console.log('  - 5 Practice Sessions');
  console.log('  - 2 User Topic Stats');
  console.log('  - 5 User Question Stats');
  console.log('  - 5 Day Streak');
  console.log('\n🧪 Test Analytics API:');
  console.log('  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmN2QxN2U4Yy0xNGU5LTRhZTUtYjAxNi1kZmExMTAyY2RlMmYiLCJpYXQiOjE3ODM1NjE1MzYsImV4cCI6MTc4NDE2NjMzNn0.eHrXYf_qjQ1-tbDvFdrJt8WngXEzphts-UF_HDKghOg');
  console.log('  GET http://localhost:3000/api/v1/analytics/stats');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
