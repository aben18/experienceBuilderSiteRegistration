import { LightningElement, track } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/SelfRegisterWithAccountController.getAccountByContactEmail";
import submitRegistration from "@salesforce/apex/SelfRegisterWithAccountController.submitRegistration";
import SelfRegisterWithAccountModal from "c/selfRegisterWithAccountModal";

export default class SelfRegisterWithAccount extends LightningElement {
  // Track is required to make nested properties reactive
  @track contact = {
    firstName: "",
    lastName: "",
    email: "",
    accountId: ""
  };
  @track accountSearchComplete = false;
  submitError = "";

  handleChange(event) {
    const field = event.target.name;
    this.contact[field] = event.target.value;
    if (field === "email") {
      this.accountSearchComplete = false;
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

  handleAccountFocus() {
    if (!this.accountSearchComplete) {
      this.getAccountByContactEmail();
      this.accountSearchComplete = true;
    }
  }

  async getAccountByContactEmail() {
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

  async handleCreateNewAccount() {
    const result = await SelfRegisterWithAccountModal.open({
      description: "Create a new account",
      size: "small"
    });
    if (result) {
      this.contact.accountId = result;
    }
  }

  get isCreateNewAccountDisabled() {
    return this.contact.accountId || !this.accountSearchComplete;
  }

  async handleSubmit() {
    if (!this.validateInputs()) {
      return;
    }

    try {
      console.log("Submitting registration:", this.contact.email);
      await submitRegistration(this.contact);
      this.submitError = "";
      this.handleRegistrationConfirmationRedirect();
    } catch (error) {
      console.error("Submit error:", error);
      this.submitError = error.body.message
        ? error.body.message
        : "An unexpected error occurred. Please try again.";
    }
  }

  get isSubmitDisabled() {
    return (
      !this.contact.lastName || !this.contact.email || !this.contact.accountId
    );
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
