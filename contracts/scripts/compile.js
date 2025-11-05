const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

// Compilation script for the NetworkManager contract
console.log('Compiling NetworkManager contract...');

// Source directory and output directory paths
const sourcePath = path.resolve(__dirname, '..', 'source');
const buildPath = path.resolve(__dirname, '..', 'compiled');

// Create build folder if it doesn't exist
fs.ensureDirSync(buildPath);

// Get all solidity files from source directory
const sourceFiles = fs.readdirSync(sourcePath).filter(file => file.endsWith('.sol'));

// Create input object for solc compiler
let input = {
  language: 'Solidity',
  sources: {},
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    }
  }
};

// Add all source files to input object
sourceFiles.forEach(fileName => {
  const filePath = path.resolve(sourcePath, fileName);
  const source = fs.readFileSync(filePath, 'utf8');
  input.sources[fileName] = { content: source };
});

// Compile all contracts
try {
  console.log(`Compiling ${sourceFiles.length} Solidity files...`);
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for errors
  if (output.errors) {
    output.errors.forEach(error => {
      if (error.severity === 'error') {
        console.error(error.formattedMessage);
      }
    });
    
    // Exit if there are severe errors
    if (output.errors.some(error => error.severity === 'error')) {
      console.error('Compilation failed due to errors.');
      process.exit(1);
    }
  }

  // Extract compiled contracts
  for (const fileName in output.contracts) {
    const contractName = fileName.replace('.sol', '');
    const contract = output.contracts[fileName][contractName];
    
    // Save contract artifacts
    fs.writeFileSync(
      path.resolve(buildPath, `${contractName}.json`),
      JSON.stringify({
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
      }, null, 2)
    );
    
    console.log(`Compiled ${contractName} successfully`);
  }
  
  console.log('Compilation complete. Artifacts saved to ./compiled directory.');

} catch (error) {
  console.error('Error during compilation:', error);
  process.exit(1);
}
