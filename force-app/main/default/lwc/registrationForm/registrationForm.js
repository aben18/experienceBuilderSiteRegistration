import { LightningElement, track } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/SelfRegisterWithAccountController.getAccountByContactEmail";
import submitRegistration from "@salesforce/apex/SelfRegisterWithAccountController.submitRegistration";
import RegistrationFormOrganizationModal from "c/registrationFormOrganizationModal";

export default class RegistrationForm extends LightningElement {
  // Track is required to make nested properties reactive
  @track contact = {
    firstName: "",
    lastName: "",
    email: "",
    accountId: ""
  };

  handleChange(event) {
    const field = event.target.name;
    this.contact[field] = event.target.value;
    if (field === "email") {
      this.organizationSearchComplete = false;
    }
    if (field === "accountId") {
      this.contact.accountId = event.detail.recordId;
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

  handleOrganizationFocus() {
    if (!this.organizationSearchComplete) {
      this.getOrganizationByContactEmail();
      this.organizationSearchComplete = true;
    }
  }

  async getOrganizationByContactEmail() {
    if (!this.validateInputs()) {
      return;
    }

    try {
      const result = await getAccountByContactEmail({
        email: this.contact.email
      });
      if (result) {
        this.contact.accountId = result.Id;
      }
    } catch (error) {
      console.error("Contact match error:", error);
    }
  }

  async handleCreateNewOrganization() {
    const result = await RegistrationFormOrganizationModal.open({
      description: "Create a new organization",
      size: "small"
    });
    if (result) {
      this.contact.accountId = result;
    }
  }

  get isSignUpDisabled() {
    return (
      !this.contact.lastName || !this.contact.email || !this.contact.accountId
    );
  }

  async handleSubmit() {
    if (!this.validateInputs()) {
      return;
    }

    try {
      await submitRegistration(this.contact);
    } catch (error) {
      console.error("Submit error:", error);
    }
    this.handleRegistrationConfirmationRedirect();
  }

  handleRegistrationConfirmationRedirect() {
    const registrationConfirmationUrl = "/CheckPasswordResetEmail";
    window.location.href = registrationConfirmationUrl;
  }

  handleLoginRedirect() {
    const loginUrl = "/login";
    window.location.href = loginUrl;
  }
}
