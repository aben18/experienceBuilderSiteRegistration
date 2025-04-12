import { LightningElement } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/RegistrationController.getAccountByContactEmail";
import getAccountByName from "@salesforce/apex/RegistrationController.getAccountByName";
import submitRegistration from "@salesforce/apex/RegistrationController.submitRegistration";

export default class RegistrationForm extends LightningElement {
  firstName = "";
  lastName = "";
  email = "";
  organizationId = "";
  organizationName = "";
  organizationSearched = false;
  organizationFound = false;
  newOrganizationName = "";
  enterNewOrganization = false;
  organizationSearchResults = [];

  handleChange(event) {
    const field = event.target.name;
    this[field] = event.target.value;

    if (field === "email") {
      this.organizationId = "";
      this.organizationName = "";
      this.organizationSearched = false;
      this.organizationFound = false;
      this.enterNewOrganization = false;
    }

    if (field === "changeOrganization") {
      this.enterNewOrganization = event.target.checked;
    }
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

      if (result) {
        this.organizationId = result.Id;
        this.organizationName = result.Name;
        this.organizationSearched = true;
        this.organizationFound = true;
      } else {
        this.organizationSearched = true;
        this.organizationFound = false;
      }
    } catch (error) {
      console.error("Contact match error:", error);
    }
  }

  get organizationSearchedFound() {
    return this.organizationSearched && this.organizationFound;
  }

  get organizationSearchedNotFound() {
    return this.organizationSearched && !this.organizationFound;
  }

  get showNewOrganizationField() {
    const shouldShow = this.organizationNotFound || this.enterNewOrganization;
    if (!shouldShow) {
      this.newOrganizationName = "";
      this.organizationSearchResults = [];
    }
    return shouldShow;
  }

  get isSignUpDisabled() {
    return !this.organizationId && !this.newOrganizationName;
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
        accountName: this.newOrganizationName || this.organizationName
      });

      console.log("Registration success:", result);
    } catch (error) {
      console.error("Submit error:", error);
    }
  }
}
