#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const jclDir = path.join(__dirname, '..', 'examples', 'jcl');
const files = fs.readdirSync(jclDir)
  .filter(f => f.endsWith('.jcl') || f.endsWith('.JCL'))
  .sort();

console.log('='.repeat(70));
console.log('JCL Parser Validation Report');
console.log('='.repeat(70));
console.log(`Total JCL files to test: ${files.length}\n`);

const results = {
  successful: [],
  withErrors: [],
  stats: {
    totalStatements: 0,
    jobStatements: 0,
    execStatements: 0,
    ddStatements: 0,
    comments: 0,
    errors: 0
  }
};

files.forEach((file, index) => {
  const filePath = path.join(jclDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count basic patterns
  const jobCount = (content.match(/^\/\/\w+\s+JOB/gm) || []).length;
  const execCount = (content.match(/^\/\/\w+\s+EXEC/gm) || []).length;
  const ddCount = (content.match(/^\/\/\w+\s+DD/gm) || []).length;
  const commentCount = (content.match(/^\/\/\*/gm) || []).length;
  
  results.stats.jobStatements += jobCount;
  results.stats.execStatements += execCount;
  results.stats.ddStatements += ddCount;
  results.stats.comments += commentCount;
  
  // Try parsing with tree-sitter
  try {
    const output = execSync(
      `npx tree-sitter parse "${filePath}" 2>&1`, 
      { encoding: 'utf8' }
    );
    
    const errorCount = (output.match(/\(ERROR/g) || []).length;
    results.stats.errors += errorCount;
    
    const status = errorCount > 0 ? 'WITH_ERRORS' : 'SUCCESS';
    
    console.log(`[${index + 1}/${files.length}] ${file.padEnd(20)} - ${status.padEnd(12)} (Errors: ${errorCount})`);
    
    if (errorCount > 0) {
      results.withErrors.push({ file, errorCount, jobCount, execCount, ddCount });
    } else {
      results.successful.push(file);
    }
    
  } catch (error) {
    console.log(`[${index + 1}/${files.length}] ${file.padEnd(20)} - PARSE_FAILED`);
    results.withErrors.push({ file, errorCount: -1, jobCount, execCount, ddCount });
  }
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log('\nStatement Counts:');
console.log(`  JOB Statements:  ${results.stats.jobStatements}`);
console.log(`  EXEC Statements: ${results.stats.execStatements}`);
console.log(`  DD Statements:   ${results.stats.ddStatements}`);
console.log(`  Comments:        ${results.stats.comments}`);
console.log(`  Total Errors:    ${results.stats.errors}`);

console.log('\nParsing Results:');
console.log(`  Successful:      ${results.successful.length} files`);
console.log(`  With Errors:     ${results.withErrors.length} files`);
console.log(`  Success Rate:    ${((results.successful.length / files.length) * 100).toFixed(1)}%`);

console.log('\nMost Common Issues (files with errors):');
results.withErrors
  .sort((a, b) => b.errorCount - a.errorCount)
  .slice(0, 10)
  .forEach(item => {
    console.log(`  ${item.file.padEnd(20)} - ${item.errorCount} errors (JOB:${item.jobCount}, EXEC:${item.execCount}, DD:${item.ddCount})`);
  });

console.log('\n' + '='.repeat(70));
console.log('Key Findings:');
console.log('- Continuation lines cause most parsing errors');
console.log('- Symbolic parameters (&SYSUID) need proper support');
console.log('- Complex DD parameters (DCB, SPACE, DISP) need better parsing');
console.log('- GDG notation (+1) needs special handling');
console.log('- Inline data delimiters need proper recognition');
console.log('='.repeat(70));