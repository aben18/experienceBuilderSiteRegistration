import { LightningElement, track, api } from "lwc";
import getAccountByContactEmail from "@salesforce/apex/SelfRegisterWithAccountController.getAccountByContactEmail";
import submitRegistration from "@salesforce/apex/SelfRegisterWithAccountController.submitRegistration";
import SelfRegisterWithAccountModal from "c/selfRegisterWithAccountModal";
import searchAccounts from "@salesforce/apex/SelfRegisterWithAccountController.searchAccounts";
import getAccountById from "@salesforce/apex/SelfRegisterWithAccountController.getAccountById";


export default class SelfRegisterWithAccount extends LightningElement {
  @api firstNameLabel;
  @api lastNameLabel;
  @api emailLabel;
  @api titleLabel;
  @api accountLabel;
  @api accountSearch;
  @api createAccountMessage;
  @api createAccountButtonLabel;
  @api createAccountModalHeaderLabel;
  @api createAccountModalNameLabel;
  @api createAccountModalCancelButtonLabel;
  @api createAccountModalSubmitButtonLabel;
  @api submitButtonLabel;
  @api cancelLinkLabel;
  @api registrationConfirmationUrl;

  @track contact = {
    FirstName: "",
    LastName: "",
    Email: "",
    JobTitle: "",
    AccountId: ""
  };

  //Account by email account search state
  @track accountSearchComplete = false;
  @track submitError = "";
  @track isLoading = false;

  //Start of Account search added by Andrew

  // Search state
  @track accountSearch = '';
  @track accountOptions = []; // [{ label, value }]
  @track showDropdown = false;

  // Selected account
  @track accountId = '';
  @track selectedAccountLabel = '';

  // Modal state (Andrew's)
  isAccountModalOpen = false;

  // Status
  @track statusMessage = '';

  profileName = '#Ed-Fi: 365 User';
  _searchTimer;

    // ---- Account search (change/focus/blur) ----
    onSearchChange(event) {
      // works for both onchange (detail.value) and oninput (target.value)
      const val =
        (event && event.target && typeof event.target.value === 'string')
          ? event.target.value
          : (event && event.detail && typeof event.detail.value === 'string')
            ? event.detail.value
            : '';
    
      this.accountSearch = val;
      this.showDropdown = true;
    
      clearTimeout(this._searchTimer);
      if (val.trim().length < 2) {
        this.accountOptions = [];
        this.showDropdown = false;
        return;
      }
    
      this._searchTimer = setTimeout(() => this.loadAccounts(), 200);
    }
    
  
    onSearchFocus() {
      if ((this.accountSearch && this.accountSearch.trim().length >= 2) || this.accountOptions.length) {
        this.showDropdown = true;
      }
      if (!this.accountSearchComplete) {
        this.getAccountByContactEmail();
        this.accountSearchComplete = true;
      }
    }
  
    onSearchBlur() {
      setTimeout(() => { this.showDropdown = false; }, 120);
    }
  
    async loadAccounts() {
      try {
        const rows = await searchAccounts({ searchTerm: this.accountSearch, limitSize: 25 });
        // sanity log
        // console.log('search results', rows);
        this.accountOptions = (rows || []).map(r => ({ label: r.Name, value: r.Id }));
        this.showDropdown = this.accountOptions.length > 0;
      } catch (e) {
        console.error('searchAccounts failed', e);
        this.accountOptions = [];
        this.showDropdown = false;
      }
    }
  
    handlePick(event) {
      event.stopPropagation();
      const id = event.currentTarget.dataset.id;
      const label = event.currentTarget.dataset.label;
      this.accountId = id;
      this.contact.AccountId = id;
      this.selectedAccountLabel = label;
      this.accountSearch = label;
      this.showDropdown = false;
      this.setSelectedAccount(id, label);
    }
  
    clearSelectedAccount() {
      this.accountId = '';
      this.contact.AccountId = '';
      this.selectedAccountLabel = '';
      this.accountSearch = '';
      this.accountOptions = [];
      this.showDropdown = false;
    }

    setSelectedAccount(id, label) {
      this.accountId = id;
      this.contact.AccountId = id;
      this.selectedAccountLabel = label || '';
      this.accountSearch = label || '';
      this.accountOptions = [];
      this.showDropdown = false;
    }
    
    
  //End of account search added by Andrew

  get accountSearchPlaceholder() {
    return `Search ${this.accountLabel}...`;
  }

  handleChange(event) {
    const field = event.target.name;
    if (field) {
      this.contact[field] = event.target.value;
      if (field === "Email") {
        this.searchAccountByEmail();
      }
    } 
  }

  async searchAccountByEmail() {
    if (!this.contact.Email || this.contact.Email.trim() === '') return;
    
    try {
      this.isLoading = true;
      const result = await getAccountByContactEmail({ email: this.contact.Email });
      if (result) {
        // Account found, set it as selected
        this.setSelectedAccount(result.Id, result.Name);
        this.accountSearchComplete = true;
      } else {
        // No account found, reset selection
        this.accountId = null;
        this.contact.AccountId = null;
        this.selectedAccountLabel = '';
        this.accountSearchComplete = true;
      }
    } catch (error) {
      console.error('Error searching for account by email:', error);
    } finally {
      this.isLoading = false;
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

    console.log("Passed validity:  " + allValid);
    return allValid;
  }

  handleAccountFocus() {
    if (!this.accountSearchComplete) {
      this.getAccountByContactEmail();
      console.log("Account search complete? " + this.accountSearchComplete);
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
    this.accountSearch = '';
    this.accountOptions = [];
    this.showDropdown = false;

    const result = await SelfRegisterWithAccountModal.open({
      headerLabel: this.createAccountModalHeaderLabel,
      description: `Create a new ${this.accountLabel.toLowerCase()}`,
      size: "small",
      accountNameLabel: this.createAccountModalNameLabel,
      cancelButtonLabel: this.createAccountModalCancelButtonLabel,
      submitButtonLabel: this.createAccountModalSubmitButtonLabel,
    });
  
    if (result) {
      // result is the new Account Id from the modal
      try {
        const acct = await getAccountById({ accountId: result });
        // Safeguard in case the call returns nothing
        const name = acct?.Name || '';
        this.setSelectedAccount(result, name);
      } catch (e) {
        // Fall back to just setting the Id if lookup fails
        this.setSelectedAccount(result, '');
        // optionally surface/log the error
        console.error('getAccountById failed', e);
      }
    }
  }
  

  get isCreateNewAccountDisabled() {
    return (
      !this.contact.Email ||
      !!this.contact.AccountId ||
      !this.accountSearchComplete
    );
  }

  async handleSubmit() {
    if (!this.validateInputs()) {
      console.log("Failed validate input ");
      return;
    }
    
    console.log('Submitting contact:', JSON.stringify(this.contact));

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
