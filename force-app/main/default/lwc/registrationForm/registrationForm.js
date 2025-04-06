import { LightningElement, track } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/RegistrationController.getAccountByContactEmail";
import submitRegistration from "@salesforce/apex/RegistrationController.submitRegistration";

export default class RegistrationForm extends LightningElement {
  @track firstName = "";
  @track lastName = "";
  @track email = "";
  @track matchedAccount = "";
  @track accountNotFound = false;
  @track newAccountName = "";

  handleInput(event) {
    this[event.target.name] = event.target.value;

    if (event.target.name === "email") {
      this.matchedAccount = "";
      this.accountNotFound = false;
    }
  }

  get isCompanyCheckDisabled() {
    return !this.firstName || !this.lastName || !this.email;
  }

  get showNewAccountField() {
    return !this.isCompanyCheckDisabled && this.accountNotFound;
  }

  get isSignUpDisabled() {
    return (
      this.isCompanyCheckDisabled ||
      (!this.matchedAccount && !this.newAccountName)
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

  async findContactMatch() {
    if (!this.validateInputs()) {
      return;
    }

    try {
      const result = await getAccountByContactEmail({
        email: this.email
      });

      if (result && result.accountName) {
        this.matchedAccount = result.accountName;
      } else {
        this.matchedAccount = "";
        this.accountNotFound = true;
      }
    } catch (error) {
      console.error("Contact match error:", error);
    }
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
        accountName: this.matchedAccount || this.newAccountName
      });

      console.log("Registration success:", result);
    } catch (error) {
      console.error("Submit error:", error);
    }
  }
}
