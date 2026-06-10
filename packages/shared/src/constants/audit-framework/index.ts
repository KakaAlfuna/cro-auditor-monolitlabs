import { CIALDINI_AUDIT_RULES } from "./cialdini";
import { KRUG_AUDIT_RULES } from "./krug";

const FRAMEWORK_HEADER = `# CONVERSION RATE OPTIMIZATION & UX AUDIT FRAMEWORK`;

export { CIALDINI_AUDIT_RULES } from "./cialdini";
export { KRUG_AUDIT_RULES } from "./krug";

export const CRO_AUDIT_RULES = `${FRAMEWORK_HEADER}

${KRUG_AUDIT_RULES}

${CIALDINI_AUDIT_RULES}`;
