const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('Real JCL File Parsing Tests', function() {
  const jclDir = path.join(__dirname, '..', 'examples', 'jcl');
  
  describe('JCL File Structure Analysis', function() {
    it('should identify all JCL files in examples directory', function() {
      const files = fs.readdirSync(jclDir)
        .filter(f => f.endsWith('.jcl') || f.endsWith('.JCL'));
      
      expect(files).to.have.length.greaterThan(0);
      console.log(`Found ${files.length} JCL files for testing`);
    });

    it('should validate basic JCL structure patterns', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      // Check for JOB statement
      expect(testFile).to.match(/^\/\/\w+\s+JOB/m);
      
      // Check for EXEC statements
      expect(testFile).to.match(/^\/\/\w+\s+EXEC/m);
      
      // Check for DD statements
      expect(testFile).to.match(/^\/\/\w+\s+DD/m);
      
      // Check for comments
      expect(testFile).to.match(/^\/\/\*/m);
    });
  });

  describe('JCL Pattern Recognition', function() {
    it('should recognize continuation lines', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      // Check for continuation pattern (line ending with comma)
      const continuationPattern = /,\s*\n\/\/\s+/;
      expect(testFile).to.match(continuationPattern);
    });

    it('should recognize symbolic parameters', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      // Check for &SYSUID and other symbolic parameters
      expect(testFile).to.match(/&SYSUID/);
    });

    it('should recognize GDG datasets', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      // Check for GDG notation (+1)
      expect(testFile).to.match(/\(\+\d\)/);
    });

    it('should recognize VSAM datasets', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      // Check for VSAM dataset names
      expect(testFile).to.match(/\.VSAM\.(KSDS|ESDS|RRDS|AIX)/);
    });

    it('should recognize inline data', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'FTPJCL.JCL'), 
        'utf8'
      );
      
      // Check for DD * pattern
      expect(testFile).to.match(/DD\s+\*/);
      
      // Note: This file ends with //* (comment) not /* delimiter
      // Let's check a file that has proper /* delimiter
      const defgdgFile = fs.readFileSync(
        path.join(jclDir, 'DEFGDGB.jcl'), 
        'utf8'
      );
      
      // Check for /* delimiter in DEFGDGB
      expect(defgdgFile).to.match(/^\/\*\s*$/m);
    });
  });

  describe('Complex JCL Constructs', function() {
    it('should handle IDCAMS control statements', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'DEFGDGB.jcl'), 
        'utf8'
      );
      
      // Check for IDCAMS DEFINE commands
      expect(testFile).to.match(/DEFINE\s+GENERATIONDATAGROUP/);
      
      // Check for IF LASTCC conditions
      expect(testFile).to.match(/IF\s+LASTCC/);
    });

    it('should handle DCB parameters', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      // Check for DCB parameter
      expect(testFile).to.match(/DCB=\(/);
      expect(testFile).to.match(/RECFM=/);
      expect(testFile).to.match(/LRECL=/);
    });

    it('should handle SPACE parameters', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      // Check for SPACE parameter
      expect(testFile).to.match(/SPACE=\(/);
      expect(testFile).to.match(/CYL/);
      expect(testFile).to.match(/RLSE/);
    });
  });

  describe('JCL Validation Rules', function() {
    it('should validate JOB name length (1-8 characters)', function() {
      const files = fs.readdirSync(jclDir)
        .filter(f => f.endsWith('.jcl') || f.endsWith('.JCL'));
      
      files.forEach(file => {
        const content = fs.readFileSync(path.join(jclDir, file), 'utf8');
        const jobMatch = content.match(/^\/\/(\w+)\s+JOB/m);
        
        if (jobMatch) {
          const jobName = jobMatch[1];
          expect(jobName).to.have.length.at.least(1);
          expect(jobName).to.have.length.at.most(8);
          expect(jobName).to.match(/^[A-Z][A-Z0-9#@$]*/);
        }
      });
    });

    it('should validate step names are unique within a job', function() {
      const testFile = fs.readFileSync(
        path.join(jclDir, 'INTCALC.jcl'), 
        'utf8'
      );
      
      const stepNames = [];
      const stepPattern = /^\/\/(\w+)\s+EXEC/gm;
      let match;
      
      while ((match = stepPattern.exec(testFile)) !== null) {
        const stepName = match[1];
        expect(stepNames).to.not.include(stepName, 
          `Duplicate step name found: ${stepName}`);
        stepNames.push(stepName);
      }
    });
  });

  describe('Parser Integration Tests', function() {
    it('should count statements in real JCL files', function() {
      const files = ['INTCALC.jcl', 'FTPJCL.JCL', 'DEFGDGB.jcl'];
      
      files.forEach(file => {
        const content = fs.readFileSync(path.join(jclDir, file), 'utf8');
        const lines = content.split('\n');
        
        let jobCount = 0;
        let execCount = 0;
        let ddCount = 0;
        let commentCount = 0;
        
        lines.forEach(line => {
          if (/^\/\/\w+\s+JOB/.test(line)) jobCount++;
          if (/^\/\/\w+\s+EXEC/.test(line)) execCount++;
          if (/^\/\/\w+\s+DD/.test(line)) ddCount++;
          if (/^\/\/\*/.test(line)) commentCount++;
        });
        
        console.log(`${file}: JOB=${jobCount}, EXEC=${execCount}, DD=${ddCount}, Comments=${commentCount}`);
        
        expect(jobCount).to.be.at.least(1, `${file} should have at least one JOB`);
        expect(execCount).to.be.at.least(1, `${file} should have at least one EXEC`);
      });
    });
  });
});

module.exports = {
  validateJCLSyntax: function(jclContent) {
    // Basic validation function for JCL syntax
    const errors = [];
    
    // Check for JOB statement
    if (!/^\/\/\w+\s+JOB/m.test(jclContent)) {
      errors.push('Missing JOB statement');
    }
    
    // Check for unmatched /* without DD *
    const ddAsterisk = (jclContent.match(/DD\s+\*/g) || []).length;
    const slashAsterisk = (jclContent.match(/^\/\*$/gm) || []).length;
    
    if (ddAsterisk > 0 && ddAsterisk !== slashAsterisk) {
      errors.push('Unmatched inline data delimiters');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
};