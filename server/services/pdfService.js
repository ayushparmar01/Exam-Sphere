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

module.exports = { generateResultPDF };
