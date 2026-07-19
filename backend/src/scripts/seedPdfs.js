/**
 * PDF Parser & Database Seeder
 *
 * Usage:
 *   node src/scripts/seedPdfs.js
 *
 * Place your PDF files in backend/pdfs/ directory.
 * The script will auto-detect all .pdf files, parse questions,
 * and seed them into the database (deduplicating by checksum).
 *
 * Expected PDF format per question:
 *   Q1. Question text here?
 *   A) Option A text
 *   B) Option B text
 *   C) Option C text
 *   D) Option D text
 *   Answer: A
 *   Explanation: Detailed explanation text here.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PDF_DIR = path.join(__dirname, '../../pdfs');

/**
 * Parse questions from GKToday PDF text format.
 * Format:
 *   1. Question text here?
 *   [A] Option A
 *   [B] Option B
 *   [C] Option C
 *   [D] Option D
 *   Answer: Option A text (the actual text of correct option)
 *   Explanation paragraph...
 *
 *   Next question...
 */
function parseQuestions(text, sourcePdf) {
  const questions = [];

  // Normalize line endings and clean up PDF footers
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove GKToday footers that bleed into options
  normalized = normalized.replace(/\s*Current Affairs MCQs PDF[^\n]*/gi, '');
  normalized = normalized.replace(/\s*©\s*\d{4}\s*GKToday[^\n]*/gi, '');
  normalized = normalized.replace(/\s*https?:\/\/www\.gktoday\.in[^\n]*/gi, '');
  normalized = normalized.replace(/\s*For printed books: GKTBOOKS\.COM[^\n]*/gi, '');
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    // Remove standalone page-number lines (lone integers ≤ 9999) that PDF parsers
    // inject from running footers/headers between content lines.
    .filter((l) => !/^\d{1,4}$/.test(l));

  let i = 0;

  while (i < lines.length) {
    // Match question line: "1." or "1)" at start
    const qMatch = lines[i].match(/^(\d+)[.)]\s+(.+)/);
    if (!qMatch) { i++; continue; }

    let fullQuestion = qMatch[2].trim();
    i++;

    // Collect multi-line question text until we hit [A]
    while (i < lines.length && !lines[i].match(/^\[A\]/i)) {
      if (lines[i].match(/^\[\w\]/)) break;
      fullQuestion += ' ' + lines[i];
      i++;
    }
    fullQuestion = fullQuestion.replace(/\s+/g, ' ').trim();

    // Parse [A] [B] [C] [D] options
    const options = {};
    const optionKeys = ['A', 'B', 'C', 'D'];
    for (const key of optionKeys) {
      if (i >= lines.length) break;
      const optMatch = lines[i].match(new RegExp(`^\\[${key}\\]\\s*(.+)`, 'i'));
      if (!optMatch) break;
      let optText = optMatch[1].trim();
      i++;
      // Collect multi-line option
      while (i < lines.length && !lines[i].match(/^\[[A-D]\]/i) && !lines[i].match(/^Answer:/i)) {
        if (lines[i].match(/^\d+[.)]\s/)) break;
        optText += ' ' + lines[i];
        i++;
      }
      options[key] = optText.replace(/\s+/g, ' ').trim();
    }

    if (!options.A || !options.B || !options.C || !options.D) { continue; }

    // Parse "Answer: <text>" - match the answer text to one of the options
    if (i >= lines.length || !lines[i].match(/^Answer:/i)) { continue; }

    const answerText = lines[i].replace(/^Answer:\s*/i, '').trim();
    i++;

    // Find which option key matches the answer text
    let correctAnswer = null;
    for (const [key, val] of Object.entries(options)) {
      if (val.toLowerCase().replace(/\s+/g, ' ') === answerText.toLowerCase().replace(/\s+/g, ' ')) {
        correctAnswer = key;
        break;
      }
    }
    // Fallback: partial match
    if (!correctAnswer) {
      for (const [key, val] of Object.entries(options)) {
        if (val.toLowerCase().includes(answerText.toLowerCase()) ||
            answerText.toLowerCase().includes(val.toLowerCase())) {
          correctAnswer = key;
          break;
        }
      }
    }
    // Fallback: first word match
    if (!correctAnswer) {
      const ansWords = answerText.toLowerCase().split(/\s+/).filter(Boolean);
      for (const [key, val] of Object.entries(options)) {
        const valWords = val.toLowerCase().split(/\s+/).filter(Boolean);
        if (ansWords.length > 0 && valWords.length > 0 && ansWords[0] === valWords[0]) {
          correctAnswer = key;
          break;
        }
      }
    }

    if (!correctAnswer) { continue; }

    // Parse explanation - everything until the next numbered question
    let explanation = '';
    while (i < lines.length && !lines[i].match(/^\d+[.)]\s+/)) {
      explanation += ' ' + lines[i];
      i++;
    }
    explanation = explanation.replace(/\s+/g, ' ').trim();
    if (!explanation) explanation = `Correct answer is ${options[correctAnswer]}.`;

    // Compute checksum for deduplication
    const checksumSource = `${fullQuestion}|${options.A}|${options.B}|${options.C}|${options.D}`;
    const checksum = crypto.createHash('md5').update(checksumSource.toLowerCase()).digest('hex');

    questions.push({
      question: fullQuestion,
      optionA: options.A,
      optionB: options.B,
      optionC: options.C,
      optionD: options.D,
      correctAnswer,
      explanation,
      sourcePdf,
      checksum,
    });
  }

  return questions;
}


async function seedPdf(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);

  const buffer = fs.readFileSync(filePath);
  let data;
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    console.error(`  ❌ Failed to parse PDF: ${err.message}`);
    return { parsed: 0, inserted: 0, skipped: 0 };
  }

  const questions = parseQuestions(data.text, fileName);
  console.log(`  ✅ Parsed ${questions.length} questions`);

  let inserted = 0;
  let skipped = 0;

  for (const q of questions) {
    try {
      await prisma.question.create({ data: q });
      inserted++;
    } catch (err) {
      if (err.code === 'P2002') {
        skipped++; // Duplicate
      } else {
        console.error(`  ⚠️  Error inserting question: ${err.message}`);
      }
    }
  }

  console.log(`  📥 Inserted: ${inserted} | Skipped (duplicate): ${skipped}`);
  return { parsed: questions.length, inserted, skipped };
}

async function main() {
  console.log('🚀 Quiz Platform — PDF Seeder');
  console.log('================================');

  if (!fs.existsSync(PDF_DIR)) {
    console.error(`❌ PDF directory not found: ${PDF_DIR}`);
    console.log('  Create the directory and place your PDF files there.');
    process.exit(1);
  }

  const pdfFiles = fs.readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.log('⚠️  No PDF files found in:', PDF_DIR);
    console.log('  Place your GK PDF files there and run this script again.');
    process.exit(0);
  }

  console.log(`Found ${pdfFiles.length} PDF file(s): ${pdfFiles.join(', ')}`);

  let totalParsed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const file of pdfFiles) {
    const filePath = path.join(PDF_DIR, file);
    const result = await seedPdf(filePath);
    totalParsed += result.parsed;
    totalInserted += result.inserted;
    totalSkipped += result.skipped;
  }

  const totalInDb = await prisma.question.count();

  console.log('\n================================');
  console.log('📊 Summary:');
  console.log(`  Total Parsed   : ${totalParsed}`);
  console.log(`  Total Inserted : ${totalInserted}`);
  console.log(`  Total Skipped  : ${totalSkipped}`);
  console.log(`  Total in DB    : ${totalInDb}`);

  if (totalInDb < 30) {
    console.log('\n⚠️  WARNING: Less than 30 questions in DB. Quiz generation requires at least 30.');
  } else {
    console.log('\n✅ Database ready for quiz generation!');
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
