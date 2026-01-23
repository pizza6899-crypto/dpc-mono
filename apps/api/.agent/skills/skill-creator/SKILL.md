---
name: skill_creator
description: Scaffolds a new skill structure for the agent following the official Agent Skills specification.
---

# Skill Creator

This skill helps in creating new skills for the agent by scaffolding the necessary directory structure and file templates in accordance with the Agent Skills standard.

## Usage

When the user asks to create a new skill, follow this rigorous process to ensure high-quality skill creation.

### 1. Identify Skill Requirements

Ask yourself or the user for the following:
*   **Skill Name**: Must be:
    *   1-64 characters.
    *   Lowercase alphanumeric and hyphens only (`a-z`, `-`).
    *   No starting/ending hyphens.
    *   No consecutive hyphens (`--`).
*   **Short Description**: Max 1024 characters. clearly describing *what* it does and *when* to activate it.
*   **Purpose**: A detailed understanding of the instructions needed in the body.

### 2. Scaffold Directory Structure

Create the following folder structure at `apps/api/.agent/skills/<skill-name>/`:

```text
<skill-name>/
├── SKILL.md            # Required: Metadata + Main Instructions
├── scripts/            # Optional: Executable code (Python, Bash, JS)
├── references/         # Optional: Detailed docs, forms, large text
└── assets/             # Optional: Templates, images, data files
```

### 3. Create SKILL.md Template

Create the `SKILL.md` file using this official template. Ensure the frontmatter follows YAML standards.

```markdown
---
name: <skill-name>
description: <short_description_for_activation>
# Optional fields (remove if not needed)
# license: Apache-2.0
# compatibility: Requires specific tools/env
# metadata:
#   author: <your-name>
#   version: "1.0"
---

# <Human Readable Title>

## Overview
<Brief explanation of the skill's capability.>

## Instructions
<Step-by-step authoritative instructions.>

1.  Step one...
2.  Step two...

## Examples
<Usage examples, input/output pairs.>

## References
<!-- 
Use progressive disclosure: 
Keep this main file under ~500 lines (~5000 tokens).
Link to detailed docs in references/ directory.
-->
See [Detailed Guide](references/GUIDE.md) for more info.
```

### 4. Best Practices Checklist

Before finalizing, verify:
*   [ ] **Progressive Disclosure**: Is the `SKILL.md` concise? Are detailed implementation guides moved to `references/`?
*   [ ] **Self-Contained**: Do scripts in `scripts/` handle their own dependencies or fail gracefully?
*   [ ] **Naming**: Does the directory name match the `name` field in frontmatter exactly?
*   [ ] **Context Efficiency**: Is the description optimized for the agent to know *when* to activate this skill without reading the whole file?

### 5. Final Confirmation

Inform the user:
*   Skill created at: `apps/api/.agent/skills/<skill-name>/`
*   Remind them to fill in the `references/` or `scripts/` if placeholders were created.
