import { LightningElement, api } from "lwc";

export default class CommunityHeaderNav extends LightningElement {
  @api orgLink = "https://www.ed-fi.org/";
  @api docsLink = "https://docs.ed-fi.org/";
  @api communityLink = "https://www.ed-fi.org/community/";
  @api academyLink = "https://www.ed-fi.org/academy/";

  @api githubLink = "https://github.com/Ed-Fi-Alliance-OSS";
  @api xLink = "https://x.com/EdFiAlliance";
  @api linkedinLink = "https://www.linkedin.com/company/ed-fi-alliance/";

  // Icons should be static resources or external URLs. Accept either.
  @api githubIcon = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg";
  @api xIcon = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg";
  @api linkedinIcon = "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg";
}


