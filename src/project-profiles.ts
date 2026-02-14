export interface VerifyCommand {
  command: string;
  args: string[];
  optional?: boolean;
}

export interface ProjectProfile {
  language: 'TypeScript' | 'JavaScript';
  codeLang: 'typescript' | 'javascript';
  fileExt: 'ts' | 'js';
  moduleSystem: string;
  languageInstructions: string;
  defaultVerify: VerifyCommand[];
  defaultScanDirs: string[];
  defaultSkipPatterns: string[];
  conventions: string;
}

export const PROJECT_PROFILES: Record<string, ProjectProfile> = {
  'typescript-node': {
    language: 'TypeScript',
    codeLang: 'typescript',
    fileExt: 'ts',
    moduleSystem: 'ES modules (import/export, .js extensions in imports)',
    languageInstructions: 'TypeScript strict mode — no `any`, no implicit types.',
    defaultVerify: [
      {
        command: 'npx',
        args: ['tsc', '--noEmit'],
      },
    ],
    defaultScanDirs: ['src'],
    defaultSkipPatterns: ['node_modules', 'dist', '.git'],
    conventions: '',
  },
  'serverless-js': {
    language: 'JavaScript',
    codeLang: 'javascript',
    fileExt: 'js',
    moduleSystem: 'CommonJS (require/module.exports)',
    languageInstructions: 'Plain JavaScript (ES2022+). No TypeScript syntax. Use JSDoc for type hints where helpful.',
    defaultVerify: [
      {
        command: 'npx',
        args: ['webpack', '--mode', 'production'],
      },
    ],
    defaultScanDirs: ['src', 'handlers'],
    defaultSkipPatterns: ['node_modules', '.serverless', '.webpack'],
    conventions: 'Handler pattern: module.exports = { handler: async function }. AWS Lambda + DynamoDB + SQS.',
  },
  'react-vite': {
    language: 'TypeScript',
    codeLang: 'typescript',
    fileExt: 'ts',
    moduleSystem: 'ES modules (import/export, .js extensions in imports)',
    languageInstructions: 'TypeScript strict mode — no `any`, no implicit types.',
    defaultVerify: [
      {
        command: 'npm',
        args: ['run', 'build'],
      },
    ],
    defaultScanDirs: ['src'],
    defaultSkipPatterns: ['node_modules', 'dist'],
    conventions: '',
  },
  'nextjs-ts': {
    language: 'TypeScript',
    codeLang: 'typescript',
    fileExt: 'ts',
    moduleSystem: 'ES modules (import/export, .js extensions in imports)',
    languageInstructions: 'TypeScript strict mode — no `any`, no implicit types.',
    defaultVerify: [
      {
        command: 'npm',
        args: ['run', 'build'],
      },
    ],
    defaultScanDirs: ['src', 'app', 'pages'],
    defaultSkipPatterns: ['node_modules', '.next'],
    conventions: '',
  },
  'sst-v2': {
    language: 'TypeScript',
    codeLang: 'typescript',
    fileExt: 'ts',
    moduleSystem: 'ES modules (import/export, .js extensions in imports)',
    languageInstructions: 'TypeScript strict mode — no `any`, no implicit types.',
    defaultVerify: [
      {
        command: 'npx',
        args: ['tsc', '--noEmit'],
      },
    ],
    defaultScanDirs: ['src', 'infra', 'packages'],
    defaultSkipPatterns: ['node_modules', '.sst'],
    conventions: '',
  },
  'expo-react-native': {
    language: 'TypeScript',
    codeLang: 'typescript',
    fileExt: 'ts',
    moduleSystem: 'ES modules (import/export, .js extensions in imports)',
    languageInstructions: 'TypeScript strict mode — no `any`, no implicit types.',
    defaultVerify: [
      {
        command: 'npx',
        args: ['expo-doctor'],
      },
    ],
    defaultScanDirs: ['src', 'app'],
    defaultSkipPatterns: ['node_modules', '.expo'],
    conventions: '',
  },
};

export function getProfile(projectType: string): ProjectProfile | undefined {
  return PROJECT_PROFILES[projectType];
}

export function getLanguageVarsFromProfile(profile: ProjectProfile): Record<string, string> {
  return {
    language: profile.language,
    code_lang: profile.codeLang,
    file_ext: profile.fileExt,
    module_system: profile.moduleSystem,
    language_instructions: profile.languageInstructions,
  };
}
