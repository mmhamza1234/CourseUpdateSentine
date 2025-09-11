import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "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"
});

export interface ChangeSummary {
  summary: string;
  change_type: "capability" | "ui" | "policy" | "pricing" | "api" | "deprecation";
  entities: string[];
  risks: string[];
  summary_ar: string;
}

export interface ImpactAssessment {
  asset_id: string;
  predicted_action: "FACE_RESHOOT" | "SCREEN_REDO" | "SLIDES_EDIT" | "POLICY_NOTE";
  severity: "SEV1" | "SEV2" | "SEV3";
  confidence: number;
  reasons: string[];
}

export interface TaskBundle {
  tasks: {
    action: string;
    title: string;
    description: string;
    owner: "HAMADA" | "EMAN" | "EDITOR";
    due_date: string;
    estimated_hours: number;
  }[];
}

export interface PatchScript {
  outline: string;
  steps: string[];
  duration_estimate: string;
  key_points: string[];
}

export async function summarizeChange(rawContent: string, vendor: string): Promise<ChangeSummary> {
  try {
    const prompt = `Analyze this AI tool update from ${vendor} and provide a structured summary.

Raw content:
${rawContent}

Respond with JSON in this exact format:
{
  "summary": "concise English summary of the change",
  "change_type": "capability|ui|policy|pricing|api|deprecation",
  "entities": ["list", "of", "affected", "features"],
  "risks": ["potential", "risks", "for", "course", "content"],
  "summary_ar": "Arabic translation of the summary"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert AI tool analyst specializing in educational content impact assessment. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as ChangeSummary;
  } catch (error) {
    throw new Error(`Failed to summarize change: ${error.message}`);
  }
}

export async function classifyImpacts(
  changeSummary: ChangeSummary,
  assets: Array<{
    id: string;
    moduleCode: string;
    assetType: string;
    toolDependency: string;
    sensitivity: string;
    triggerTags: string[];
  }>,
  decisionRules: Array<{
    pattern: string;
    action: string;
    severity: string;
    modules: string[];
  }>
): Promise<ImpactAssessment[]> {
  try {
    const prompt = `Classify the impact of this AI tool change on course assets.

Change Summary:
${JSON.stringify(changeSummary, null, 2)}

Course Assets:
${JSON.stringify(assets, null, 2)}

Decision Rules:
${JSON.stringify(decisionRules, null, 2)}

Heuristics:
- Core feature rename or reordered steps → SCREEN_REDO; if name spoken on camera/marketing → also FACE_RESHOOT
- New mandatory safety/policy → POLICY_NOTE (SEV1 if blocking)
- Cosmetic UI → SLIDES_EDIT (SEV3) unless demo breaks
- New recommended capability → SCREEN_REDO (SEV2)
- Connector deprecated (M2/M3/M4) → SCREEN_REDO (SEV1)
- Reader/Research limits change → SLIDES_EDIT (SEV2) + worksheet tweak
- Free tier/pricing change → POLICY_NOTE (SEV2)

Respond with JSON array of impacts:
{
  "impacts": [
    {
      "asset_id": "asset_uuid",
      "predicted_action": "FACE_RESHOOT|SCREEN_REDO|SLIDES_EDIT|POLICY_NOTE",
      "severity": "SEV1|SEV2|SEV3",
      "confidence": 0.95,
      "reasons": ["explanation", "of", "impact"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert course maintenance classifier. Analyze tool changes and predict their impact on educational assets. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.impacts as ImpactAssessment[];
  } catch (error) {
    throw new Error(`Failed to classify impacts: ${error.message}`);
  }
}

export async function generateTaskBundle(
  impacts: ImpactAssessment[],
  slaConfig: Record<string, number>
): Promise<TaskBundle> {
  try {
    const prompt = `Generate concrete tasks for these course content impacts.

Impacts:
${JSON.stringify(impacts, null, 2)}

SLA Configuration (severity: hours):
${JSON.stringify(slaConfig, null, 2)}

Timezone: Africa/Cairo

Task owners:
- HAMADA: Face recordings, camera work
- EMAN: Screen recordings, demo videos  
- EDITOR: Slides, worksheets, policy notes

Respond with JSON:
{
  "tasks": [
    {
      "action": "FACE_RESHOOT",
      "title": "specific task title",
      "description": "detailed description of what needs to be done",
      "owner": "HAMADA|EMAN|EDITOR",
      "due_date": "2024-11-28T15:30:00+02:00",
      "estimated_hours": 4
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a project manager for course content updates. Generate specific, actionable tasks with realistic timelines. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as TaskBundle;
  } catch (error) {
    throw new Error(`Failed to generate task bundle: ${error.message}`);
  }
}

export async function generatePatchScript(
  taskDescription: string,
  actionType: string
): Promise<PatchScript> {
  try {
    const prompt = `Create a ≤90 second patch script outline for this course update task.

Task: ${taskDescription}
Action Type: ${actionType}

For FACE_RESHOOT tasks, focus on spoken content updates.
For SCREEN_REDO tasks, focus on click-through demonstrations.

Respond with JSON:
{
  "outline": "brief overview of the patch",
  "steps": ["step 1", "step 2", "step 3"],
  "duration_estimate": "60-90 seconds",
  "key_points": ["critical", "talking", "points"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a video production specialist for course content. Create concise, actionable scripts. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as PatchScript;
  } catch (error) {
    throw new Error(`Failed to generate patch script: ${error.message}`);
  }
}
