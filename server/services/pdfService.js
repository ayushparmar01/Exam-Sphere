const PDFDocument = require('pdfkit');

/**
 * Generate a professional ExamSphere performance report as a PDF buffer
 */
const generateResultPDF = async ({ result, exam, user, rankInfo }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header / Branding ---
      doc.rect(0, 0, doc.page.width, 90).fill('#1e1b4b');

      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('EXAMSPHERE', 40, 25);
      doc.fontSize(10).font('Helvetica').fillColor('#a5b4fc').text('Official Candidate Performance & Certification Report', 40, 52);

      const reportDate = new Date(result.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      doc.fontSize(9).fillColor('#e0e7ff').text(`Generated: ${reportDate}`, doc.page.width - 180, 40, { align: 'right' });
      doc.text(`Attempt ID: ${result.attemptId.toString().slice(-8).toUpperCase()}`, doc.page.width - 180, 55, { align: 'right' });

      doc.moveDown(4);

      // --- Candidate & Assessment Details ---
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Candidate & Examination Details', 40, 110);
      doc.moveTo(40, 128).lineTo(doc.page.width - 40, 128).strokeColor('#e2e8f0').lineWidth(1).stroke();

      const startY = 138;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569').text('Candidate Name:', 40, startY);
      doc.font('Helvetica').fillColor('#0f172a').text(user.name, 140, startY);

      doc.font('Helvetica-Bold').fillColor('#475569').text('Email Address:', 40, startY + 18);
      doc.font('Helvetica').fillColor('#0f172a').text(user.email, 140, startY + 18);

      doc.font('Helvetica-Bold').fillColor('#475569').text('Assessment:', 320, startY);
      doc.font('Helvetica').fillColor('#0f172a').text(exam.title, 400, startY);

      doc.font('Helvetica-Bold').fillColor('#475569').text('Subject / Topic:', 320, startY + 18);
      doc.font('Helvetica').fillColor('#0f172a').text(exam.subject, 400, startY + 18);

      // --- Executive Summary Score Cards ---
      const cardY = 185;
      const cardWidth = 120;
      const cardHeight = 65;
      const cardSpacing = 12;

      const drawScoreCard = (x, title, value, subtext, color = '#4f46e5') => {
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 6).fillColor('#f8fafc').strokeColor('#e2e8f0').fillAndStroke();
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 8, cardY + 10);
        doc.fillColor(color).fontSize(16).font('Helvetica-Bold').text(value, x + 8, cardY + 24);
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(subtext, x + 8, cardY + 46);
      };

      const scoreDisplay = `${result.score}/${result.totalMarks}`;
      const statusColor = result.isPassed ? '#16a34a' : '#dc2626';
      const statusText = result.isPassed ? 'PASSED' : 'NOT PASSED';

      drawScoreCard(40, 'Final Score', scoreDisplay, `${result.percentage}% marks`);
      drawScoreCard(40 + cardWidth + cardSpacing, 'Result Status', statusText, `Passing: ${result.passingPercentage}%`, statusColor);
      drawScoreCard(40 + (cardWidth + cardSpacing) * 2, 'Accuracy', `${result.accuracy}%`, `${result.correctCount} Correct of ${result.totalQuestions}`);
      
      const rankText = rankInfo && rankInfo.rank ? `#${rankInfo.rank}` : 'N/A';
      const percentileText = rankInfo && rankInfo.percentile ? `${rankInfo.percentile}%` : 'N/A';
      drawScoreCard(40 + (cardWidth + cardSpacing) * 3, 'Rank & Percentile', rankText, `Better than ${percentileText}`);

      // --- Question Breakdown Bar ---
      const metricY = 270;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Question Breakdown & Time Analysis', 40, metricY);
      doc.moveTo(40, metricY + 16).lineTo(doc.page.width - 40, metricY + 16).strokeColor('#e2e8f0').stroke();

      const timeMins = Math.floor(result.timeTakenSeconds / 60);
      const timeSecs = result.timeTakenSeconds % 60;
      const timeDisplay = `${timeMins}m ${timeSecs}s`;

      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      doc.text(`Total Questions: ${result.totalQuestions}`, 40, metricY + 28);
      doc.text(`Correct: ${result.correctCount}`, 160, metricY + 28);
      doc.text(`Incorrect: ${result.incorrectCount}`, 260, metricY + 28);
      doc.text(`Unattempted: ${result.unattemptedCount}`, 360, metricY + 28);
      doc.text(`Time Taken: ${timeDisplay}`, 460, metricY + 28);

      // --- Topic & Subject Performance Table ---
      const tableY = 325;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Topic Mastery Breakdown', 40, tableY);

      let currentY = tableY + 20;

      // Table Header
      doc.rect(40, currentY, doc.page.width - 80, 22).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
      doc.text('Topic', 50, currentY + 6);
      doc.text('Subject', 200, currentY + 6);
      doc.text('Questions', 310, currentY + 6);
      doc.text('Correct', 380, currentY + 6);
      doc.text('Accuracy', 450, currentY + 6);
      doc.text('Status', 510, currentY + 6);

      currentY += 24;

      const topics = result.topicPerformance || [];
      topics.slice(0, 8).forEach((topic) => {
        doc.rect(40, currentY, doc.page.width - 80, 20).fillColor('#ffffff').strokeColor('#f1f5f9').fillAndStroke();
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica');
        doc.text(topic.topic.slice(0, 25), 50, currentY + 5);
        doc.text(topic.subject.slice(0, 20), 200, currentY + 5);
        doc.text(`${topic.totalQuestions}`, 310, currentY + 5);
        doc.text(`${topic.correct}`, 380, currentY + 5);
        doc.text(`${topic.accuracy}%`, 450, currentY + 5);

        const masteryText = topic.accuracy >= 70 ? 'Strong' : topic.accuracy >= 50 ? 'Moderate' : 'Needs Work';
        const masteryColor = topic.accuracy >= 70 ? '#16a34a' : topic.accuracy >= 50 ? '#d97706' : '#dc2626';
        doc.fillColor(masteryColor).font('Helvetica-Bold').text(masteryText, 510, currentY + 5);

        currentY += 22;
      });

      // --- Recommendations & Study Guidance ---
      currentY += 15;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Personalized Improvement Recommendations', 40, currentY);
      doc.moveTo(40, currentY + 16).lineTo(doc.page.width - 40, currentY + 16).strokeColor('#e2e8f0').stroke();

      currentY += 26;

      const weakTopics = (result.topicPerformance || [])
        .filter((t) => t.accuracy < 60)
        .map((t) => t.topic);

      if (weakTopics.length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#dc2626').text('Priority Areas for Revision:');
        doc.font('Helvetica').fillColor('#334155').text(
          `Focus your preparation on: ${weakTopics.join(', ')}. Review foundational concepts and practice targeted problem sets before attempting advanced mock exams.`,
          40,
          currentY + 14,
          { width: doc.page.width - 80 }
        );
        currentY += 40;
      } else {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#16a34a').text('Excellent Concept Retention:');
        doc.font('Helvetica').fillColor('#334155').text(
          'Strong performance across all tested domains. Maintain your mastery through regular timed mock assessments.',
          40,
          currentY + 14,
          { width: doc.page.width - 80 }
        );
        currentY += 40;
      }

      // Footer
      const footerY = doc.page.height - 45;
      doc.rect(40, footerY, doc.page.width - 80, 1).fill('#cbd5e1');
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text(
        'ExamSphere Assessment Engine © 2026. This report is digitally generated and certified by ExamSphere testing services.',
        40,
        footerY + 10,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Student Academic Progress Report PDF
 */
const generateStudentProgressPDF = async ({ student, results = [], assignments = [], teacherComments = [] }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Institutional Header
      doc.rect(0, 0, doc.page.width, 90).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('GL BAJAJ GROUP OF INSTITUTIONS', 40, 24);
      doc.fontSize(11).font('Helvetica').fillColor('#38bdf8').text('GLB ExamSphere • Student Academic Progress Report', 40, 50);

      const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      doc.fontSize(9).fillColor('#94a3b8').text(`Date: ${reportDate}`, doc.page.width - 160, 42, { align: 'right' });

      // Student Academic Meta
      const startY = 115;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Student Profile & Academic Placement', 40, startY);
      doc.moveTo(40, startY + 16).lineTo(doc.page.width - 40, startY + 16).strokeColor('#e2e8f0').lineWidth(1).stroke();

      const metaY = startY + 24;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('Name:', 40, metaY);
      doc.font('Helvetica').fillColor('#0f172a').text(student.name, 90, metaY);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Roll No:', 260, metaY);
      doc.font('Helvetica').fillColor('#0f172a').text(student.rollNumber || 'N/A', 310, metaY);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Class:', 420, metaY);
      doc.font('Helvetica').fillColor('#0f172a').text(`${student.department || 'CSE'} Yr ${student.year || 1} Sec ${student.section || 'A'}`, 460, metaY);

      // Summary Cards
      const cardY = metaY + 28;
      const totalExams = results.length;
      const avgScore = totalExams > 0 ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / totalExams) : 0;
      const passedCount = results.filter((r) => r.isPassed).length;

      const drawStat = (x, title, value, sub) => {
        doc.roundedRect(x, cardY, 118, 55, 6).fillColor('#f8fafc').strokeColor('#e2e8f0').fillAndStroke();
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 8, cardY + 8);
        doc.fillColor('#0f172a').fontSize(15).font('Helvetica-Bold').text(`${value}`, x + 8, cardY + 20);
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(sub, x + 8, cardY + 38);
      };

      drawStat(40, 'Exams Taken', totalExams, 'Completed attempts');
      drawStat(168, 'Average Score', `${avgScore}%`, 'Across all exams');
      drawStat(296, 'Exams Passed', `${passedCount}/${totalExams}`, totalExams > 0 ? `${Math.round((passedCount / totalExams) * 100)}% pass rate` : '0%');
      drawStat(424, 'Assignments', `${assignments.length}`, 'Submitted items');

      // Exam Performance List
      let tableY = cardY + 75;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Recent Assessment Results', 40, tableY);
      tableY += 16;

      doc.rect(40, tableY, doc.page.width - 80, 20).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
      doc.text('Date', 50, tableY + 6);
      doc.text('Exam Title', 130, tableY + 6);
      doc.text('Subject', 290, tableY + 6);
      doc.text('Score', 390, tableY + 6);
      doc.text('Status', 470, tableY + 6);

      tableY += 22;
      results.slice(0, 7).forEach((r) => {
        doc.rect(40, tableY, doc.page.width - 80, 18).fillColor('#ffffff').strokeColor('#f8fafc').fillAndStroke();
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
        const dt = new Date(r.createdAt).toLocaleDateString();
        doc.text(dt, 50, tableY + 5);
        doc.text((r.examId?.title || r.examTitle || 'Exam').slice(0, 25), 130, tableY + 5);
        doc.text((r.examId?.subject || r.subject || 'General').slice(0, 18), 290, tableY + 5);
        doc.text(`${r.score}/${r.totalMarks} (${r.percentage}%)`, 390, tableY + 5);
        doc.fillColor(r.isPassed ? '#16a34a' : '#dc2626').font('Helvetica-Bold').text(r.isPassed ? 'PASSED' : 'RETEST', 470, tableY + 5);
        tableY += 20;
      });

      // Teacher Comments
      if (teacherComments && teacherComments.length > 0) {
        tableY += 10;
        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Teacher Academic Feedback', 40, tableY);
        tableY += 16;
        teacherComments.slice(0, 3).forEach((c) => {
          doc.rect(40, tableY, doc.page.width - 80, 24).fillColor('#f8fafc').strokeColor('#e2e8f0').fillAndStroke();
          doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`"${c.comment}" — ${c.authorName || 'Faculty'}`, 50, tableY + 7);
          tableY += 28;
        });
      }

      // Footer
      const footerY = doc.page.height - 35;
      doc.rect(40, footerY, doc.page.width - 80, 1).fill('#cbd5e1');
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text(
        'GL Bajaj Group of Institutions, Mathura • Examination Cell & Academic Monitoring Division',
        40,
        footerY + 8,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Section Academic Performance Report PDF
 */
const generateSectionReportPDF = async ({ department, year, sectionName, stats = {}, students = [] }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.rect(0, 0, doc.page.width, 90).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('GL BAJAJ GROUP OF INSTITUTIONS', 40, 24);
      doc.fontSize(11).font('Helvetica').fillColor('#38bdf8').text(`Section Performance Report: ${department} Yr ${year} Sec ${sectionName}`, 40, 50);

      const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      doc.fontSize(9).fillColor('#94a3b8').text(`Generated: ${reportDate}`, doc.page.width - 160, 42, { align: 'right' });

      // Overview
      const startY = 115;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Section Academic Summary', 40, startY);
      doc.moveTo(40, startY + 16).lineTo(doc.page.width - 40, startY + 16).strokeColor('#e2e8f0').lineWidth(1).stroke();

      const cardY = startY + 24;
      const drawCard = (x, title, value, sub) => {
        doc.roundedRect(x, cardY, 118, 55, 6).fillColor('#f8fafc').strokeColor('#e2e8f0').fillAndStroke();
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 8, cardY + 8);
        doc.fillColor('#0f172a').fontSize(15).font('Helvetica-Bold').text(`${value}`, x + 8, cardY + 20);
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(sub, x + 8, cardY + 38);
      };

      drawCard(40, 'Total Enrolled', stats.totalStudents || 0, 'Class strength');
      drawCard(168, 'Class Average', `${stats.averageScore || 0}%`, 'Overall examinations');
      drawCard(296, 'Pass Percentage', `${stats.passRate || 0}%`, 'Met passing criteria');
      drawCard(424, 'Active Candidates', `${stats.attemptedCount || 0}`, 'Participating in tests');

      // Areas Needing Revision Table
      let tableY = cardY + 75;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Curricular Areas Needing Revision (Accuracy < 60%)', 40, tableY);
      tableY += 16;

      doc.rect(40, tableY, doc.page.width - 80, 20).fill('#fee2e2');
      doc.fillColor('#991b1b').fontSize(8).font('Helvetica-Bold');
      doc.text('Topic Name', 50, tableY + 6);
      doc.text('Subject', 240, tableY + 6);
      doc.text('Class Accuracy', 380, tableY + 6);
      doc.text('Recommended Action', 460, tableY + 6);

      tableY += 22;
      const topics = stats.needsRevisionTopics || [];
      if (topics.length === 0) {
        doc.rect(40, tableY, doc.page.width - 80, 22).fillColor('#ffffff').strokeColor('#f1f5f9').fillAndStroke();
        doc.fillColor('#16a34a').fontSize(8).font('Helvetica').text('No low-accuracy topics detected. Concept retention across the section is above standard thresholds.', 50, tableY + 6);
        tableY += 26;
      } else {
        topics.forEach((t) => {
          doc.rect(40, tableY, doc.page.width - 80, 20).fillColor('#ffffff').strokeColor('#fef2f2').fillAndStroke();
          doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
          doc.text(t.topic.slice(0, 28), 50, tableY + 5);
          doc.text(t.subject.slice(0, 20), 240, tableY + 5);
          doc.fillColor('#dc2626').font('Helvetica-Bold').text(`${t.accuracy}%`, 380, tableY + 5);
          doc.fillColor('#475569').font('Helvetica').text('Remedial Lecture / Quiz', 460, tableY + 5);
          tableY += 22;
        });
      }

      // Student Roster Snapshot
      tableY += 15;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Section Student Performance Overview', 40, tableY);
      tableY += 16;

      doc.rect(40, tableY, doc.page.width - 80, 20).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
      doc.text('Roll No', 50, tableY + 6);
      doc.text('Student Name', 140, tableY + 6);
      doc.text('Exams Attempted', 310, tableY + 6);
      doc.text('Avg Score', 420, tableY + 6);
      doc.text('Status', 480, tableY + 6);

      tableY += 22;
      students.slice(0, 10).forEach((s) => {
        doc.rect(40, tableY, doc.page.width - 80, 18).fillColor('#ffffff').strokeColor('#f8fafc').fillAndStroke();
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
        doc.text(s.rollNumber || 'N/A', 50, tableY + 5);
        doc.text(s.name.slice(0, 22), 140, tableY + 5);
        doc.text(`${s.examsAttempted || 0}`, 310, tableY + 5);
        doc.text(`${s.averageScore || 0}%`, 420, tableY + 5);
        const status = (s.averageScore || 0) >= 50 ? 'Good' : 'Needs Practice';
        doc.fillColor(status === 'Good' ? '#16a34a' : '#d97706').font('Helvetica-Bold').text(status, 480, tableY + 5);
        tableY += 20;
      });

      // Footer
      const footerY = doc.page.height - 35;
      doc.rect(40, footerY, doc.page.width - 80, 1).fill('#cbd5e1');
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text(
        'GL Bajaj Group of Institutions, Mathura • Official Section Performance Documentation',
        40,
        footerY + 8,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate Exam Analytics Report PDF
 */
const generateExamReportPDF = async ({ exam, stats = {}, results = [] }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.rect(0, 0, doc.page.width, 90).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('GL BAJAJ GROUP OF INSTITUTIONS', 40, 24);
      doc.fontSize(11).font('Helvetica').fillColor('#38bdf8').text(`Exam Evaluation Report: ${exam.title}`, 40, 50);

      const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      doc.fontSize(9).fillColor('#94a3b8').text(`Generated: ${reportDate}`, doc.page.width - 160, 42, { align: 'right' });

      // Assessment Meta
      const startY = 115;
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Examination Parameters', 40, startY);
      doc.moveTo(40, startY + 16).lineTo(doc.page.width - 40, startY + 16).strokeColor('#e2e8f0').lineWidth(1).stroke();

      const metaY = startY + 24;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
      doc.text('Subject:', 40, metaY);
      doc.font('Helvetica').fillColor('#0f172a').text(exam.subject, 90, metaY);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Duration:', 260, metaY);
      doc.font('Helvetica').fillColor('#0f172a').text(`${exam.duration} Minutes`, 310, metaY);

      doc.font('Helvetica-Bold').fillColor('#64748b').text('Total Marks:', 420, metaY);
      doc.font('Helvetica').fillColor('#0f172a').text(`${exam.totalMarks}`, 480, metaY);

      // Score Metrics
      const cardY = metaY + 28;
      const totalAttempts = results.length;
      const avg = totalAttempts > 0 ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / totalAttempts) : 0;
      const passed = results.filter((r) => r.isPassed).length;

      const drawCard = (x, title, value, sub) => {
        doc.roundedRect(x, cardY, 118, 55, 6).fillColor('#f8fafc').strokeColor('#e2e8f0').fillAndStroke();
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 8, cardY + 8);
        doc.fillColor('#0f172a').fontSize(15).font('Helvetica-Bold').text(`${value}`, x + 8, cardY + 20);
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(sub, x + 8, cardY + 38);
      };

      drawCard(40, 'Candidates', totalAttempts, 'Submitted attempts');
      drawCard(168, 'Average Score', `${avg}%`, 'Class average');
      drawCard(296, 'Pass Percentage', totalAttempts > 0 ? `${Math.round((passed / totalAttempts) * 100)}%` : '0%', `${passed} students passed`);
      drawCard(424, 'Passing Mark', `${exam.passingPercentage}%`, 'Configured threshold');

      // Top Performers Table
      let tableY = cardY + 75;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Top Performing Candidates', 40, tableY);
      tableY += 16;

      doc.rect(40, tableY, doc.page.width - 80, 20).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
      doc.text('Rank', 50, tableY + 6);
      doc.text('Candidate Name', 100, tableY + 6);
      doc.text('Score', 280, tableY + 6);
      doc.text('Percentage', 360, tableY + 6);
      doc.text('Accuracy', 440, tableY + 6);

      tableY += 22;
      results.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10).forEach((r, idx) => {
        doc.rect(40, tableY, doc.page.width - 80, 18).fillColor('#ffffff').strokeColor('#f8fafc').fillAndStroke();
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
        doc.text(`#${idx + 1}`, 50, tableY + 5);
        doc.text((r.studentId?.name || r.studentName || 'Student').slice(0, 24), 100, tableY + 5);
        doc.text(`${r.score}/${r.totalMarks}`, 280, tableY + 5);
        doc.text(`${r.percentage}%`, 360, tableY + 5);
        doc.text(`${r.accuracy}%`, 440, tableY + 5);
        tableY += 20;
      });

      // Footer
      const footerY = doc.page.height - 35;
      doc.rect(40, footerY, doc.page.width - 80, 1).fill('#cbd5e1');
      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text(
        'GL Bajaj Group of Institutions, Mathura • Digital Examination Cell Audit & Certification',
        40,
        footerY + 8,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { 
  generateResultPDF,
  generateStudentProgressPDF,
  generateSectionReportPDF,
  generateExamReportPDF,
};

