import { LightningElement, track } from "lwc";
import findMatchingContact from "@salesforce/apex/RegistrationController.findMatchingContact";
import submitRegistration from "@salesforce/apex/RegistrationController.submitRegistration";

export default class RegistrationForm extends LightningElement {
  @track firstName = "";
  @track lastName = "";
  @track email = "";
  @track matchedAccount = "";
  @track showNewAccountField = false;
  @track newAccountName = "";

  handleInput(event) {
    this[event.target.name] = event.target.value;
  }

  get isCompanyCheckDisabled() {
    return !this.firstName || !this.lastName || !this.email;
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
      const result = await findMatchingContact({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email
      });

      if (result && result.AccountName) {
        this.matchedAccount = result.AccountName;
        this.showNewAccountField = false;
      } else {
        this.matchedAccount = "";
        this.showNewAccountField = true;
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
