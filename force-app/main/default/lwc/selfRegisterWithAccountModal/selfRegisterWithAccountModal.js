import { createRecord } from "lightning/uiRecordApi";
import LightningModal from "lightning/modal";
import { api } from "lwc";
import ACCOUNT_OBJECT from "@salesforce/schema/Account";
import NAME_FIELD from "@salesforce/schema/Account.Name";

export default class SelfRegisterWithAccountModal extends LightningModal {
  @api heading;
  accountId;
  accountName = "";

  handleChange(event) {
    const field = event.target.name;
    this[field] = event.target.value;
  }

  handleCancel() {
    this.close();
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

  async handleSubmit() {
    if (!this.validateInputs()) {
      return;
    }

    const fields = {};
    fields[NAME_FIELD.fieldApiName] = this.accountName;
    const recordInput = { apiName: ACCOUNT_OBJECT.objectApiName, fields };
    try {
      const account = await createRecord(recordInput);
      this.accountId = account.id;
    } catch (error) {
      console.error("Error creating account:", error);
    }
    this.close(this.accountId);
  }
}
