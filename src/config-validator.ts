import type { AgentType } from './types.js';

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnvConfig(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const defaultAgent = process.env.DEFAULT_AGENT as AgentType | undefined;

  if (!anthropicApiKey) {
    missing.push('ANTHROPIC_API_KEY');
  }

  if (!openaiApiKey) {
    missing.push('OPENAI_API_KEY');
  }

  if (defaultAgent) {
    if (defaultAgent === 'anthropic' && !anthropicApiKey) {
      warnings.push('DEFAULT_AGENT is set to "anthropic" but ANTHROPIC_API_KEY is missing.');
    } else if ((defaultAgent === 'codex' || defaultAgent === 'openai') && !openaiApiKey) {
      warnings.push(`DEFAULT_AGENT is set to "${defaultAgent}" but OPENAI_API_KEY is missing.`);
    }
  }

  const valid = missing.length === 0;
  return { valid, missing, warnings };
}
