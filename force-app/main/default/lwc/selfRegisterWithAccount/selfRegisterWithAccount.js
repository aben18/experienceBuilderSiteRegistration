import { LightningElement, track, api } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/SelfRegisterWithAccountController.getAccountByContactEmail";
import submitRegistration from "@salesforce/apex/SelfRegisterWithAccountController.submitRegistration";
import SelfRegisterWithAccountModal from "c/selfRegisterWithAccountModal";

export default class SelfRegisterWithAccount extends LightningElement {
  @api firstNameLabel = "First Name";
  @api lastNameLabel = "Last Name";
  @api emailLabel = "Email";
  @api accountLabel = "Account";
  @api createAccountMessage = "Can't find your account?";
  @api createAccountButtonLabel = "Create new.";
  @api createAccountHeaderLabel = "Create an Account";
  @api submitButtonLabel = "Sign Up";
  @api cancelLinkLabel = "Already have a login?";
  @api registrationConfirmationUrl = "./CheckPasswordResetEmail";

  @track contact = {
    FirstName: "",
    LastName: "",
    Email: "",
    AccountId: ""
  };
  @track accountSearchComplete = false;
  @track submitError = "";

  get accountSearchPlaceholder() {
    return `Search ${this.accountLabel}...`;
  }

  handleChange(event) {
    const field = event.target.name;
    if (field) {
      this.contact[field] = event.target.value;
      if (field === "Email") {
        this.accountSearchComplete = false;
      }
    } else if (
      event.target.tagName === "LIGHTNING-RECORD-PICKER" &&
      event.target.objectApiName === "Account"
    ) {
      this.contact.AccountId = event.detail.recordId;
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
        email: this.contact.Email
      });
      if (result) {
        this.contact.AccountId = result.Id;
      }
    } catch (error) {
      console.error("Contact match error:", error);
    }
  }

  async handleCreateNewAccount() {
    const result = await SelfRegisterWithAccountModal.open({
      heading: this.createAccountHeaderLabel,
      description: `Create a new ${this.accountLabel.toLowerCase()}`,
      size: "small"
    });
    if (result) {
      this.contact.AccountId = result;
    }
  }

  get isCreateNewAccountDisabled() {
    return (
      !this.contact.LastName ||
      !this.contact.Email ||
      !!this.contact.AccountId ||
      !this.accountSearchComplete
    );
  }

  async handleSubmit() {
    if (!this.validateInputs()) {
      return;
    }

    try {
      this.submitError = "";
      await submitRegistration({ contact: this.contact });
      this.handleRegistrationConfirmationRedirect();
    } catch (error) {
      this.submitError = error.body.message
        ? error.body.message
        : "An unexpected error occurred. Please try again.";
    }
  }

  get isSubmitDisabled() {
    return (
      !this.contact.LastName || !this.contact.Email || !this.contact.AccountId
    );
  }

  handleRegistrationConfirmationRedirect() {
    const registrationConfirmationUrl = this.registrationConfirmationUrl;
    window.location.href = registrationConfirmationUrl;
  }

  handleCancelRedirect() {
    const cancelUrl = "./login";
    window.location.href = cancelUrl;
  }
}
