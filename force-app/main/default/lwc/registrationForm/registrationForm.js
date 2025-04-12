import { LightningElement, track } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/RegistrationController.getAccountByContactEmail";
import getAccountByName from "@salesforce/apex/RegistrationController.getAccountByName";
import submitRegistration from "@salesforce/apex/RegistrationController.submitRegistration";

export default class RegistrationForm extends LightningElement {
  @track firstName = "";
  @track lastName = "";
  @track email = "";
  @track matchedOrganization = "";
  @track isOrganizationNotFound = false;
  @track newOrganizationName = "";
  @track enterNewOrganization = false;
  @track organizationSearchResults = [];

  handleInput(event) {
    this[event.target.name] = event.target.value;

    if (event.target.name === "email") {
      this.matchedOrganization = "";
      this.isOrganizationNotFound = false;
      this.enterNewOrganization = false;
    }
  }

  handleNewOrganizationCheckboxChange(event) {
    this.enterNewOrganization = event.target.checked;
  }

  get isOrganizationCheckDisabled() {
    return !this.email;
  }

  get showNewOrganizationField() {
    const shouldShow = this.isOrganizationNotFound || this.enterNewOrganization;
    if (!shouldShow) {
      this.newOrganizationName = "";
      this.organizationSearchResults = [];
    }
    return shouldShow;
  }

  get isSignUpDisabled() {
    return (
      this.isOrganizationCheckDisabled ||
      (!this.matchedOrganization && !this.newOrganizationName)
    );
  }

  validateInputs() {
    const allInputs = this.template.querySelectorAll("lightning-input");
    let allValid = true;

    allInputs.forEach((input) => {
      if (!input.reportValidity()) {
        allValid = false;
      }
    });

    return allValid;
  }

  async getOrganizationByContactEmail() {
    if (!this.validateInputs()) {
      return;
    }

    try {
      const result = await getAccountByContactEmail({
        email: this.email
      });

      if (result && result.organizationName) {
        this.matchedOrganization = result.organizationName;
      } else {
        this.matchedOrganization = "";
        this.isOrganizationNotFound = true;
      }
    } catch (error) {
      console.error("Contact match error:", error);
    }
  }

  async handleOrganizationSearch(event) {
    const searchTerm = event.target.value;
    this.newOrganizationName = searchTerm;

    if (searchTerm.length < 2) {
      this.organizationSearchResults = [];
      return;
    }

    try {
      const results = await getAccountByName({ name: searchTerm });
      this.organizationSearchResults = results;
    } catch (error) {
      console.error("Error searching for organizations:", error);
      this.organizationSearchResults = [];
    }
  }

  handleOrganizationSelect(event) {
    const selectedOrganizationName = event.currentTarget.dataset.name;

    this.newOrganizationName = selectedOrganizationName; // Updated variable name
    this.organizationSearchResults = []; // Clear the dropdown after selection
  }

  async handleSubmit() {
    if (!this.validateInputs()) {
      return;
    }

    try {
      const result = await submitRegistration({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        accountName: this.newOrganizationName || this.matchedOrganization
      });

      console.log("Registration success:", result);
    } catch (error) {
      console.error("Submit error:", error);
    }
  }
}
