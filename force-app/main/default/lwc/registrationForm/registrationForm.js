import { LightningElement } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/RegistrationController.getAccountByContactEmail";
import submitRegistration from "@salesforce/apex/RegistrationController.submitRegistration";
import RegistrationFormOrganizationModal from "c/registrationFormOrganizationModal";

export default class RegistrationForm extends LightningElement {
  firstName = "";
  lastName = "";
  email = "";
  organizationId = "";

  handleChange(event) {
    const field = event.target.name;
    this[field] = event.target.value;
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
    console.log("Modal result:", result);
    if (result) {
      this.organizationId = result;
    }
  }

  get isSignUpDisabled() {
    return !this.lastName || !this.email || !this.organizationId;
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
        accountId: this.organizationId
      });

      console.log("Registration success:", result);
    } catch (error) {
      console.error("Submit error:", error);
    }
  }
}
