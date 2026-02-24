/** Organization/workspace-level roles. ORG_ADMIN manages the org (update/delete org, members). PROJECT_MANAGER manages projects. */
export enum OrgRole {
  ORG_ADMIN = "org_admin",
  DEVELOPER = "developer",
  PROJECT_MANAGER = "project_manager",
  QUALITY_ASSURANCE_ENGINEER = "quality_assurance_engineer",
  SEO_SPECIALIST = "seo_specialist",
  BUSINESS_DEVELOPER = "business_developer",
}
