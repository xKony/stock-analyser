---
name: agent-skill-creator
description: Creates high-quality skill files for programming agents following Anthropic's best practices. Use when asked to create, generate, design, or build a new skill, agent capability, or SKILL.md file. Handles skill requirements analysis, structure design, and validation.
---

# Agent Skill Creator

Creates production-ready SKILL.md files that follow Anthropic's skill authoring best practices.

## Trigger Criteria

Activate this skill when:

- User requests "create a skill for..."
- User mentions "build a new agent skill"
- User asks to "design a SKILL.md file"
- User provides skill requirements or specifications
- User wants to improve or refactor an existing skill

## Skill Creation Workflow

Copy this checklist and track progress:

```
Skill Creation Progress:
- [ ] Step 1: Gather requirements and scope
- [ ] Step 2: Design skill structure
- [ ] Step 3: Write YAML frontmatter
- [ ] Step 4: Create SKILL.md body
- [ ] Step 5: Apply best practices review
- [ ] Step 6: Validate against checklist
```

### Step 1: Gather Requirements and Scope

Ask clarifying questions to understand:

**Core purpose**: What problem does this skill solve? What specific capability does it enable?

**Trigger conditions**: When should agents use this skill? What keywords or contexts indicate relevance?

**Complexity level**:

- Simple (single file, <100 lines)
- Medium (main file + 1-2 references)
- Complex (multiple reference files, scripts, workflows)

**Target models**: Will this be used with Haiku, Sonnet, Opus, or all three?

**Code requirements**: Does this skill need executable scripts, or is it instruction-only?

### Step 2: Design Skill Structure

Choose the appropriate architecture:

**For simple skills** (single capability, straightforward instructions):

```
skill-name/
└── SKILL.md (complete instructions)
```

**For medium skills** (some advanced features):

```
skill-name/
├── SKILL.md (overview + basic usage)
└── ADVANCED.md (detailed techniques)
```

**For complex skills** (multiple domains or extensive reference):

```
skill-name/
├── SKILL.md (overview and navigation)
├── reference/
│   ├── domain1.md
│   └── domain2.md
└── scripts/ (if needed)
    └── utility.py
```

### Step 3: Write YAML Frontmatter

Create compliant metadata:

```yaml
---
name: skill-name-here
description: [What it does] + [When to use it with key terms]
---
```

**Name requirements**:

- Maximum 64 characters
- Lowercase letters, numbers, hyphens only
- No XML tags, no reserved words (anthropic, claude)
- Use gerund form: `processing-pdfs`, `analyzing-data`

**Description requirements**:

- Maximum 1024 characters
- Third person voice ("Processes files..." not "I can process...")
- Include BOTH what and when
- Add specific trigger terms and keywords
- No XML tags

**Example description**:

```
Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

### Step 4: Create SKILL.md Body

Follow this structure, adapting sections to the skill's complexity:

```markdown
# [Skill Name]

## Quick Start

[Most common usage with minimal example - assume Claude is smart]

## Core Operations

[Primary capabilities with concise instructions]

## Workflows (if needed)

[Multi-step processes with checklist pattern - see Step 4a]

## Advanced Features (if needed)

[Link to separate files for progressive disclosure]
**Feature X**: See [FEATURE_X.md](FEATURE_X.md)

## Common Patterns

[Templates, examples, conditional workflows - see Step 4b]

## Troubleshooting

[Common issues and solutions]
```

#### Step 4a: Create Workflows for Complex Tasks

For multi-step processes, provide a copyable checklist:

```markdown
## [Workflow Name]

Copy this checklist and check off items as you complete them:
```

Task Progress:

- [ ] Step 1: [Action description]
- [ ] Step 2: [Action description]
- [ ] Step 3: [Action description]

```

**Step 1: [Action description]**

[Specific instructions with commands or code if needed]

**Step 2: [Action description]**

[Specific instructions]

If [condition], return to Step 1.

**Step 3: [Action description]**

[Final steps with validation]
```

#### Step 4b: Include Common Patterns

**Template Pattern** (for structured outputs):

```markdown
## Output Format

Use this template structure:
```

[Template with placeholders]

```

Adapt sections based on the specific analysis.
```

**Examples Pattern** (for quality-dependent outputs):

```markdown
## [Task] Examples

**Example 1:**
Input: [concrete input]
Output:
```

[concrete output]

```

**Example 2:**
Input: [different input]
Output:
```

[different output]

```

Follow this style: [pattern description]
```

**Conditional Workflow Pattern**:

```markdown
## Decision Workflow

1. Determine the task type:

   **Type A?** → Follow "Type A workflow" below
   **Type B?** → Follow "Type B workflow" below

2. Type A workflow:
   - [Steps for Type A]

3. Type B workflow:
   - [Steps for Type B]
```

### Step 5: Apply Best Practices Review

Check each principle:

**Conciseness**: Remove unnecessary explanations. Claude already knows common concepts. Challenge every paragraph: "Does Claude really need this?"

**Degrees of Freedom**: Match specificity to fragility:

- High freedom: Text instructions for flexible tasks
- Low freedom: Exact scripts for error-prone operations

**Progressive Disclosure**: If SKILL.md exceeds 400 lines, split content:

- Keep overview in SKILL.md
- Move details to separate files
- Link with clear descriptions: "See [DETAILS.md](DETAILS.md) for complete API reference"

**Terminology**: Use one term consistently throughout:

- Pick "field" OR "box" OR "element" - never mix
- Pick "extract" OR "retrieve" OR "get" - never mix

**No Time-Sensitivity**: Avoid dates, versions, "current", "latest". Use "Old patterns" sections for deprecated content.

**Unix Paths**: Always forward slashes: `scripts/helper.py` not `scripts\helper.py`

**Avoid Over-Options**: Give one default approach, mention alternatives only when necessary.

### Step 6: Validate Against Checklist

Review the completed skill:

#### Core Quality Checklist

- [ ] Description is specific and includes both what and when
- [ ] Description includes key trigger terms
- [ ] SKILL.md body is under 500 lines
- [ ] No time-sensitive information
- [ ] Consistent terminology throughout
- [ ] Examples are concrete, not abstract
- [ ] File references are one level deep (no nested references)
- [ ] Progressive disclosure used if content is extensive
- [ ] Workflows have clear, numbered steps with checklists
- [ ] Third-person voice in description

#### Code & Scripts Checklist (if applicable)

- [ ] Scripts solve problems, don't punt to Claude
- [ ] Error handling is explicit
- [ ] No magic numbers (all values justified)
- [ ] Required packages listed and verified
- [ ] Scripts have clear documentation
- [ ] Unix-style paths only (forward slashes)
- [ ] Validation steps for critical operations

#### Structure Checklist

- [ ] YAML frontmatter is valid
- [ ] Name is lowercase, hyphens only, under 64 chars
- [ ] Description under 1024 chars, no XML tags
- [ ] Headers use consistent Markdown formatting
- [ ] Code blocks properly fenced with language tags
- [ ] Links to reference files use relative paths

## Output Format

Provide the complete SKILL.md file with:

1. **Valid YAML frontmatter** (name and description)
2. **Structured body** following the template above
3. **Appropriate sections** based on complexity
4. **Best practices applied** throughout
5. **Validation confirmation** showing checklist results

If the skill requires additional files (reference docs, scripts), indicate what should be created and provide outlines.

## Quality Principles

**Write for Claude, not humans**: Assume high intelligence. Skip explanations of common concepts.

**Be specific**: "Use pdfplumber" beats "Use a PDF library"

**Show, don't tell**: Provide concrete examples, not abstract descriptions

**Think token efficiency**: Every token competes for context. Justify each one.

**Test mentally**: Would this work for Haiku? Sonnet? Opus? Adjust accordingly.

## Common Mistakes to Avoid

- Writing in first person ("I can help") instead of third person
- Including outdated version numbers or dates
- Explaining concepts Claude already knows
- Offering too many alternative approaches
- Using Windows paths with backslashes
- Nesting file references more than one level deep
- Exceeding 500 lines in SKILL.md without splitting
- Forgetting to include trigger keywords in description
- Missing validation steps for fragile operations
- Using inconsistent terminology

## Next Steps After Creation

1. **Test with evaluations**: Create 3+ test cases that cover main use cases
2. **Iterate with Claude**: Use one instance to refine, another to test
3. **Observe usage**: Watch how Claude navigates the skill in practice
4. **Gather feedback**: Share with team members if applicable
5. **Refine based on behavior**: Improve based on observed usage patterns

---

Remember: Skills are tools for agents. Write concisely, structure clearly, and test thoroughly.
