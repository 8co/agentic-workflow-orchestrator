# Agentic Workflow Orchestrator Usage Guide

## Prerequisites

To use the Agentic Workflow Orchestrator, ensure the following are installed and configured:

1. **Node.js and npm** - Make sure you have Node.js (version 18 or higher) and npm installed on your system.
2. **API Keys** - Obtain necessary API keys for any agents you will be using:
   - Anthropic (Claude) - Requires `ANTHROPIC_API_KEY`.
   - OpenAI (GPT/Codex) - Requires `OPENAI_API_KEY`.

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/agentic-workflow-orchestrator.git
   cd agentic-workflow-orchestrator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy the example .env file:
     ```bash
     cp .env.example .env
     ```

   - Edit `.env` and add your API keys:
     ```
     ANTHROPIC_API_KEY=your_anthropic_api_key
     OPENAI_API_KEY=your_openai_api_key
     ```

## Modes of Operation

### 1. Run Mode (Generate-only)

Run mode generates LLM output to files for human review without automatic testing or committing.

### 2. Autonomous Mode

In autonomous mode, the orchestrator generates code, performs automated verification, and commits the changes if successful.

## Command Reference

### Run a Workflow

Run a workflow in generate-only mode:

```bash
npx tsx src/cli.ts run <workflow.yaml> [--var key=value] [--agent anthropic|openai|cursor]
```

### Run a Workflow in Autonomous Mode

Run a workflow in autonomous mode:

```bash
npx tsx src/cli.ts auto <workflow.yaml> [--var key=value] [--agent openai|anthropic]
```

### List Executions

List all workflow executions:

```bash
npx tsx src/cli.ts list
```

### Resume a Workflow

Resume a failed workflow:

```bash
npx tsx src/cli.ts resume <executionId>
```

## Creating a Workflow YAML

To define a workflow, create a YAML file with the following fields:

- **name**: The workflow's name.
- **description**: A brief description of the workflow.
- **target_dir**: The directory where files will be written.
- **branch**: (Optional) Branch name for feature development.
- **variables**: Key-value pairs for use in steps.
- **steps**: List of steps in the workflow. Each step includes:
  - **id**: Unique identifier.
  - **prompt**: Path to the prompt template.
  - **context_files**: List of files to provide as context.
  - **verify**: Verification commands (optional).
  - **max_attempts**: Maximum retry attempts.
  - **commit_message**: Commit message template.

## Creating a Prompt Template

Create a template file to define steps. Use variable syntax `{{var}}` for dynamic content and `{{steps.id.output}}` for output chaining between steps.

## Example: Adding a Utility Function

Create a new workflow YAML to add a utility function autonomously:

1. Define the workflow in `add-utility.yaml`:

   ```yaml
   name: add-utility
   description: Add a utility function to the project
   target_dir: "src/"
   steps:
     - id: addFunction
       prompt: prompts/add-function.md
       context_files:
         - src/types.ts
   ```

2. Create a prompt template `prompts/add-function.md`:

   ```
   Implement the utility function as specified: **{{function_name}}**

   Function description: {{function_description}}
   ```

3. Run the workflow:

   ```bash
   npx tsx src/cli.ts auto workflows/add-utility.yaml --var function_name="calculateSum" --var function_description="Calculates sum of two numbers"
   ```

## Error Feedback Loop

In autonomous mode, if a build/test verification fails, errors are fed back to the LLM to attempt a retry with fixes. This loop continues to a maximum number of attempts (specified by `max_attempts`) until the issue is resolved or the attempts are exhausted.
