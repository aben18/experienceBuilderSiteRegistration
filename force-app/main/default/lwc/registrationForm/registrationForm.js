import { LightningElement, track } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/RegistrationController.getAccountByContactEmail";
import getAccountByName from "@salesforce/apex/RegistrationController.getAccountByName";
import submitRegistration from "@salesforce/apex/RegistrationController.submitRegistration";

export default class RegistrationForm extends LightningElement {
  @track firstName = "";
  @track lastName = "";
  @track email = "";
  @track matchedAccount = "";
  @track accountNotFound = false;
  @track newAccountName = "";
  @track enterNewAccount = false;
  @track companySearchResults = [];

  handleInput(event) {
    this[event.target.name] = event.target.value;

    if (event.target.name === "email") {
      this.matchedAccount = "";
      this.accountNotFound = false;
      this.enterNewAccount = false;
    }
  }

  handleNewAccountCheckboxChange(event) {
    this.enterNewAccount = event.target.checked;
  }

  get isCompanyCheckDisabled() {
    return !this.email;
  }

  get showNewAccountField() {
    return (
      !this.isCompanyCheckDisabled &&
      (this.accountNotFound || this.enterNewAccount)
    );
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

  async getAccountByContactEmail() {
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

  async handleCompanySearch(event) {
    const searchTerm = event.target.value;
    this.newAccountName = searchTerm;

    if (searchTerm.length < 2) {
      this.companySearchResults = [];
      return;
    }

    try {
      const results = await getAccountByName({ name: searchTerm });
      this.companySearchResults = results;
    } catch (error) {
      console.error("Error searching for companies:", error);
      this.companySearchResults = [];
    }
  }

  handleCompanySelect(event) {
    const selectedCompanyName = event.currentTarget.dataset.name;

    this.newAccountName = selectedCompanyName;
    this.companySearchResults = []; // Clear the dropdown after selection
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
        accountName: this.newAccountName || this.matchedAccount
      });

      console.log("Registration success:", result);
    } catch (error) {
      console.error("Submit error:", error);
    }
  }
}
