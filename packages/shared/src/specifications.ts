/**
 * Specification templates for each listing category.
 * These structured specifications help AI agents make better decisions
 * when searching for and requesting services.
 */

export type SpecificationType = "text" | "number" | "select" | "multiselect" | "boolean";

export interface SpecificationField {
  key: string;
  label: string;
  type: SpecificationType;
  required: boolean;
  description: string;
  options?: string[]; // For select/multiselect
  unit?: string; // For number fields (e.g., "words", "pages", "hours")
  placeholder?: string;
}

// Writing specifications
export const WRITING_SPECS: SpecificationField[] = [
  {
    key: "contentType",
    label: "Content Type",
    type: "select",
    required: true,
    description: "Type of writing content needed",
    options: ["Blog Post", "Article", "Product Description", "White Paper", "Case Study", "Technical Documentation", "Social Media", "Email Copy", "Other"],
  },
  {
    key: "wordCount",
    label: "Word Count",
    type: "number",
    required: true,
    description: "Approximate number of words",
    unit: "words",
    placeholder: "1000",
  },
  {
    key: "tone",
    label: "Tone",
    type: "select",
    required: true,
    description: "Desired tone of the content",
    options: ["Professional", "Casual", "Technical", "Friendly", "Formal", "Conversational"],
  },
  {
    key: "industry",
    label: "Industry/Niche",
    type: "text",
    required: false,
    description: "Target industry or niche (e.g., 'SaaS', 'Healthcare', 'Finance')",
    placeholder: "e.g., SaaS, Healthcare",
  },
  {
    key: "seoKeywords",
    label: "SEO Keywords",
    type: "text",
    required: false,
    description: "Target keywords for SEO optimization (comma-separated)",
    placeholder: "keyword1, keyword2, keyword3",
  },
  {
    key: "revisions",
    label: "Number of Revisions",
    type: "number",
    required: true,
    description: "How many rounds of revisions are included",
    placeholder: "2",
  },
  {
    key: "turnaroundDays",
    label: "Turnaround Time",
    type: "number",
    required: true,
    description: "Expected delivery time in business days",
    unit: "days",
    placeholder: "5",
  },
];

// Design specifications
export const DESIGN_SPECS: SpecificationField[] = [
  {
    key: "designType",
    label: "Design Type",
    type: "select",
    required: true,
    description: "Type of design work",
    options: ["Logo", "Brand Identity", "Website UI/UX", "Mobile App UI", "Illustration", "Infographic", "Social Media Graphics", "Print Design", "Other"],
  },
  {
    key: "style",
    label: "Design Style",
    type: "select",
    required: true,
    description: "Preferred design style",
    options: ["Modern", "Minimalist", "Vintage", "Corporate", "Creative", "Playful", "Elegant", "Bold"],
  },
  {
    key: "colorScheme",
    label: "Color Preferences",
    type: "text",
    required: false,
    description: "Preferred colors or color codes (comma-separated)",
    placeholder: "#1E40AF, blue, white",
  },
  {
    key: "dimensions",
    label: "Dimensions/Size",
    type: "text",
    required: false,
    description: "Specific dimensions if applicable (e.g., '1920x1080px', '8.5x11in')",
    placeholder: "1920x1080px",
  },
  {
    key: "fileFormats",
    label: "File Formats",
    type: "multiselect",
    required: true,
    description: "Required file formats for final deliverables",
    options: ["PNG", "JPG", "SVG", "PDF", "AI", "PSD", "FIGMA", "SKETCH", "XD"],
  },
  {
    key: "revisions",
    label: "Number of Revisions",
    type: "number",
    required: true,
    description: "How many rounds of revisions are included",
    placeholder: "3",
  },
  {
    key: "conceptVariations",
    label: "Initial Concept Variations",
    type: "number",
    required: false,
    description: "Number of different initial concepts to choose from",
    placeholder: "3",
  },
  {
    key: "turnaroundDays",
    label: "Turnaround Time",
    type: "number",
    required: true,
    description: "Expected delivery time in business days",
    unit: "days",
    placeholder: "7",
  },
];

// Development specifications
export const DEVELOPMENT_SPECS: SpecificationField[] = [
  {
    key: "projectType",
    label: "Project Type",
    type: "select",
    required: true,
    description: "Type of development project",
    options: ["Website", "Web Application", "Mobile App", "API Development", "Chrome Extension", "WordPress Plugin", "Automation Script", "Bug Fix", "Feature Addition", "Other"],
  },
  {
    key: "techStack",
    label: "Technology Stack",
    type: "multiselect",
    required: false,
    description: "Preferred or required technologies",
    options: ["React", "Next.js", "Vue", "Angular", "Node.js", "Python", "Django", "FastAPI", "Ruby on Rails", "PHP", "Laravel", "PostgreSQL", "MySQL", "MongoDB", "TypeScript", "JavaScript"],
  },
  {
    key: "complexity",
    label: "Complexity Level",
    type: "select",
    required: true,
    description: "Project complexity",
    options: ["Simple", "Medium", "Complex", "Enterprise"],
  },
  {
    key: "features",
    label: "Key Features",
    type: "text",
    required: true,
    description: "List of key features or requirements (one per line or comma-separated)",
    placeholder: "User authentication, Dashboard, API integration",
  },
  {
    key: "deployment",
    label: "Deployment Platform",
    type: "select",
    required: false,
    description: "Where the project will be deployed",
    options: ["Vercel", "Netlify", "AWS", "Google Cloud", "Azure", "DigitalOcean", "Heroku", "Self-hosted", "Not Applicable"],
  },
  {
    key: "responsive",
    label: "Responsive Design Required",
    type: "boolean",
    required: false,
    description: "Must work on mobile, tablet, and desktop",
  },
  {
    key: "testing",
    label: "Testing Requirements",
    type: "multiselect",
    required: false,
    description: "Required testing types",
    options: ["Unit Tests", "Integration Tests", "E2E Tests", "Manual QA", "None"],
  },
  {
    key: "documentation",
    label: "Documentation Required",
    type: "boolean",
    required: false,
    description: "Include code documentation and setup guide",
  },
  {
    key: "turnaroundDays",
    label: "Turnaround Time",
    type: "number",
    required: true,
    description: "Expected delivery time in business days",
    unit: "days",
    placeholder: "14",
  },
];

// Marketing specifications
export const MARKETING_SPECS: SpecificationField[] = [
  {
    key: "serviceType",
    label: "Marketing Service",
    type: "select",
    required: true,
    description: "Type of marketing service needed",
    options: ["SEO Optimization", "Social Media Management", "Email Campaign", "Content Marketing", "PPC Campaign", "Market Research", "Brand Strategy", "Influencer Outreach", "Other"],
  },
  {
    key: "targetAudience",
    label: "Target Audience",
    type: "text",
    required: true,
    description: "Description of target audience demographics and characteristics",
    placeholder: "e.g., B2B SaaS companies, age 25-45, tech-savvy",
  },
  {
    key: "platforms",
    label: "Platforms",
    type: "multiselect",
    required: false,
    description: "Marketing platforms to use",
    options: ["Facebook", "Instagram", "Twitter", "LinkedIn", "TikTok", "Google Ads", "Email", "Blog", "YouTube"],
  },
  {
    key: "goals",
    label: "Campaign Goals",
    type: "text",
    required: true,
    description: "Specific measurable goals (e.g., '1000 new followers', '5% conversion rate')",
    placeholder: "Increase website traffic by 30%",
  },
  {
    key: "budget",
    label: "Campaign Budget",
    type: "number",
    required: false,
    description: "Budget for ads/promotions (separate from service fee)",
    unit: "USD",
    placeholder: "500",
  },
  {
    key: "duration",
    label: "Campaign Duration",
    type: "number",
    required: false,
    description: "How long the campaign will run",
    unit: "days",
    placeholder: "30",
  },
];

// Data Entry specifications
export const DATA_ENTRY_SPECS: SpecificationField[] = [
  {
    key: "dataType",
    label: "Data Type",
    type: "select",
    required: true,
    description: "Type of data to be entered",
    options: ["Text Data", "Numerical Data", "Contact Information", "Product Listings", "Survey Responses", "Form Entries", "Image Tagging", "Other"],
  },
  {
    key: "volume",
    label: "Data Volume",
    type: "number",
    required: true,
    description: "Approximate number of records/entries",
    unit: "records",
    placeholder: "1000",
  },
  {
    key: "sourceFormat",
    label: "Source Format",
    type: "multiselect",
    required: true,
    description: "Format of source data",
    options: ["PDF", "Image/Scan", "Handwritten", "Email", "Web Forms", "CSV", "Excel", "Other"],
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "multiselect",
    required: true,
    description: "Desired output format",
    options: ["Excel", "CSV", "Google Sheets", "Database Entry", "CRM System", "JSON", "Other"],
  },
  {
    key: "accuracyRequirement",
    label: "Accuracy Requirement",
    type: "select",
    required: true,
    description: "Required accuracy level",
    options: ["95% Accuracy", "98% Accuracy", "99%+ Accuracy", "100% Accuracy (Double-Checked)"],
  },
  {
    key: "turnaroundDays",
    label: "Turnaround Time",
    type: "number",
    required: true,
    description: "Expected delivery time in business days",
    unit: "days",
    placeholder: "3",
  },
];

// Research specifications
export const RESEARCH_SPECS: SpecificationField[] = [
  {
    key: "researchType",
    label: "Research Type",
    type: "select",
    required: true,
    description: "Type of research needed",
    options: ["Market Research", "Competitor Analysis", "Academic Research", "Industry Analysis", "User Research", "Product Research", "Fact Checking", "Data Collection", "Other"],
  },
  {
    key: "topic",
    label: "Research Topic",
    type: "text",
    required: true,
    description: "Specific topic or question to research",
    placeholder: "e.g., AI automation tools market trends 2024-2025",
  },
  {
    key: "depth",
    label: "Research Depth",
    type: "select",
    required: true,
    description: "How in-depth should the research be",
    options: ["Overview/Summary", "Detailed Analysis", "Comprehensive Report", "Academic/Scholarly"],
  },
  {
    key: "sources",
    label: "Required Sources",
    type: "multiselect",
    required: false,
    description: "Types of sources to include",
    options: ["Industry Reports", "Academic Papers", "News Articles", "Surveys", "Interviews", "Government Data", "Company Filings", "Social Media"],
  },
  {
    key: "deliverableFormat",
    label: "Deliverable Format",
    type: "select",
    required: true,
    description: "How should the research be delivered",
    options: ["Written Report", "Presentation Slides", "Spreadsheet/Data", "Executive Summary", "Annotated Bibliography"],
  },
  {
    key: "pageCount",
    label: "Expected Length",
    type: "number",
    required: false,
    description: "Approximate page count or word count",
    unit: "pages",
    placeholder: "10",
  },
  {
    key: "turnaroundDays",
    label: "Turnaround Time",
    type: "number",
    required: true,
    description: "Expected delivery time in business days",
    unit: "days",
    placeholder: "7",
  },
];

// Translation specifications
export const TRANSLATION_SPECS: SpecificationField[] = [
  {
    key: "sourceLanguage",
    label: "Source Language",
    type: "text",
    required: true,
    description: "Language to translate from",
    placeholder: "English",
  },
  {
    key: "targetLanguage",
    label: "Target Language",
    type: "text",
    required: true,
    description: "Language to translate to",
    placeholder: "Spanish",
  },
  {
    key: "contentType",
    label: "Content Type",
    type: "select",
    required: true,
    description: "Type of content being translated",
    options: ["Website", "Document", "App/Software", "Marketing Material", "Legal Document", "Technical Manual", "Subtitles", "Book/eBook", "Other"],
  },
  {
    key: "wordCount",
    label: "Word Count",
    type: "number",
    required: true,
    description: "Approximate number of words to translate",
    unit: "words",
    placeholder: "1000",
  },
  {
    key: "specialization",
    label: "Specialization",
    type: "select",
    required: false,
    description: "Does the content require specialized knowledge",
    options: ["General", "Medical", "Legal", "Technical", "Marketing", "Financial", "Scientific"],
  },
  {
    key: "certifiedTranslation",
    label: "Certified Translation Required",
    type: "boolean",
    required: false,
    description: "Is official certification needed (e.g., for legal documents)",
  },
  {
    key: "proofreading",
    label: "Proofreading Included",
    type: "boolean",
    required: false,
    description: "Should a second translator proofread the work",
  },
  {
    key: "turnaroundDays",
    label: "Turnaround Time",
    type: "number",
    required: true,
    description: "Expected delivery time in business days",
    unit: "days",
    placeholder: "3",
  },
];

// Consulting specifications
export const CONSULTING_SPECS: SpecificationField[] = [
  {
    key: "consultingType",
    label: "Consulting Type",
    type: "select",
    required: true,
    description: "Type of consulting needed",
    options: ["Business Strategy", "Technology Consulting", "Marketing Strategy", "Financial Consulting", "HR Consulting", "Legal Consulting", "Operations", "Product Strategy", "Other"],
  },
  {
    key: "deliveryFormat",
    label: "Delivery Format",
    type: "multiselect",
    required: true,
    description: "How consulting will be delivered",
    options: ["Written Report", "Video Calls", "Phone Calls", "In-Person Meetings", "Presentation", "Workshop/Training"],
  },
  {
    key: "sessionCount",
    label: "Number of Sessions",
    type: "number",
    required: false,
    description: "How many consulting sessions are included",
    placeholder: "3",
  },
  {
    key: "hourlyRate",
    label: "Hourly or Fixed",
    type: "select",
    required: true,
    description: "Pricing structure",
    options: ["Hourly Rate", "Fixed Project Fee", "Retainer"],
  },
  {
    key: "expertise",
    label: "Required Expertise",
    type: "text",
    required: true,
    description: "Specific expertise or certifications needed",
    placeholder: "e.g., MBA, 10+ years in SaaS, CPA certified",
  },
  {
    key: "urgency",
    label: "Urgency Level",
    type: "select",
    required: true,
    description: "How quickly do you need to start",
    options: ["Immediate (1-2 days)", "This Week", "Within 2 Weeks", "Flexible"],
  },
];

// Support/VA specifications
export const SUPPORT_SPECS: SpecificationField[] = [
  {
    key: "supportType",
    label: "Support Type",
    type: "select",
    required: true,
    description: "Type of support or VA work needed",
    options: ["Customer Support", "Email Management", "Calendar Management", "Admin Tasks", "Social Media Management", "Community Management", "Technical Support", "Live Chat", "Other"],
  },
  {
    key: "hoursPerWeek",
    label: "Hours Per Week",
    type: "number",
    required: true,
    description: "Expected hours per week",
    unit: "hours/week",
    placeholder: "20",
  },
  {
    key: "timezone",
    label: "Timezone Requirements",
    type: "text",
    required: false,
    description: "Preferred timezone or working hours",
    placeholder: "EST, 9am-5pm",
  },
  {
    key: "tools",
    label: "Tools/Software",
    type: "text",
    required: false,
    description: "Required tools or software experience",
    placeholder: "Zendesk, Slack, Gmail, Asana",
  },
  {
    key: "languages",
    label: "Language Requirements",
    type: "text",
    required: false,
    description: "Languages the VA must speak",
    placeholder: "English (native), Spanish (conversational)",
  },
  {
    key: "duration",
    label: "Engagement Duration",
    type: "select",
    required: true,
    description: "How long will you need support",
    options: ["One-Time Task", "1 Week", "1 Month", "3 Months", "6 Months", "12+ Months (Ongoing)"],
  },
];

// Other/General specifications
export const OTHER_SPECS: SpecificationField[] = [
  {
    key: "serviceDescription",
    label: "Service Description",
    type: "text",
    required: true,
    description: "Describe the service you're offering",
    placeholder: "Detailed description of what you'll deliver",
  },
  {
    key: "deliverables",
    label: "Deliverables",
    type: "text",
    required: true,
    description: "What will the client receive upon completion",
    placeholder: "List of deliverables",
  },
  {
    key: "requirements",
    label: "Client Requirements",
    type: "text",
    required: false,
    description: "What information or materials do you need from the client",
    placeholder: "e.g., brand guidelines, access credentials",
  },
  {
    key: "turnaroundDays",
    label: "Turnaround Time",
    type: "number",
    required: true,
    description: "Expected delivery time in business days",
    unit: "days",
    placeholder: "7",
  },
];

// Map categories to their specification templates
export const CATEGORY_SPECIFICATIONS: Record<string, SpecificationField[]> = {
  WRITING: WRITING_SPECS,
  DESIGN: DESIGN_SPECS,
  DEVELOPMENT: DEVELOPMENT_SPECS,
  MARKETING: MARKETING_SPECS,
  DATA_ENTRY: DATA_ENTRY_SPECS,
  RESEARCH: RESEARCH_SPECS,
  TRANSLATION: TRANSLATION_SPECS,
  CONSULTING: CONSULTING_SPECS,
  SUPPORT: SUPPORT_SPECS,
  OTHER: OTHER_SPECS,
};

/**
 * Get specification template for a category
 */
export function getSpecificationTemplate(category: string): SpecificationField[] {
  return CATEGORY_SPECIFICATIONS[category] || OTHER_SPECS;
}

/**
 * Validate specifications against template
 */
export function validateSpecifications(
  category: string,
  specifications: Record<string, any>
): { valid: boolean; errors: string[] } {
  const template = getSpecificationTemplate(category);
  const errors: string[] = [];

  for (const field of template) {
    if (field.required && !specifications[field.key]) {
      errors.push(`${field.label} is required`);
    }
  }

  return { valid: errors.length === 0, errors };
}
