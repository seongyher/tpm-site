export type {
  AuthorDiagnostic,
  AuthorDiagnosticCategory,
  AuthorDiagnosticCode,
  AuthorDiagnosticInput,
  AuthorDiagnosticRepairOwner,
  AuthorDiagnosticReport,
} from "../lib/diagnostics/author-diagnostics";
export {
  authorDiagnosticCategories,
  authorDiagnosticFixabilities,
  authorDiagnosticFromOutputDiagnostic,
  authorDiagnosticRepairOwners,
  authorDiagnosticSources,
  createAuthorDiagnostic,
  createAuthorDiagnosticReport,
} from "../lib/diagnostics/author-diagnostics";
export type {
  OutputDiagnostic,
  OutputDiagnosticCategory,
  OutputDiagnosticCode,
  OutputDiagnosticInput,
  OutputDiagnosticOwner,
  OutputVerificationReport,
  OutputVerifierContext,
  OutputVerifierModule,
} from "../lib/diagnostics/output-verification";
export {
  createOutputDiagnostic,
  createOutputVerificationReport,
  formatOutputDiagnostic,
  hasBlockingOutputDiagnostics,
  outputDiagnosticIdentity,
  runOutputVerifierModules,
} from "../lib/diagnostics/output-verification";
